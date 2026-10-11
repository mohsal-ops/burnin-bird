import { posFetch } from "../http";
import {
  PosError,
  type PosAdapter,
  type PosContext,
  type PosCreds,
  type PosEnvironment,
  type PosMenu,
  type PosMenuItem,
  type PosMenuModifierGroup,
  type PosOrderInput,
} from "../types";

// Square adapter — built against the official API docs (see
// docs/research/U1-U2-square-orders.md and docs/pos/square.md).
//
// Order push: CreateOrder (ad-hoc named lines at the price the customer paid,
// so totals always match what Stripe charged) → CreatePayment with
// source_id "EXTERNAL" (money was taken by Stripe, Square only records it)
// → PayOrder. Every call carries an idempotency key derived from our cart id,
// so a retry after a partial failure never duplicates the order or payment.
//
// Delivery is sent as a PICKUP fulfillment with the address in the note:
// Square's DELIVERY fulfillment type appears restricted to partners.

export const SQUARE_VERSION = "2025-01-23";
const SCOPES = ["MERCHANT_PROFILE_READ", "ITEMS_READ", "ORDERS_READ", "ORDERS_WRITE", "PAYMENTS_WRITE"];

const base = (env: PosEnvironment) =>
  env === "production" ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com";

function appCreds(env: PosEnvironment) {
  const id =
    (env === "sandbox" && process.env.SQUARE_SANDBOX_APPLICATION_ID) || process.env.SQUARE_APPLICATION_ID || "";
  const secret =
    (env === "sandbox" && process.env.SQUARE_SANDBOX_APPLICATION_SECRET) ||
    process.env.SQUARE_APPLICATION_SECRET ||
    "";
  return { id: id.trim(), secret: secret.trim() };
}

function headers(ctx: PosContext) {
  return { Authorization: `Bearer ${ctx.creds.accessToken}`, "Square-Version": SQUARE_VERSION };
}

const money = (amount: number) => ({ amount: Math.max(0, Math.round(amount)), currency: "USD" });

type TokenResponse = { access_token: string; refresh_token?: string; expires_at?: string; merchant_id?: string };

function toCreds(t: TokenResponse, prev?: PosCreds): PosCreds {
  return {
    accessToken: t.access_token,
    refreshToken: t.refresh_token ?? prev?.refreshToken,
    expiresAt: t.expires_at,
  };
}

/** Build the CreateOrder body. Exported for contract tests. */
export function buildSquareOrder(order: PosOrderInput, locationId: string) {
  const f = order.fulfillment;
  const noteParts = [
    f.type === "delivery" ? `DELIVERY (courier) to: ${f.deliveryAddress ?? "see online order"}` : "",
    f.note ?? "",
    "Paid online",
  ].filter(Boolean);
  const pickupAt = f.pickupAt ?? new Date(Date.now() + 20 * 60_000).toISOString();

  return {
    idempotency_key: `sv-order-${order.externalId}`,
    order: {
      location_id: locationId,
      reference_id: order.externalId.slice(0, 40),
      source: { name: "Online ordering" },
      line_items: order.lines.map((l) => {
        const modsTotal = l.modifiers.reduce((s, m) => s + m.priceCents, 0);
        return {
          name: l.name.slice(0, 512),
          quantity: String(l.quantity),
          base_price_money: money(l.unitPriceCents - modsTotal),
          modifiers: l.modifiers.map((m) => ({ name: m.name.slice(0, 255), base_price_money: money(m.priceCents) })),
        };
      }),
      discounts:
        order.discountCents > 0
          ? [{ uid: "promo", name: "Online promo", amount_money: money(order.discountCents), scope: "ORDER" }]
          : undefined,
      service_charges:
        order.deliveryFeeCents > 0
          ? [
              {
                uid: "delivery",
                name: "Delivery fee",
                amount_money: money(order.deliveryFeeCents),
                calculation_phase: "SUBTOTAL_PHASE",
                taxable: false,
              },
            ]
          : undefined,
      fulfillments: [
        {
          type: "PICKUP",
          state: "PROPOSED",
          pickup_details: {
            recipient: {
              display_name: (order.customer.name || "Online customer").slice(0, 255),
              phone_number: order.customer.phone || undefined,
              email_address: order.customer.email || undefined,
            },
            schedule_type: "SCHEDULED",
            pickup_at: pickupAt,
            note: noteParts.join(" — ").slice(0, 500),
          },
        },
      ],
    },
  };
}

function sold(variation: SqVariation, locationId?: string | null): boolean {
  const o = variation.item_variation_data?.location_overrides?.find((x) => x.location_id === locationId);
  return !o?.sold_out;
}

type SqVariation = {
  id: string;
  item_variation_data?: {
    name?: string;
    price_money?: { amount?: number };
    location_overrides?: { location_id?: string; sold_out?: boolean }[];
  };
};
type SqObject = {
  id: string;
  type: string;
  is_deleted?: boolean;
  present_at_all_locations?: boolean;
  present_at_location_ids?: string[];
  category_data?: { name?: string };
  modifier_list_data?: {
    name?: string;
    selection_type?: "SINGLE" | "MULTIPLE";
    modifiers?: { id: string; modifier_data?: { name?: string; price_money?: { amount?: number } } }[];
  };
  item_data?: {
    name?: string;
    description?: string;
    is_archived?: boolean;
    category_id?: string;
    categories?: { id: string }[];
    variations?: SqVariation[];
    modifier_list_info?: {
      modifier_list_id: string;
      enabled?: boolean;
      min_selected_modifiers?: number;
      max_selected_modifiers?: number;
    }[];
  };
};

/** Normalise a Square catalog listing into our menu shape. Exported for tests. */
export function normaliseSquareCatalog(objects: SqObject[], locationId?: string | null): PosMenu {
  const live = objects.filter((o) => !o.is_deleted);
  const cats = new Map(live.filter((o) => o.type === "CATEGORY").map((o) => [o.id, o.category_data?.name ?? "Menu"]));
  const lists = new Map(live.filter((o) => o.type === "MODIFIER_LIST").map((o) => [o.id, o]));
  const atLocation = (o: SqObject) =>
    !locationId || o.present_at_all_locations !== false || (o.present_at_location_ids ?? []).includes(locationId);

  const items: PosMenuItem[] = [];
  for (const o of live) {
    if (o.type !== "ITEM" || !o.item_data || o.item_data.is_archived || !atLocation(o)) continue;
    const d = o.item_data;
    const catId = d.categories?.[0]?.id ?? d.category_id;
    const groups: PosMenuModifierGroup[] = (d.modifier_list_info ?? [])
      .filter((i) => i.enabled !== false)
      .map((i) => {
        const l = lists.get(i.modifier_list_id);
        if (!l?.modifier_list_data) return null;
        const max = i.max_selected_modifiers ?? (l.modifier_list_data.selection_type === "SINGLE" ? 1 : -1);
        return {
          posId: l.id,
          name: l.modifier_list_data.name ?? "Options",
          required: (i.min_selected_modifiers ?? 0) > 0,
          maxSelect: max > 0 ? max : null,
          modifiers: (l.modifier_list_data.modifiers ?? []).map((m) => ({
            posId: m.id,
            name: m.modifier_data?.name ?? "",
            priceCents: m.modifier_data?.price_money?.amount ?? 0,
          })),
        };
      })
      .filter((g): g is PosMenuModifierGroup => !!g);
    const variations = d.variations ?? [];
    for (const v of variations) {
      const vName = v.item_variation_data?.name;
      const showVar = variations.length > 1 && vName && vName.toLowerCase() !== "regular";
      items.push({
        posId: v.id,
        name: showVar ? `${d.name} (${vName})` : d.name ?? "Item",
        description: d.description,
        priceCents: v.item_variation_data?.price_money?.amount ?? 0,
        available: sold(v, locationId),
        category: (catId && cats.get(catId)) || "Menu",
        modifierGroups: groups,
      });
    }
  }
  return { items };
}

export const squareAdapter: PosAdapter = {
  provider: "square",
  support: "built",

  authorizeUrl({ environment, state }) {
    const q = new URLSearchParams({
      client_id: appCreds(environment).id,
      scope: SCOPES.join(" "),
      session: "false",
      state,
    });
    return `${base(environment)}/oauth2/authorize?${q}`;
  },

  async exchangeCode({ environment, code, redirectUri }) {
    const { id, secret } = appCreds(environment);
    if (!id || !secret) throw new PosError("Square app credentials are not configured", false);
    const t = await posFetch<TokenResponse>(`${base(environment)}/oauth2/token`, {
      headers: { "Square-Version": SQUARE_VERSION },
      body: { client_id: id, client_secret: secret, code, grant_type: "authorization_code", redirect_uri: redirectUri },
    });
    return { creds: toCreds(t), merchantId: t.merchant_id };
  },

  async refresh(environment, creds) {
    const { id, secret } = appCreds(environment);
    if (!creds.refreshToken) return creds; // personal access tokens don't refresh
    const t = await posFetch<TokenResponse>(`${base(environment)}/oauth2/token`, {
      headers: { "Square-Version": SQUARE_VERSION },
      body: { client_id: id, client_secret: secret, grant_type: "refresh_token", refresh_token: creds.refreshToken },
    });
    return toCreds(t, creds);
  },

  async listLocations(ctx) {
    const r = await posFetch<{ locations?: { id: string; name?: string; status?: string }[] }>(
      `${base(ctx.environment)}/v2/locations`,
      { headers: headers(ctx) },
    );
    return (r.locations ?? []).filter((l) => l.status !== "INACTIVE").map((l) => ({ id: l.id, name: l.name ?? l.id }));
  },

  async importMenu(ctx) {
    const objects: SqObject[] = [];
    let cursor: string | undefined;
    for (let page = 0; page < 50; page++) {
      const q = new URLSearchParams({ types: "ITEM,CATEGORY,MODIFIER_LIST" });
      if (cursor) q.set("cursor", cursor);
      const r = await posFetch<{ objects?: SqObject[]; cursor?: string }>(
        `${base(ctx.environment)}/v2/catalog/list?${q}`,
        { headers: headers(ctx) },
      );
      objects.push(...(r.objects ?? []));
      cursor = r.cursor;
      if (!cursor) break;
    }
    return normaliseSquareCatalog(objects, ctx.locationId);
  },

  async pushOrder(ctx, order) {
    if (!ctx.locationId) throw new PosError("Square location not selected", false);
    const b = base(ctx.environment);
    const created = await posFetch<{ order: { id: string; total_money?: { amount?: number } } }>(`${b}/v2/orders`, {
      headers: headers(ctx),
      body: buildSquareOrder(order, ctx.locationId),
    });
    const sqOrder = created.order;
    const orderTotal = sqOrder.total_money?.amount ?? order.totalCents;

    // Pay exactly the order total (PayOrder rejects anything else). A mismatch
    // with what Stripe charged is reported back to the pipeline, not hidden.
    const payment = await posFetch<{ payment: { id: string } }>(`${b}/v2/payments`, {
      headers: headers(ctx),
      body: {
        idempotency_key: `sv-pay-${order.externalId}`,
        source_id: "EXTERNAL",
        amount_money: money(orderTotal),
        tip_money: order.tipCents > 0 ? money(order.tipCents) : undefined,
        order_id: sqOrder.id,
        location_id: ctx.locationId,
        autocomplete: false,
        reference_id: order.externalId.slice(0, 40),
        external_details: { type: "OTHER", source: "Online order (card, paid on website)" },
      },
    });
    await posFetch(`${b}/v2/orders/${encodeURIComponent(sqOrder.id)}/pay`, {
      headers: headers(ctx),
      body: { idempotency_key: `sv-payorder-${order.externalId}`, payment_ids: [payment.payment.id] },
    });
    return { posOrderId: sqOrder.id, posTotalCents: orderTotal };
  },
};

/**
 * Verify a Square webhook: base64(HMAC-SHA256(signatureKey, notificationUrl + rawBody))
 * must equal the x-square-hmacsha256-signature header. Constant-time compare.
 */
export async function verifySquareSignature(opts: {
  rawBody: string;
  signature: string | null;
  notificationUrl: string;
  signatureKey: string;
}): Promise<boolean> {
  if (!opts.signature || !opts.signatureKey) return false;
  const { createHmac, timingSafeEqual } = await import("node:crypto");
  const expected = createHmac("sha256", opts.signatureKey).update(opts.notificationUrl + opts.rawBody).digest();
  const got = Buffer.from(opts.signature, "base64");
  return got.length === expected.length && timingSafeEqual(got, expected);
}
