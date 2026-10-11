import "server-only";
import db from "@/db/db";
import { sendMail } from "@/lib/email";
import { sendTelegramMessage } from "@/lib/telegram";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { toE164 } from "./phone";
import { dispatchWithFailover } from "./router";
import { enabledProviders, providerById } from "./settings";
import { opsAlert } from "@/lib/ops/alert";

// Dispatch for carts whose courier was chosen by the delivery router (any cart
// with deliveryProvider set). Carts from before the router / with the flag off
// keep going through the original Uber block in finalizeCart. Same contract:
// best-effort, the order is already saved, owner told if no courier could go.
// One failover: if the chosen courier refuses, the other enabled one is tried.

type Cart = {
  id: string;
  uberQuoteId: string | null;
  deliveryProvider: string | null;
  deliveryQuoteExpiresAt: Date | null;
  items: { name: string | null; quantity: number | null; price: number | null }[];
};
type First = {
  deliveryAddress: string | null;
  deliveryLat: number | null;
  deliveryLng: number | null;
  apt: string | null;
  instructions: string | null;
  customerName: string | null;
  customerPhone: string | null;
};

export async function dispatchRoutedDelivery(cart: Cart, first: First, email: string) {
  const primary = providerById(cart.deliveryProvider);
  try {
    if (!cart.uberQuoteId || !first.deliveryAddress) throw new Error("no courier quote on this order");
    const notes = [first.apt ? `Apt/Suite: ${first.apt}` : "", first.instructions || ""].filter(Boolean).join(" - ");
    const pickup = {
      formatted: SITE_CONFIG.address,
      lat: SITE_CONFIG.lat,
      lng: SITE_CONFIG.lng,
      businessName: SITE_CONFIG.name,
      phone: toE164(SITE_CONFIG.phone),
    };
    const dropoff = {
      formatted: first.deliveryAddress,
      lat: first.deliveryLat,
      lng: first.deliveryLng,
      name: first.customerName || "Customer",
      phone: toE164(first.customerPhone) || toE164(SITE_CONFIG.phone),
      notes: notes || undefined,
    };
    const orderValueCents = cart.items.reduce((s, i) => s + (i.price ?? 0) * (i.quantity ?? 1), 0);

    const { provider, result: d, quote, failedOver } = await dispatchWithFailover(
      primary,
      await enabledProviders(),
      {
        quote: { provider: primary.id, ref: cart.uberQuoteId, feeCents: 0, expiresAt: cart.deliveryQuoteExpiresAt?.toISOString() },
        externalId: cart.id,
        pickup,
        dropoff,
        items: cart.items.filter((i) => i.name).map((i) => ({ name: i.name as string, quantity: i.quantity ?? 1 })),
        orderValueCents,
        siteUrl: SITE_CONFIG.siteUrl,
      },
      { externalId: `${cart.id}.r${Date.now().toString(36)}`, pickup, dropoff, orderValueCents },
    );
    await db.cart.update({
      where: { id: cart.id },
      data: {
        uberDeliveryId: d.deliveryId,
        uberStatus: d.status,
        uberTrackingUrl: d.trackingUrl ?? null,
        ...(failedOver ? { deliveryProvider: provider.id, deliveryCourierFeeCents: quote.feeCents } : {}),
        ...(d.feeCents ? { deliveryCourierFeeCents: d.feeCents } : {}),
      },
    });
    if (failedOver) {
      await sendTelegramMessage(
        `ℹ️ Order ${cart.id}: ${primary.label} couldn't take the delivery, so ${provider.label} is bringing it instead.`,
      ).catch(() => {});
    }
    if (d.trackingUrl && email && email !== "N/A") {
      await sendMail({
        to: email,
        subject: `Your ${SITE_CONFIG.name} order is on the way 🚗`,
        html: `<div style="font-family:system-ui,Segoe UI,sans-serif;font-size:15px;color:#1c1917">
          <h2 style="margin:0 0 12px">Your order is on the way</h2>
          <p>A courier is bringing your ${SITE_CONFIG.name} order to ${first.deliveryAddress}.</p>
          <p style="margin:18px 0"><a href="${d.trackingUrl}" style="background:#1c1917;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Track your delivery</a></p></div>`,
      }).catch((e) => console.error("Customer tracking email failed:", (e as Error).message));
    }
  } catch (e) {
    console.error("Courier dispatch failed (order still saved):", (e as Error).message);
    await opsAlert("courier_dispatch", `Order ${cart.id}: ${(e as Error).message}`);
    await sendTelegramMessage(
      `⚠️ Delivery dispatch FAILED for order ${cart.id}: ${(e as Error).message}. Please arrange delivery manually or call the customer to offer pickup.`,
    ).catch(() => {});
  }
}
