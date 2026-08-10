import { NextResponse } from "next/server";
import Stripe from "stripe";
import nodemailer from "nodemailer";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");

const endpointSecret = process.env.STRIPE_GIFTCARD_WEBHOOK_SECRET!;

// Best-effort de-dupe for Stripe's automatic webhook retries so a single
// gift card purchase doesn't send the notification email twice.
const processedEventIds = new Set<string>();

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return new NextResponse("Missing stripe-signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const payload = await req.text();
    event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
  } catch (err: any) {
    console.error("GiftCard webhook verification failed:", err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    if (processedEventIds.has(event.id)) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const metadata = paymentIntent.metadata;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    try {
      await transporter.sendMail({
        from: `"The Wagon Wheel Gift Card" <${process.env.SMTP_USER}>`,
        to: process.env.CATERING_EMAIL,
        subject: "New Gift Card Purchase",
        html: `
          <h2>New Gift Card Purchase</h2>
          <p><b>Amount:</b> $${(paymentIntent.amount / 100).toFixed(2)}</p>
          <p><b>From:</b> ${metadata.fromName || "N/A"} (${metadata.fromEmail || "N/A"})</p>
          <p><b>To:</b> ${metadata.toName || "N/A"} (${metadata.toEmail || "N/A"})</p>
          <p><b>Note:</b> ${metadata.note || "None"}</p>
          <p><b>Delivery:</b> ${metadata.delivery || "Now"}</p>
          <p><b>Payer email:</b> ${paymentIntent.receipt_email || "N/A"}</p>
        `,
      });
    } catch (err) {
      console.error("GiftCard notification email failed:", err);
      // Payment already succeeded; surface a 500 so Stripe retries the email step.
      return new NextResponse("Email send failed", { status: 500 });
    }

    processedEventIds.add(event.id);
    return NextResponse.json(
      { message: "Email sent successfully" },
      { status: 200 },
    );
  }

  return NextResponse.json({ received: true });
}
