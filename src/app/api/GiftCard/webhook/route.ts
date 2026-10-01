import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripeConfig";
import { isGiftCardIntent, notifyGiftCardPurchase } from "@/lib/giftCardNotify";

// LEGACY gift card webhook for sites set up with env vars
// (STRIPE_GIFTCARD_WEBHOOK_SECRET). Sites connected in admin → Payments use the
// single /api/stripe/webhook instead. Only gift card intents email the
// restaurant - food-order payments hitting this endpoint are ignored.
export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("Missing stripe-signature", { status: 400 });

  const stripe = await getStripe();
  const endpointSecret = process.env.STRIPE_GIFTCARD_WEBHOOK_SECRET;
  if (!stripe || !endpointSecret) return new NextResponse("Not configured", { status: 503 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), sig, endpointSecret);
  } catch (err) {
    console.error("GiftCard webhook verification failed:", (err as Error).message);
    return new NextResponse(`Webhook Error: ${(err as Error).message}`, { status: 400 });
  }

  if (event.type !== "payment_intent.succeeded") return NextResponse.json({ received: true });
  const pi = event.data.object as Stripe.PaymentIntent;
  if (!isGiftCardIntent(pi)) return NextResponse.json({ received: true, ignored: "not a gift card" });

  try {
    const r = await notifyGiftCardPurchase(pi);
    return NextResponse.json({ received: true, giftCard: r });
  } catch (err) {
    console.error("GiftCard notification email failed:", err);
    // Payment already succeeded; 500 so Stripe retries the email step.
    return new NextResponse("Email send failed", { status: 500 });
  }
}
