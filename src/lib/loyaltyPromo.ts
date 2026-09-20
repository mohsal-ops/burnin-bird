// Loyalty promo / redemption helpers (pure - safe to import anywhere).
//
// Send cost is computed from a configurable Brevo per-message rate AT SEND TIME
// (rate * recipients), never estimated after the fact. The redemption code is
// what a customer enters at checkout to redeem a campaign's offer; it's appended
// to every send so the customer actually receives it.

// Per-message rates in cents. Brevo SMS to the US is roughly $0.02/message on
// credits; marketing email is effectively free on plan. Override per site with
// BREVO_SMS_COST_CENTS / BREVO_EMAIL_COST_CENTS if the real rate differs.
const SMS_COST_CENTS = Number(process.env.BREVO_SMS_COST_CENTS) || 2;
const EMAIL_COST_CENTS = Number(process.env.BREVO_EMAIL_COST_CENTS) || 0;

export function sendCostCents(channel: "sms" | "email", recipients: number): number {
  const rate = channel === "email" ? EMAIL_COST_CENTS : SMS_COST_CENTS;
  return Math.round(rate * Math.max(0, recipients));
}

// Default discount a campaign code takes off the items subtotal at checkout.
export const DEFAULT_DISCOUNT_PERCENT = 10;

// A campaign code is redeemable for this many days after it was sent.
export const REDEMPTION_WINDOW_DAYS = 30;

// Unambiguous alphabet (no O/0, I/1) so a code read off a phone can't be mistyped.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateRedemptionCode(prefix = "SAVE"): string {
  let s = "";
  for (let i = 0; i < 5; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return `${prefix}${s}`;
}

// The line appended to a send so the customer receives the code.
export function offerLine(code: string, discountPercent: number): string {
  return `Use code ${code} for ${discountPercent}% off your online order.`;
}

export function normalizeCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}
