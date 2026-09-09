import { createHmac } from "node:crypto";
import { getSetting } from "@/lib/siteSettings";
import { SITE_CONFIG } from "@/lib/siteConfig";

// Loyalty & SMS marketing config + TCPA-safety helpers. Per-restaurant add-on,
// OFF by default. The opt-in text is generated PER BUSINESS (interpolated name)
// and the exact string shown is stored on each LoyaltyContact as proof of what
// they agreed to.

// Stable id for this site's LoyaltyContact/LoyaltyCampaign rows (this DB is one
// restaurant, but the schema keeps projectId for portability + the n8n job).
export const LOYALTY_PROJECT_ID = SITE_CONFIG.siteUrl;

/** The required opt-out sentence appended to every marketing message. */
export const OPT_OUT_LINE = "Reply STOP to unsubscribe.";

/** Per-business opt-in consent text (name interpolated - never generic/shared). */
export function loyaltyConsentText(businessName = SITE_CONFIG.name): string {
  return (
    `Send me text updates about specials and rewards from ${businessName}. ` +
    `Msg & data rates may apply. Consent not required to order. Reply STOP to unsubscribe.`
  );
}

export type LoyaltySettings = {
  enabled: boolean;
  popupEnabled: boolean;
  consentText: string;
  birthdayEnabled: boolean;
  birthdayMessage: string;
  birthdayDaysAhead: number;
};

export async function getLoyaltySettings(): Promise<LoyaltySettings> {
  const [enabled, popupEnabled, bEnabled, bMsg, bDays] = await Promise.all([
    getSetting("loyalty_enabled", "false"),
    // Popup defaults ON when the add-on is enabled; the owner can switch just
    // the popup off without disabling the whole loyalty program.
    getSetting("loyalty_popup_enabled", "true"),
    getSetting("loyalty_birthday_enabled", "false"),
    getSetting("loyalty_birthday_message", ""),
    getSetting("loyalty_days_ahead", "7"),
  ]);
  return {
    enabled: enabled === "true",
    popupEnabled: popupEnabled !== "false",
    consentText: loyaltyConsentText(),
    birthdayEnabled: bEnabled === "true",
    birthdayMessage: bMsg,
    birthdayDaysAhead: Number(bDays) || 7,
  };
}

/**
 * TCPA quiet hours: marketing SMS only sends 8:00am–9:30pm in the restaurant's
 * local timezone. Automated AND manual sends both respect this - no bypass path.
 * Returns true if it's OK to send right now.
 */
export function withinQuietHours(now: Date = new Date()): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SITE_CONFIG.timezone,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0") % 24;
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  const mins = hour * 60 + minute;
  return mins >= 8 * 60 && mins <= 21 * 60 + 30; // 8:00 .. 21:30
}

/** Append the opt-out line to a promo body if it isn't already there. */
export function withOptOut(message: string): string {
  return /reply\s+stop/i.test(message) ? message : `${message.trim()}\n${OPT_OUT_LINE}`;
}

// ── Incentive + welcome messages ────────────────────────────────────────────
// The signup reward. Read defensively so this file stays portable if it's ever
// synced to a client whose siteConfig hasn't set `loyalty`. Set the real value
// in siteConfig.ts → loyalty.incentive.
export function loyaltyIncentive(): string {
  const cfg = SITE_CONFIG as { loyalty?: { incentive?: string } };
  return cfg.loyalty?.incentive?.trim() || "[INCENTIVE]";
}

/** Instant welcome text sent the moment someone opts in to SMS. */
export function loyaltyWelcomeSms(): string {
  return withOptOut(
    `Welcome to ${SITE_CONFIG.name} Rewards! Your reward: ${loyaltyIncentive()}. Show this text on your next visit.`,
  );
}

export function loyaltyWelcomeEmailSubject(): string {
  return `Welcome to ${SITE_CONFIG.name} Rewards 🎉`;
}

/** Welcome email inner body (footer is added by wrapMarketingEmail). */
export function loyaltyWelcomeEmailBody(): string {
  return (
    `<h2 style="margin:0 0 12px">Welcome to ${SITE_CONFIG.name} Rewards!</h2>` +
    `<p style="font-size:15px;line-height:1.6;margin:0 0 8px">Thanks for joining. Here's your reward:</p>` +
    `<p style="font-size:20px;font-weight:700;color:#c85a1e;margin:0 0 12px">${loyaltyIncentive()}</p>` +
    `<p style="font-size:15px;line-height:1.6;margin:0">See you soon 🍗</p>`
  );
}

// ── CAN-SPAM email footer ────────────────────────────────────────────────────
// Every marketing email MUST carry a working unsubscribe link + the business's
// physical mailing address. Routed through wrapMarketingEmail() the same way
// SMS goes through withOptOut(). The unsubscribe link is a per-contact signed
// one-click link handled by /api/loyalty/email-unsubscribe.
export function emailUnsubToken(contactId: string): string {
  const secret = process.env.ADMIN_SECRET || "";
  return createHmac("sha256", secret).update(`loyalty-email-unsub:${contactId}`).digest("hex").slice(0, 32);
}

export function emailUnsubUrl(contactId: string): string {
  const base = SITE_CONFIG.siteUrl.replace(/\/$/, "");
  return `${base}/api/loyalty/email-unsubscribe?c=${encodeURIComponent(contactId)}&t=${emailUnsubToken(contactId)}`;
}

export function emailFooter(contactId: string): string {
  return (
    `<hr style="border:none;border-top:1px solid #e7e5e4;margin:24px 0"/>` +
    `<p style="font-size:12px;color:#78716c;line-height:1.5;margin:0">` +
    `You're receiving this because you opted in to email offers from ${SITE_CONFIG.name}.<br/>` +
    `<a href="${emailUnsubUrl(contactId)}" style="color:#78716c;text-decoration:underline">Unsubscribe</a>` +
    ` &middot; ${SITE_CONFIG.name}, ${SITE_CONFIG.address}` +
    `</p>`
  );
}

/** Wrap a marketing email body with the required CAN-SPAM footer. */
export function wrapMarketingEmail(htmlContent: string, contactId: string): string {
  return (
    `<div style="font-family:system-ui,Segoe UI,Arial,sans-serif;color:#1c1917;max-width:560px;margin:0 auto">` +
    `${htmlContent}${emailFooter(contactId)}</div>`
  );
}
