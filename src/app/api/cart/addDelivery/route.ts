// app/api/cart/addDelivery/route.ts
import { NextResponse } from "next/server";
import { getOrCreateCart } from "@/lib/cart";
import db from "@/db/db";
import { revalidatePath } from "next/cache";
import { getUberDirect } from "@/lib/siteSettings";
import { getQuote } from "@/lib/uber";
import { SITE_CONFIG } from "@/lib/siteConfig";

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

    // Uber Direct: fetch a REAL courier quote for delivery orders, only when the
    // owner has enabled it. Store it on the cart so checkout can add the fee and
    // the post-payment webhook can dispatch with this quote. Never fabricate a
    // fee, and never let a quote failure block the order — fall back to pickup.
    let delivery: {
      available: boolean;
      feeCents?: number;
      etaMs?: number;
      reason?: string;
    } = { available: true };

    const uber = await getUberDirect();
    if (uber.enabled && orderType === "delivery" && address) {
      try {
        const quote = await getQuote(
          { formatted: SITE_CONFIG.address, lat: SITE_CONFIG.lat, lng: SITE_CONFIG.lng },
          { formatted: address, lat, lng },
        );
        await db.cart.update({
          where: { id: cart.id },
          data: { uberQuoteId: quote.id, uberFeeCents: quote.feeCents },
        });
        delivery = { available: true, feeCents: quote.feeCents, etaMs: quote.dropoffEtaMs };
      } catch (e) {
        // No courier / out of range / API error → clear any stale quote and tell
        // the client delivery isn't available (it should offer pickup instead).
        console.error("Uber Direct quote failed:", (e as Error).message);
        await db.cart.update({
          where: { id: cart.id },
          data: { uberQuoteId: null, uberFeeCents: null },
        });
        delivery = {
          available: false,
          reason:
            "Delivery isn't available for this address right now — pickup is still available.",
        };
      }
    }

    revalidatePath("cart");
    return NextResponse.json({ ok: true, message: "Delivery saved", delivery });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, message: "Error while adding delivery" });
  }
}
