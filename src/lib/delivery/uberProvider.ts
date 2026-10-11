import { createDelivery, getQuote, isUberDirectConfigured, quoteEtaMinutes } from "@/lib/uber";
import type { DeliveryProvider } from "./types";

// Thin wrapper so the router can treat Uber Direct like any other provider.
// All the real Uber logic (auth, quotes, dispatch, central webhook) stays in
// lib/uber.ts, unchanged.
export const uberProvider: DeliveryProvider = {
  id: "uber_direct",
  label: "Uber",
  async isConfigured() {
    return isUberDirectConfigured();
  },
  async quote(input) {
    const q = await getQuote(
      { formatted: input.pickup.formatted, lat: input.pickup.lat, lng: input.pickup.lng },
      { formatted: input.dropoff.formatted, lat: input.dropoff.lat, lng: input.dropoff.lng },
    );
    return {
      provider: "uber_direct",
      ref: q.id,
      feeCents: q.feeCents,
      etaMinutes: quoteEtaMinutes(q),
      expiresAt: q.expiresMs ? new Date(q.expiresMs).toISOString() : undefined,
    };
  },
  async dispatch(input) {
    const d = await createDelivery({
      quoteId: input.quote.ref,
      pickup: {
        formatted: input.pickup.formatted,
        lat: input.pickup.lat,
        lng: input.pickup.lng,
        name: input.pickup.businessName,
        businessName: input.pickup.businessName,
        phone: input.pickup.phone,
        notes: input.pickup.notes,
      },
      dropoff: input.dropoff,
      manifestItems: input.items,
      externalId: `${input.externalId}|${input.siteUrl}`,
    });
    return { deliveryId: d.id, status: d.status, trackingUrl: d.trackingUrl, feeCents: d.feeCents };
  },
};
