import "server-only";
import nodemailer from "nodemailer";
import type Stripe from "stripe";
import { SITE_CONFIG } from "@/lib/siteConfig";

// Gift card purchases are recognised by metadata.kind (set at create-intent) or,
// for intents made before that tag existed, by the sender details that
// attach-details writes. Food orders always carry metadata.cartId instead.
export function isGiftCardIntent(pi: Stripe.PaymentIntent): boolean {
  const m = pi.metadata || {};
  return !m.cartId && (m.kind === "giftcard" || !!m.fromName);
}

// Best-effort de-dupe for Stripe's automatic retries (per server instance).
const sent = new Set<string>();

/** Emails the restaurant about a paid gift card. Throws if the email fails (so Stripe retries). */
export async function notifyGiftCardPurchase(pi: Stripe.PaymentIntent): Promise<"sent" | "duplicate"> {
  if (sent.has(pi.id)) return "duplicate";
  const m = pi.metadata || {};
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transporter.sendMail({
    from: `"${SITE_CONFIG.name} Gift Card" <${process.env.SMTP_USER}>`,
    to: process.env.CATERING_EMAIL,
    subject: "New Gift Card Purchase",
    html: `
      <h2>New Gift Card Purchase</h2>
      <p><b>Amount:</b> $${(pi.amount / 100).toFixed(2)}</p>
      <p><b>From:</b> ${m.fromName || "N/A"} (${m.fromEmail || "N/A"})</p>
      <p><b>To:</b> ${m.toName || "N/A"} (${m.toEmail || "N/A"})</p>
      <p><b>Note:</b> ${m.note || "None"}</p>
      <p><b>Delivery:</b> ${m.delivery || "Now"}</p>
      <p><b>Payer email:</b> ${pi.receipt_email || "N/A"}</p>
    `,
  });
  sent.add(pi.id);
  return "sent";
}
