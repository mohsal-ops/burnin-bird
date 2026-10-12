import { posFetch } from "../http";
import {
  PosError,
  type PosAdapter,
  type PosContext,
  type PosCreds,
  type PosEnvironment,
  type PosMenu,
  type PosMenuModifierGroup,
  type PosOrderInput,
} from "../types";

// Clover adapter — built against the official REST docs (see
// docs/research/U3-clover-single-merchant.md and docs/pos/clover.md).
// Works in the Clover sandbox today. Real merchants need our app approved by
// Clover first (even a private, single-merchant app), so admin labels it
// "needs Clover approval" until that happens.
//
// Order push: atomic_order (one call creates the order with its lines) →
// record an external payment against a "Website" tender → fire a print event
// so the ticket comes out in the kitchen. Clover has no idempotency keys, so
// the pipeline stores the Clover order id the moment it exists (onCreated) and
// passes it back on retries instead of creating a second order.

const oauthHost = (env: PosEnvironment) =>
  env === "production" ? "https://www.clover.com" : "https://sandbox.dev.clover.com";
const apiHost = (env: PosEnvironment) =>
  env === "production" ? "https://api.clover.com" : "https://apisandbox.dev.clover.com";

const TENDER_LABEL = "Website (paid online)";
const MAX_REPEAT = 50;

function appCreds() {
  return { id: (process.env.CLOVER_APP_ID || "").trim(), secret: (process.env.CLOVER_APP_SECRET || "").trim() };
}

function mBase(ctx: PosContext) {
  if (!ctx.merchantId) throw new PosError("Clover merchant id missing", false);
  return `${apiHost(ctx.environment)}/v3/merchants/${encodeURIComponent(ctx.merchantId)}`;
}
const auth = (ctx: PosContext) => ({ Authorization: `Bearer ${ctx.creds.accessToken}` });

type CloverToken = {
  access_token: string;
  access_token_expiration?: number;
  refresh_token?: string;
};
function toCreds(t: CloverToken, prev?: PosCreds): PosCreds {
  return {
    accessToken: t.access_token,
    refreshToken: t.refresh_token ?? prev?.refreshToken,
    expiresAt: t.access_token_expiration ? new Date(t.access_token_expiration * 1000).toISOString() : undefined,
  };
}

/** Build the atomic_order body. Exported for contract tests. */
export function buildCloverOrder(order: PosOrderInput) {
  const f = order.fulfillment;
  const lineItems: { name: string; price: number; note?: string; modifications?: { name: string; amount: number }[] }[] = [];
  for (const l of order.lines) {
    const modsTotal = l.modifiers.reduce((s, m) => s + m.priceCents, 0);
    // Clover counts quantity as repeated line items.
    for (let i = 0; i < Math.min(l.quantity, MAX_REPEAT); i++) {
      lineItems.push({
        name: l.name.slice(0, 127),
        price: Math.max(0, l.unitPriceCents - modsTotal),
        modifications: l.modifiers.length
          ? l.modifiers.map((m) => ({ name: m.name.slice(0, 127), amount: m.priceCents }))
          : undefined,
      });
    }
  }
  if (order.deliveryFeeCents > 0) lineItems.push({ name: "Delivery fee", price: order.deliveryFeeCents });

  const who = [order.customer.name, order.customer.phone].filter(Boolean).join(" ");
  const when =
    f.type === "delivery"
      ? `DELIVERY (courier) to: ${f.deliveryAddress ?? "see online order"}`
      : `PICKUP ${f.pickupAt ? new Date(f.pickupAt).toLocaleString("en-US", { timeZone: f.timezone }) : "ASAP"}`;
  return {
    orderCart: {
      // Clover keeps paymentState "OPEN" for payments recorded via REST (verified
      // in sandbox 2026-10-12), so the ticket itself must say it's paid.
      title: `PAID ONLINE - DO NOT CHARGE ${who}`.trim().slice(0, 127),
      note: [when, f.note, `Paid online · ref ${order.externalId}`].filter(Boolean).join(" — ").slice(0, 255),
      lineItems,
      discounts: order.discountCents > 0 ? [{ name: "Online promo", amount: -order.discountCents }] : undefined,
    },
  };
}

type CloverItem = {
  id: string;
  name?: string;
  price?: number;
  hidden?: boolean;
  available?: boolean;
  deleted?: boolean;
  categories?: { elements?: { name?: string }[] };
  modifierGroups?: { elements?: { id: string }[] };
};
type CloverModGroup = {
  id: string;
  name?: string;
  minRequired?: number;
  maxAllowed?: number;
  modifiers?: { elements?: { id: string; name?: string; price?: number }[] };
};

/** Normalise Clover items + modifier groups. Exported for tests. */
export function normaliseCloverMenu(items: CloverItem[], groups: CloverModGroup[]): PosMenu {
  const g = new Map(groups.map((x) => [x.id, x]));
  return {
    items: items
      .filter((i) => !i.deleted && !i.hidden)
      .map((i) => ({
        posId: i.id,
        name: i.name ?? "Item",
        priceCents: i.price ?? 0,
        available: i.available !== false,
        category: i.categories?.elements?.[0]?.name ?? "Menu",
        modifierGroups: (i.modifierGroups?.elements ?? [])
          .map((ref) => g.get(ref.id))
          .filter((x): x is CloverModGroup => !!x)
          .map(
            (mg): PosMenuModifierGroup => ({
              posId: mg.id,
              name: mg.name ?? "Options",
              required: (mg.minRequired ?? 0) > 0,
              maxSelect: mg.maxAllowed && mg.maxAllowed > 0 ? mg.maxAllowed : null,
              modifiers: (mg.modifiers?.elements ?? []).map((m) => ({
                posId: m.id,
                name: m.name ?? "",
                priceCents: m.price ?? 0,
              })),
            }),
          ),
      })),
  };
}

async function listAll<T>(url: string, ctx: PosContext): Promise<T[]> {
  const out: T[] = [];
  for (let offset = 0; offset < 10_000; offset += 1000) {
    const sep = url.includes("?") ? "&" : "?";
    const r = await posFetch<{ elements?: T[] }>(`${url}${sep}limit=1000&offset=${offset}`, { headers: auth(ctx) });
    const els = r.elements ?? [];
    out.push(...els);
    if (els.length < 1000) break;
  }
  return out;
}

async function websiteTenderId(ctx: PosContext): Promise<string> {
  const tenders = await listAll<{ id: string; label?: string; labelKey?: string; enabled?: boolean }>(
    `${mBase(ctx)}/tenders`,
    ctx,
  );
  const ours = tenders.find((t) => t.label === TENDER_LABEL);
  if (ours) return ours.id;
  // Our own "Website (paid online)" tender (needs the Merchant WRITE permission).
  // Clover's built-in External Payment tender is often DISABLED on merchants,
  // so it's only a last resort.
  try {
    const created = await posFetch<{ id: string }>(`${mBase(ctx)}/tenders`, {
      headers: auth(ctx),
      body: { label: TENDER_LABEL, enabled: true, visible: true, opensCashDrawer: false, editable: false },
    });
    return created.id;
  } catch (e) {
    const ext = tenders.find((t) => t.labelKey === "com.clover.tender.external_payment");
    if (ext) return ext.id;
    throw e;
  }
}

export const cloverAdapter: PosAdapter = {
  provider: "clover",
  support: "built_needs_approval",

  authorizeUrl({ environment, state, redirectUri }) {
    const q = new URLSearchParams({ client_id: appCreds().id, redirect_uri: redirectUri, state });
    return `${oauthHost(environment)}/oauth/v2/authorize?${q}`;
  },

  async exchangeCode({ environment, code, merchantId }) {
    const { id, secret } = appCreds();
    if (!id || !secret) throw new PosError("Clover app credentials are not configured", false);
    const t = await posFetch<CloverToken>(`${apiHost(environment)}/oauth/v2/token`, {
      body: { client_id: id, client_secret: secret, code },
    });
    return { creds: toCreds(t), merchantId };
  },

  async refresh(environment, creds) {
    if (!creds.refreshToken) return creds;
    const t = await posFetch<CloverToken>(`${apiHost(environment)}/oauth/v2/refresh`, {
      body: { client_id: appCreds().id, refresh_token: creds.refreshToken },
    });
    return toCreds(t, creds);
  },

  async listLocations(ctx) {
    const m = await posFetch<{ id: string; name?: string }>(mBase(ctx), { headers: auth(ctx) });
    return [{ id: m.id, name: m.name ?? m.id }];
  },

  async importMenu(ctx) {
    const [items, groups] = await Promise.all([
      listAll<CloverItem>(`${mBase(ctx)}/items?expand=categories,modifierGroups`, ctx),
      listAll<CloverModGroup>(`${mBase(ctx)}/modifier_groups?expand=modifiers`, ctx),
    ]);
    return normaliseCloverMenu(items, groups);
  },

  async pushOrder(ctx, order, hooks) {
    let orderId = hooks?.existingPosOrderId ?? null;
    let total = order.totalCents;
    if (!orderId) {
      const created = await posFetch<{ id: string; total?: number }>(`${mBase(ctx)}/atomic_order/orders`, {
        headers: auth(ctx),
        body: buildCloverOrder(order),
      });
      orderId = created.id;
      total = created.total ?? total;
      await hooks?.onCreated?.(orderId);
    }
    const externalPaymentId = `sv-${order.externalId}`.slice(0, 32);
    if (hooks?.existingPosOrderId) {
      // Retry after a partial failure: don't record the payment twice.
      const paid = await listAll<{ externalPaymentId?: string }>(
        `${mBase(ctx)}/orders/${encodeURIComponent(orderId)}/payments`,
        ctx,
      );
      if (paid.some((p) => p.externalPaymentId === externalPaymentId)) return { posOrderId: orderId, posTotalCents: total };
    }
    const tenderId = await websiteTenderId(ctx);
    await posFetch(`${mBase(ctx)}/orders/${encodeURIComponent(orderId)}/payments`, {
      headers: auth(ctx),
      body: {
        tender: { id: tenderId },
        amount: total,
        tipAmount: order.tipCents || undefined,
        result: "SUCCESS",
        externalPaymentId,
      },
    });
    // Lock the order so staff can't add to / re-ring a ticket that's already
    // paid. Best-effort.
    await posFetch(`${mBase(ctx)}/orders/${encodeURIComponent(orderId)}`, {
      headers: auth(ctx),
      body: { state: "locked" },
    }).catch(() => {});
    // Print the ticket in the kitchen. Best-effort: the order is already in Clover.
    await posFetch(`${mBase(ctx)}/print_event`, { headers: auth(ctx), body: { orderRef: { id: orderId } } }).catch(
      () => {},
    );
    return { posOrderId: orderId, posTotalCents: total };
  },
};
