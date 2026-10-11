import "server-only";
import db from "@/db/db";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { toE164 } from "./phone";
import { quoteAll } from "./router";
import { deliverySwitchOn, enabledProviders, getRoutingPolicy } from "./settings";

// Router path for /api/cart/addDelivery (flag "delivery_router"). Quotes every
// enabled courier, stores the winner on the cart in the existing courier
// columns (uberQuoteId / uberFeeCents — historic names) + deliveryProvider, so
// checkout and finalizeCart pick it up unchanged.

export async function routedQuote(input: {
  cartId: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
  customerName?: string;
  customerPhone?: string;
}): Promise<{ ok: true; feeCents: number; etaMin?: number } | { ok: false; reason: string }> {
  if (!(await deliverySwitchOn())) return { ok: false, reason: "Delivery is turned off in the dashboard (Delivery settings)." };
  const providers = await enabledProviders();
  if (!providers.length) return { ok: false, reason: "No courier is set up (Uber Direct or DoorDash Drive)." };

  const items = await db.cartItem.findMany({ where: { cartId: input.cartId }, select: { price: true, quantity: true } });
  const orderValueCents = items.reduce((s, i) => s + (i.price ?? 0) * (i.quantity ?? 1), 0);

  const policy = await getRoutingPolicy();
  const round = await quoteAll(
    providers,
    {
      externalId: input.cartId,
      pickup: {
        formatted: SITE_CONFIG.address,
        lat: SITE_CONFIG.lat,
        lng: SITE_CONFIG.lng,
        businessName: SITE_CONFIG.name,
        phone: toE164(SITE_CONFIG.phone),
      },
      dropoff: {
        formatted: input.address,
        lat: input.lat,
        lng: input.lng,
        name: input.customerName,
        phone: toE164(input.customerPhone),
      },
      orderValueCents,
    },
    policy.strategy,
    4_000,
    policy.preferred,
  );
  for (const e of round.errors) console.error(`Delivery quote failed (${e.provider}): ${e.message}`);
  if (!round.chosen) {
    return { ok: false, reason: round.errors.map((e) => `${e.provider}: ${e.message}`).join(" | ") || "No courier quote" };
  }
  const q = round.chosen;
  // Customer pays the courier fee minus whatever the restaurant chose to absorb.
  const customerFee = Math.max(0, q.feeCents - policy.subsidyCents);
  await db.cart.update({
    where: { id: input.cartId },
    data: {
      uberQuoteId: q.ref,
      uberFeeCents: customerFee,
      deliveryCourierFeeCents: q.feeCents,
      uberQuoteError: null,
      deliveryProvider: q.provider,
      deliveryQuoteExpiresAt: q.expiresAt ? new Date(q.expiresAt) : null,
    },
  });
  return { ok: true, feeCents: customerFee, etaMin: q.etaMinutes };
}
