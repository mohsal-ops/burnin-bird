// app/api/cart/addDelivery/route.ts
import { NextResponse } from "next/server";
import { getOrCreateCart } from "@/lib/cart";
import db from "@/db/db";
import { revalidatePath } from "next/cache";
import { getUberDirect } from "@/lib/siteSettings";
import { getQuote, quoteEtaMinutes } from "@/lib/uber";
import { SITE_CONFIG } from "@/lib/siteConfig";

// Delivery on this platform IS Uber Direct: a delivery address is only accepted
// with a REAL courier quote. If there's no quote (owner has it off, credentials
// missing, Uber declined the address or the account), the customer is told
// right away and the address is NOT saved as a delivery - so checkout can never
// charge a silent $0 delivery that no courier will ever pick up.
const UNAVAILABLE =
  "Sorry - delivery isn't available for this address right now. Please choose pickup instead.";

type DeliveryResult = { available: boolean; feeCents?: number; etaMin?: number; reason?: string };

export async function POST(req: Request) {
  const {
    address,
    lat,
    lng,
    placeId,
    apt,
    instructions,
    orderType,
    customerName,
    customerPhone,
  } = await req.json();

  try {
    const cart = await getOrCreateCart();

    let delivery: DeliveryResult = { available: true };

    if (orderType === "delivery") {
      if (!address) {
        const reason = "Please choose a delivery address.";
        return NextResponse.json({ ok: false, message: reason, delivery: { available: false, reason } }, { status: 400 });
      }
      const uber = await getUberDirect();
      let failure: string | null = null;

      if (!uber.enabled || uber.mode === "pickup_only") {
        failure = "Uber Direct delivery is turned off in the dashboard (Delivery settings).";
      } else {
        try {
          const quote = await getQuote(
            { formatted: SITE_CONFIG.address, lat: SITE_CONFIG.lat, lng: SITE_CONFIG.lng },
            { formatted: address, lat, lng },
          );
          await db.cart.update({
            where: { id: cart.id },
            data: { uberQuoteId: quote.id, uberFeeCents: quote.feeCents, uberQuoteError: null },
          });
          delivery = { available: true, feeCents: quote.feeCents, etaMin: quoteEtaMinutes(quote) };
        } catch (e) {
          failure = (e as Error).message || "Uber Direct quote failed";
        }
      }

      if (failure) {
        // Keep Uber's exact reason for the owner (Telegram / diagnosis); give the
        // customer a plain message. Clear any stale quote so checkout can't use it.
        console.error("Uber Direct quote failed:", failure);
        await db.cart.update({
          where: { id: cart.id },
          data: { uberQuoteId: null, uberFeeCents: null, uberQuoteError: failure.slice(0, 500) },
        });
        const result: DeliveryResult = { available: false, reason: UNAVAILABLE };
        return NextResponse.json({ ok: true, message: UNAVAILABLE, delivery: result });
      }
    }

    const data = {
      deliveryAddress: address,
      deliveryLat: lat,
      deliveryLng: lng,
      deliveryPlaceId: placeId,
      apt,
      instructions,
      orderType,
      customerName,
      customerPhone,
    };

    const existing = await db.cartItem.findFirst({ where: { cartId: cart.id } });
    if (existing) {
      await db.cartItem.update({ where: { id: existing.id }, data });
    } else {
      await db.cartItem.create({ data: { cartId: cart.id, ...data } });
    }

    revalidatePath("cart");
    return NextResponse.json({ ok: true, message: "Delivery confirmed", delivery });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, message: "Error while adding delivery" }, { status: 500 });
  }
}
