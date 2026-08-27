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

/** Per-business opt-in consent text (name interpolated — never generic/shared). */
export function loyaltyConsentText(businessName = SITE_CONFIG.name): string {
  return (
    `Send me text updates about specials and rewards from ${businessName}. ` +
    `Msg & data rates may apply. Consent not required to order. Reply STOP to unsubscribe.`
  );
}

export type LoyaltySettings = {
  enabled: boolean;
  consentText: string;
  birthdayEnabled: boolean;
  birthdayMessage: string;
  birthdayDaysAhead: number;
};

export async function getLoyaltySettings(): Promise<LoyaltySettings> {
  const [enabled, bEnabled, bMsg, bDays] = await Promise.all([
    getSetting("loyalty_enabled", "false"),
    getSetting("loyalty_birthday_enabled", "false"),
    getSetting("loyalty_birthday_message", ""),
    getSetting("loyalty_days_ahead", "7"),
  ]);
  return {
    enabled: enabled === "true",
    consentText: loyaltyConsentText(),
    birthdayEnabled: bEnabled === "true",
    birthdayMessage: bMsg,
    birthdayDaysAhead: Number(bDays) || 7,
  };
}

/**
 * TCPA quiet hours: marketing SMS only sends 8:00am–9:30pm in the restaurant's
 * local timezone. Automated AND manual sends both respect this — no bypass path.
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
