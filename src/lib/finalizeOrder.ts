import "server-only";
import db from "@/db/db";
import { google } from "googleapis";
import { sendTelegramMessage } from "@/lib/telegram";
import { sendMail } from "@/lib/email";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { getUberDirect } from "@/lib/siteSettings";
import { createDelivery } from "@/lib/uber";
import { deriveOrderType } from "@/lib/orderType";
import { NEW_ORDER, PAID_STATUSES, isPaid } from "@/lib/orderStatus";
import { pushOrderToPos } from "@/lib/pos/pipeline";
import { REDEMPTION_WINDOW_DAYS } from "@/lib/loyaltyPromo";
import { cartTotalCents } from "@/lib/cartTotal";
import { dispatchRoutedDelivery } from "@/lib/delivery/dispatch";
import { pushToOwners } from "@/lib/push/send";
import { ownerNewOrderMessage } from "@/lib/push/messages";

// One place that finalizes a paid cart: mark it "new" (a real, paid order
// waiting on the kitchen - it counts as revenue AND triggers the kitchen
// new-order alarm), save orders, dispatch the Uber courier for delivery, log to
// the sheet, and notify the owner + customer.
//
// Called from BOTH the Stripe webhook AND the success page. It's race-safe and
// idempotent via an atomic "claim" (updateMany where status != completed), so
// whichever fires first wins and the other no-ops. This is what makes orders
// complete even if the Stripe webhook isn't configured/firing.

function toE164(phone?: string | null): string {
  const raw = (phone || "").trim();
  if (raw.startsWith("+")) return raw;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return digits ? `+${digits}` : "";
}

function sheetsClient() {
  const key = JSON.parse(process.env.GOOGLE_SERVICE_KEY || "{}");
  if (!key.client_email) return null;
  const auth = new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

// Customer-typed text goes into the owner's email HTML - escape it so nobody
// can inject links/markup into the restaurant's inbox.
function esc(v: unknown): string {
  return String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function finalizeCart(
  cartId: string | undefined,
  email: string,
  // What Stripe actually collected (pi.amount_received). When given, the cart's
  // CURRENT total must be covered - items added after checkout opened (paid at
  // the old total) never become a "paid" order.
  amountPaidCents?: number,
): Promise<{ finalized: boolean; alreadyDone?: boolean; mismatch?: boolean }> {
  if (!cartId) return { finalized: false };

  const cart = await db.cart.findUnique({
    where: { id: cartId },
    include: { items: { include: { sides: true } } },
  });
  if (!cart || cart.items.length === 0) return { finalized: false };
  if (isPaid(cart.status)) return { finalized: false, alreadyDone: true };

  if (typeof amountPaidCents === "number") {
    const { total } = await cartTotalCents(cart);
    if (amountPaidCents < total) {
      console.error(`finalizeCart: cart ${cartId} paid ${amountPaidCents} < total ${total} - not finalized`);
      const to = process.env.OWNER_ALERT_EMAIL || process.env.SMTP_USER;
      if (to) {
        await sendMail({
          to,
          subject: "Payment didn't match an order - check it",
          html: `<p>A customer paid <b>$${(amountPaidCents / 100).toFixed(2)}</b> but their cart totals <b>$${(total / 100).toFixed(2)}</b> (items changed after checkout opened). The order was <b>not</b> sent to the kitchen. Check Stripe (cart ${cartId}) and contact the customer or refund.</p>`,
        }).catch(() => {});
      }
      return { finalized: false, mismatch: true };
    }
  }

  // Atomically claim the cart. If another caller (webhook vs success page) already
  // claimed it, count is 0 and we stop - no duplicate orders/dispatch/emails.
  // Paid carts become "new" (a fresh order for the kitchen), not "completed".
  const claim = await db.cart.updateMany({
    where: { id: cartId, status: { notIn: [...PAID_STATUSES] } },
    data: { status: NEW_ORDER },
  });
  if (claim.count === 0) return { finalized: false, alreadyDone: true };

  const first = cart.items[0];

  // Orders + user (for history / most-ordered stats).
  try {
    let user = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) user = await db.user.create({ data: { email }, select: { id: true } });
    for (const it of cart.items) {
      if (!it.productId) continue;
      await db.order.create({
        data: {
          userId: user.id,
          productId: it.productId,
          pricePaidInCents: (it.price ?? 0) * (it.quantity ?? 1),
        },
      });
    }
  } catch (e) {
    console.error("finalizeCart: order rows failed (cart still completed):", (e as Error).message);
  }

  // Loyalty redemption: a completed order that used a campaign promo code counts
  // as one redemption for that campaign. Best-effort - never blocks the order.
  if (cart.promoCampaignId) {
    await db.loyaltyCampaign
      .update({ where: { id: cart.promoCampaignId }, data: { redemptionCount: { increment: 1 } } })
      .catch((e) => console.error("finalizeCart: redemption increment failed:", (e as Error).message));
  }

  // Courier chosen by the delivery router (deliveryProvider set only when the
  // "delivery_router" flag was on at checkout) → router dispatch with one
  // failover. Carts without it use the original Uber block below, unchanged.
  const routedCourier = !!cart.deliveryProvider && deriveOrderType(first) === "delivery";
  if (routedCourier) await dispatchRoutedDelivery(cart, first, email);

  // Uber Direct dispatch (delivery only, when enabled). Best-effort.
  if (!routedCourier) try {
    const uber = await getUberDirect();
    if (deriveOrderType(first) === "delivery" && first.deliveryAddress) {
      if (!cart.uberQuoteId || !uber.enabled) {
        // Checkout now refuses delivery without a quote, so this is a safety net
        // (e.g. a cart paid before that guard shipped). Always tell the owner
        // WHY, so a missing courier never needs a code read to diagnose.
        const reason =
          cart.uberQuoteError ||
          (!uber.enabled ? "Uber Direct delivery is turned off in the dashboard." : "");
        await sendTelegramMessage(
          `⚠️ Delivery order ${cart.id} has no Uber quote - please arrange delivery manually.` +
            (reason ? ` Reason: ${reason}` : ""),
        ).catch(() => {});
      } else {
        const dropoffNotes = [first.apt ? `Apt/Suite: ${first.apt}` : "", first.instructions || ""]
          .filter(Boolean)
          .join(" - ");
        const delivery = await createDelivery({
          quoteId: cart.uberQuoteId,
          pickup: {
            formatted: SITE_CONFIG.address,
            lat: SITE_CONFIG.lat,
            lng: SITE_CONFIG.lng,
            name: SITE_CONFIG.name,
            businessName: SITE_CONFIG.name,
            phone: toE164(SITE_CONFIG.phone),
          },
          dropoff: {
            formatted: first.deliveryAddress,
            lat: first.deliveryLat,
            lng: first.deliveryLng,
            name: first.customerName || "Customer",
            phone: toE164(first.customerPhone),
            notes: dropoffNotes || undefined,
          },
          manifestItems: cart.items
            .filter((it) => it.name)
            .map((it) => ({ name: it.name as string, quantity: it.quantity ?? 1 })),
          externalId: `${cart.id}|${SITE_CONFIG.siteUrl}`,
        });
        await db.cart.update({
          where: { id: cart.id },
          data: {
            uberDeliveryId: delivery.id,
            uberStatus: delivery.status,
            uberTrackingUrl: delivery.trackingUrl ?? null,
          },
        });
        if (delivery.trackingUrl && email && email !== "N/A") {
          await sendMail({
            to: email,
            subject: `Your ${SITE_CONFIG.name} order is on the way 🚗`,
            html: `<div style="font-family:system-ui,Segoe UI,sans-serif;font-size:15px;color:#1c1917">
              <h2 style="margin:0 0 12px">Your order is on the way</h2>
              <p>A courier is bringing your ${SITE_CONFIG.name} order to ${first.deliveryAddress ?? "your address"}.</p>
              <p style="margin:18px 0"><a href="${delivery.trackingUrl}" style="background:#1c1917;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Track your delivery</a></p>
              <p style="color:#78716c;font-size:13px">This link stays live until your order arrives.</p></div>`,
          }).catch((e) => console.error("Customer tracking email failed:", e));
        }
      }
    }
  } catch (e) {
    console.error("Uber Direct dispatch failed (order still saved):", (e as Error).message);
    await sendTelegramMessage(
      `⚠️ Uber delivery dispatch FAILED for order ${cart.id}: ${(e as Error).message}. Please arrange delivery manually.`,
    ).catch(() => {});
  }

  const itemsList = cart.items
    .map((it) => {
      if (!it.name) return null;
      const quantity = it.quantity ?? 1;
      // CartItem.price is the unit price WITH the chosen sides already included
      // (set at add-to-cart), so sides must not be added again here.
      const totalPrice = ((it.price ?? 0) * quantity) / 100;
      const sidesStr = it.sides.map((s) => s.label).join(" | ");
      return `${it.name} x${quantity} ($${totalPrice.toFixed(2)})` + (sidesStr ? " → " + sidesStr : "");
    })
    .filter(Boolean)
    .join(" | ");

  // Same math as checkout (Menu/[id]/purchase): items − promo discount + delivery fee.
  const orderType = deriveOrderType(first);
  const itemsCents = cart.items.reduce((sum, it) => sum + (it.price ?? 0) * (it.quantity ?? 1), 0);
  const promoPct = cart.promoCampaignId
    ? (await db.loyaltyCampaign
        .findFirst({
          // Same rule as checkout: the code only counts inside its redemption window.
          where: { id: cart.promoCampaignId, sentAt: { gte: new Date(Date.now() - REDEMPTION_WINDOW_DAYS * 86400_000) } },
          select: { discountPercent: true },
        })
        .catch(() => null))?.discountPercent ?? 0
    : 0;
  const discountCents = Math.round((itemsCents * promoPct) / 100);
  const deliveryFeeCents = orderType === "delivery" ? cart.uberFeeCents ?? 0 : 0;
  const total = (Math.max(0, itemsCents - discountCents) + deliveryFeeCents) / 100;

  // Google sheet log (best-effort).
  try {
    const sheets = sheetsClient();
    if (sheets && process.env.GOOGLE_SHEET_ID) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "Sheet1!A1",
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: [[
            cart.id, orderType, first.customerName || "", first.customerPhone || "", email,
            first.deliveryAddress || "", first.deliveryLat ?? "", first.deliveryLng ?? "",
            first.apt || "", first.instructions || "",
            first.pickupDay ? new Date(first.pickupDay).toDateString() : "", first.pickupTime || "",
            itemsList, total, new Date().toLocaleString(),
          ]],
        },
      });
    }
  } catch (e) {
    console.error("Google Sheets append failed (order still saved):", e);
  }

  // Owner notification (Telegram).
  await sendTelegramMessage(
    `<b>🔔 New order - $${total.toFixed(2)}</b>\nType: ${orderType}\n` +
      (first.customerName ? `Name: ${first.customerName}\n` : "") +
      (first.customerPhone ? `Phone: ${first.customerPhone}\n` : "") +
      (orderType === "delivery"
        ? `Address: ${first.deliveryAddress}${first.apt ? ` (${first.apt})` : ""}\n` +
          (first.instructions ? `Instructions: ${first.instructions}\n` : "")
        : `Pickup: ${first.pickupDay ? new Date(first.pickupDay).toDateString() : ""} ${first.pickupTime ?? ""}\n`) +
      `Items: ${itemsList}`,
  ).catch(() => {});

  // Owner web push (flag "web_push"; no-op otherwise). Best-effort.
  await pushToOwners(ownerNewOrderMessage(Math.round(total * 100), orderType)).catch(() => 0);

  // Owner email (best-effort).
  try {
    const alertTo = process.env.OWNER_ALERT_EMAIL || process.env.SMTP_USER;
    if (alertTo) {
      await sendMail({
        to: alertTo,
        subject: `New order - $${total.toFixed(2)} - ${SITE_CONFIG.name}`,
        html: `<div style="font-family:system-ui,Segoe UI,sans-serif;font-size:15px;color:#1c1917">
          <h2 style="margin:0 0 12px">New ${orderType} order - $${total.toFixed(2)}</h2>
          <table style="border-collapse:collapse">
            ${first.customerName ? `<tr><td style="padding:4px 14px 4px 0;color:#78716c">Name</td><td>${esc(first.customerName)}</td></tr>` : ""}
            ${first.customerPhone ? `<tr><td style="padding:4px 14px 4px 0;color:#78716c">Phone</td><td>${esc(first.customerPhone)}</td></tr>` : ""}
            <tr><td style="padding:4px 14px 4px 0;color:#78716c">Email</td><td>${esc(email)}</td></tr>
            ${orderType === "delivery"
              ? `<tr><td style="padding:4px 14px 4px 0;color:#78716c">Deliver to</td><td>${esc(first.deliveryAddress ?? "")}${first.apt ? ` (${esc(first.apt)})` : ""}</td></tr>`
              : `<tr><td style="padding:4px 14px 4px 0;color:#78716c">Pickup</td><td>${first.pickupDay ? new Date(first.pickupDay).toDateString() : ""} ${esc(first.pickupTime ?? "")}</td></tr>`}
            <tr><td style="padding:4px 14px 4px 0;color:#78716c;vertical-align:top">Items</td><td>${esc(itemsList).replace(/\n/g, "<br>")}</td></tr>
            <tr><td style="padding:4px 14px 4px 0;color:#78716c">Total</td><td><strong>$${total.toFixed(2)}</strong></td></tr>
          </table></div>`,
      });
    }
  } catch (e) {
    console.error("Order email failed (order still saved):", e);
  }

  // POS push (Square/Clover). Runs LAST so the owner alerts above always go out
  // first. No-op unless the "pos_push" flag is on and a POS is connected; on
  // failure it schedules retries / tells the owner to enter it by hand.
  await pushOrderToPos(cart.id, email).catch((e) =>
    console.error("POS push error (order still saved):", (e as Error).message),
  );

  // NOTE: no revalidatePath here - finalizeCart runs from the success PAGE (a
  // Server Component render, where revalidatePath throws) as well as the webhook.
  // The admin Orders view auto-refreshes on its own, so it picks this up.
  return { finalized: true };
}
