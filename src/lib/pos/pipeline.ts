import "server-only";
import db from "@/db/db";
import { isEnabled } from "@/lib/flags";
import { sendMail } from "@/lib/email";
import { sendTelegramMessage } from "@/lib/telegram";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { deriveOrderType } from "@/lib/orderType";
import { getActiveConnection, loadContext } from "./connection";
import { cartToPosOrder } from "./fromCart";
import { getAdapter, POS_LABELS } from "./registry";
import { opsAlert } from "@/lib/ops/alert";
import { PosError, type PosOrderInput, type PosProvider } from "./types";

// Paid order → POS. Called at the END of finalizeCart, after the owner's normal
// Telegram/email alert has already gone out, so a POS problem can never stop
// the owner hearing about an order.
//
//   attempt now ─ok→ sent
//        └─fail→ retryable? schedule nextRetryAt (1m, 2m, 4m, 8m → 5 attempts in ~15 min)
//                 └ n8n calls /api/pos/retry → retryDuePosOrders()
//        └─gives up (non-retryable / max attempts / no scheduler)
//                 → status "manual" + owner told to key the order in by hand.
//
// Off unless flag "pos_push" is on AND a POS is connected. Kill switch:
// STARVEGA_KILL_POS_PUSH=1. Never logs tokens or customer phone numbers.

export const BACKOFF_MINUTES = [1, 2, 4, 8];
export const MAX_ATTEMPTS = BACKOFF_MINUTES.length + 1;

/** Without a scheduler (n8n + STARVEGA_JOBS_SECRET) nothing would retry later. */
const hasScheduler = () => !!process.env.STARVEGA_JOBS_SECRET?.trim();

export type PushOutcome = "skipped" | "sent" | "retrying" | "manual";

export async function pushOrderToPos(cartId: string, email: string): Promise<PushOutcome> {
  if (!(await isEnabled("pos_push"))) return "skipped";
  const conn = await getActiveConnection();
  if (!conn) return "skipped";
  const provider = conn.provider as PosProvider;
  if (getAdapter(provider).support === "scaffold") return "skipped";

  const sync = await db.posOrderSync.upsert({
    where: { cartId_provider: { cartId, provider } },
    update: {},
    create: { cartId, provider, status: "pending" },
  });
  if (sync.status === "sent" || sync.status === "manual") return sync.status as PushOutcome;
  return attempt(sync.id, email);
}

export async function retryDuePosOrders(limit = 10): Promise<{ tried: number; sent: number }> {
  if (!(await isEnabled("pos_push"))) return { tried: 0, sent: 0 };
  const due = await db.posOrderSync.findMany({
    where: { status: "failed", nextRetryAt: { lte: new Date() } },
    orderBy: { nextRetryAt: "asc" },
    take: limit,
  });
  let sent = 0;
  for (const s of due) if ((await attempt(s.id, "")) === "sent") sent++;
  return { tried: due.length, sent };
}

/** Owner pressed "Retry now" in admin. */
export async function retryOne(syncId: string): Promise<PushOutcome> {
  await db.posOrderSync.update({ where: { id: syncId }, data: { status: "failed", nextRetryAt: new Date() } });
  return attempt(syncId, "");
}

async function attempt(syncId: string, email: string): Promise<PushOutcome> {
  const sync = await db.posOrderSync.findUnique({ where: { id: syncId } });
  if (!sync || sync.status === "sent") return "sent";
  const provider = sync.provider as PosProvider;
  const adapter = getAdapter(provider);
  const attempts = sync.attempts + 1;
  let order: PosOrderInput | undefined;

  try {
    const conn = await db.posConnection.findUnique({ where: { provider } });
    if (!conn || conn.status !== "connected") throw new PosError(`${POS_LABELS[provider]} is not connected`, false);

    const cart = await db.cart.findUnique({
      where: { id: sync.cartId },
      include: { items: { include: { sides: true } } },
    });
    if (!cart || !cart.items.length) throw new PosError("order not found", false);
    const camp = cart.promoCampaignId
      ? await db.loyaltyCampaign.findUnique({ where: { id: cart.promoCampaignId }, select: { discountPercent: true } })
      : null;
    order = cartToPosOrder(cart, {
      email, // only known on the first (inline) attempt; optional for the POS
      discountPercent: camp?.discountPercent,
      isDelivery: deriveOrderType(cart.items[0]) === "delivery",
      timezone: SITE_CONFIG.timezone,
    });

    const ctx = await loadContext(conn);
    const res = await adapter.pushOrder(ctx, order, {
      existingPosOrderId: sync.posOrderId,
      onCreated: async (posOrderId) => {
        await db.posOrderSync.update({ where: { id: syncId }, data: { posOrderId } });
      },
    });
    const mismatch =
      res.posTotalCents !== undefined && Math.abs(res.posTotalCents - order.totalCents) > 1
        ? `POS total ${res.posTotalCents}¢ ≠ charged ${order.totalCents}¢`
        : null;
    await db.posOrderSync.update({
      where: { id: syncId },
      data: { status: "sent", posOrderId: res.posOrderId, attempts, lastError: mismatch, nextRetryAt: null },
    });
    return "sent";
  } catch (e) {
    const message = (e as Error).message.slice(0, 500);
    const retryable = e instanceof PosError ? e.retryable : true;
    console.error(`POS push failed (cart ${sync.cartId}, ${provider}, attempt ${attempts}): ${message}`);
    const giveUp = !retryable || attempts >= MAX_ATTEMPTS || !hasScheduler();
    if (giveUp) {
      await db.posOrderSync.update({
        where: { id: syncId },
        data: { status: "manual", attempts, lastError: message, nextRetryAt: null },
      });
      await alertManual(sync.cartId, provider, message, order);
      await opsAlert("pos_manual", `Order ${sync.cartId} needs manual entry in ${provider}: ${message}`);
      return "manual";
    }
    await db.posOrderSync.update({
      where: { id: syncId },
      data: {
        status: "failed",
        attempts,
        lastError: message,
        nextRetryAt: new Date(Date.now() + BACKOFF_MINUTES[attempts - 1] * 60_000),
      },
    });
    return "retrying";
  }
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

function orderHtml(o: PosOrderInput): string {
  const f = o.fulfillment;
  const lines = o.lines
    .map(
      (l) =>
        `<li>${l.quantity} × ${esc(l.name)} ($${((l.unitPriceCents * l.quantity) / 100).toFixed(2)})${
          l.modifiers.length ? `<br><span style="color:#78716c">${l.modifiers.map((m) => esc(m.name)).join(", ")}</span>` : ""
        }</li>`,
    )
    .join("");
  return `<p><b>${f.type === "delivery" ? `Delivery to ${esc(f.deliveryAddress ?? "")}` : `Pickup ${f.pickupAt ? new Date(f.pickupAt).toLocaleString("en-US", { timeZone: f.timezone }) : "ASAP"}`}</b><br>
    ${esc(o.customer.name ?? "")} ${esc(o.customer.phone ?? "")}${f.note ? `<br>Note: ${esc(f.note)}` : ""}</p>
    <ul>${lines}</ul>
    <p>Total paid: <b>$${(o.totalCents / 100).toFixed(2)}</b> (paid online)</p>`;
}

async function alertManual(cartId: string, provider: PosProvider, reason: string, order?: PosOrderInput) {
  const pos = POS_LABELS[provider];
  const short = cartId.slice(0, 8);
  await sendTelegramMessage(
    `⚠️ Order ${short} did NOT reach your ${pos}. Please enter it in ${pos} by hand (details are in the new-order alert). Reason: ${reason}`,
  ).catch(() => {});
  const to = process.env.OWNER_ALERT_EMAIL || process.env.SMTP_USER;
  if (!to) return;
  await sendMail({
    to,
    subject: `Action needed: order ${short} didn't reach ${pos} - ${SITE_CONFIG.name}`,
    html: `<div style="font-family:system-ui,Segoe UI,sans-serif;font-size:15px;color:#1c1917">
      <h2 style="margin:0 0 12px">Please enter this order in ${pos} by hand</h2>
      <p>Order <strong>${short}</strong> was paid on your website, but sending it to ${pos} failed.</p>
      ${order ? orderHtml(order) : `<p>The full order is in the "New order" email you already received.</p>`}
      <p style="color:#78716c;font-size:13px">Reason: ${reason.replace(/</g, "&lt;")}</p>
      <p style="color:#78716c;font-size:13px">You can retry from your dashboard → POS.</p></div>`,
  }).catch((e) => console.error("POS manual-alert email failed:", (e as Error).message));
}
