// Attaches the gift card sender/recipient details entered in the checkout
// form to the Stripe PaymentIntent's metadata, so the webhook can include
// them in the purchase notification email.
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");

function clip(value: unknown, max = 500): string {
  return String(value ?? "").slice(0, max);
}

export async function POST(req: Request) {
  const { paymentIntentId, fromName, fromEmail, toName, toEmail, note, delivery } =
    await req.json();

  if (!paymentIntentId || !fromName || !fromEmail || !toName || !toEmail) {
    return NextResponse.json({ error: "Missing required form fields" }, { status: 400 });
  }

  try {
    await stripe.paymentIntents.update(paymentIntentId, {
      metadata: {
        fromName: clip(fromName),
        fromEmail: clip(fromEmail),
        toName: clip(toName),
        toEmail: clip(toEmail),
        note: clip(note),
        delivery: clip(delivery || "now"),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to attach gift card details:", error);
    return NextResponse.json({ error: "Failed to save gift card details" }, { status: 500 });
  }
}
