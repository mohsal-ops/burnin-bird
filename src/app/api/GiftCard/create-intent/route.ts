// app/api/GiftCard/create-intent/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");

const MIN_AMOUNT_CENTS = 500; // $5
const MAX_AMOUNT_CENTS = 100_000; // $1,000

export async function POST(req: Request) {
  const { amount } = await req.json();

  if (
    typeof amount !== "number" ||
    !Number.isInteger(amount) ||
    amount < MIN_AMOUNT_CENTS ||
    amount > MAX_AMOUNT_CENTS
  ) {
    return NextResponse.json(
      { error: `Amount must be between $${MIN_AMOUNT_CENTS / 100} and $${MAX_AMOUNT_CENTS / 100}` },
      { status: 400 },
    );
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Error creating PaymentIntent:", error);
    return NextResponse.json({ error: "Payment intent creation failed" }, { status: 500 });
  }
}
