import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, getStripeConfig } from "@/lib/stripeConfig";
import { finalizeCart } from "@/lib/finalizeOrder";
import { isGiftCardIntent, notifyGiftCardPurchase } from "@/lib/giftCardNotify";

// The ONE Stripe webhook for this site. admin → Payments creates it in the
// restaurant's Stripe account automatically (payment_intent.succeeded only) and
// stores its signing secret, so nobody pastes webhook URLs by hand. Food orders
// (metadata.cartId) are finalized; gift cards email the restaurant.
// The legacy /webhook + /api/GiftCard/webhook routes stay for env-configured sites.
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("Missing signature", { status: 400 });

  const [stripe, cfg] = await Promise.all([getStripe(), getStripeConfig()]);
  if (!stripe || !cfg.webhookSecrets.length) return new NextResponse("Payments not configured", { status: 503 });

  const payload = await req.text();
  let event: Stripe.Event | null = null;
  for (const secret of cfg.webhookSecrets) {
    try {
      event = stripe.webhooks.constructEvent(payload, sig, secret);
      break;
    } catch {
      // try the next accepted secret
    }
  }
  if (!event) return new NextResponse("Bad signature", { status: 400 });

  if (event.type !== "payment_intent.succeeded") return NextResponse.json({ received: true, ignored: event.type });

  const pi = event.data.object as Stripe.PaymentIntent;
  try {
    if (pi.metadata?.cartId) {
      await finalizeCart(pi.metadata.cartId, pi.receipt_email || "N/A");
      return NextResponse.json({ received: true, order: pi.metadata.cartId });
    }
    if (isGiftCardIntent(pi)) {
      const r = await notifyGiftCardPurchase(pi);
      return NextResponse.json({ received: true, giftCard: r });
    }
    return NextResponse.json({ received: true, ignored: "not from this site" });
  } catch (err) {
    console.error("stripe webhook error:", err);
    // 500 → Stripe retries later (finalize + email are both safe to repeat)
    return new NextResponse("Webhook handler failed", { status: 500 });
  }
}
