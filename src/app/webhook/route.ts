import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripeConfig";
import { finalizeCart } from "@/lib/finalizeOrder";

// Stripe payment webhook. Verifies the signature, then finalizes the paid cart
// via the shared, idempotent finalizeCart (same path the success page uses, so
// orders complete even if this webhook isn't configured - see finalizeOrder.ts).
// LEGACY: env-configured sites. admin → Payments uses /api/stripe/webhook.

export async function POST(req: NextRequest) {
  try {
    const sig = req.headers.get("stripe-signature");
    if (!sig) return new NextResponse("Missing signature", { status: 400 });
    const stripe = await getStripe();
    if (!stripe) return new NextResponse("Not configured", { status: 503 });

    const event = stripe.webhooks.constructEvent(
      await req.text(),
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string,
    );

    if (event.type !== "payment_intent.succeeded") {
      return new NextResponse("Ignored", { status: 200 });
    }

    const pi = event.data.object as Stripe.PaymentIntent;
    await finalizeCart(pi.metadata.cartId, pi.receipt_email || "N/A");
    return new NextResponse("Order saved", { status: 200 });
  } catch (err) {
    console.error("stripe webhook error:", err);
    return new NextResponse("Webhook error", { status: 400 });
  }
}
