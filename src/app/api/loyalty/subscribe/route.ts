import { NextRequest, NextResponse } from "next/server";
import db from "@/db/db";
import { sendSms, sendEmail } from "@/lib/brevo";
import { allowDb, getClientIp } from "@/lib/rateLimit";
import {
  getLoyaltySettings,
  loyaltyConsentText,
  loyaltyWelcomeSms,
  loyaltyWelcomeEmailSubject,
  loyaltyWelcomeEmailBody,
  wrapMarketingEmail,
  LOYALTY_PROJECT_ID,
} from "@/lib/loyalty";

// POST /api/loyalty/subscribe
//   { phone?, email?, firstName?, birthday?, smsConsent?, emailConsent?, consentTextVersion? }
// A marketing opt-in captured from the /rewards join form or checkout. SMS
// (TCPA) and email (CAN-SPAM) are separate consents - each channel only turns
// on if BOTH an identifier for it AND its explicit checkbox are present, so an
// email-only signup never flips smsSubscribed. Stores the exact consent wording
// + timestamp + IP as proof. A welcome message with the reward is sent instantly
// to whichever channel(s) just opted in (best-effort - never blocks the reply).
export const runtime = "nodejs";

function toE164(phone: string): string {
  const p = phone.replace(/[^\d+]/g, "");
  if (p.startsWith("+")) return p;
  const d = p.replace(/\D/g, "");
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  return `+${d}`;
}

export async function POST(req: NextRequest) {
  const settings = await getLoyaltySettings();
  if (!settings.enabled) {
    return NextResponse.json({ ok: false, error: "not enabled" }, { status: 403 });
  }

  // Abuse guard: each sign-up can text a number (paid SMS) - cap per IP.
  if (!(await allowDb(`loyalty-join:${getClientIp(req)}`, 5, 3600))) {
    return NextResponse.json({ ok: false, error: "Too many tries. Please wait a bit." }, { status: 429 });
  }
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const phoneRaw = typeof b.phone === "string" ? b.phone.trim() : "";
  const phone = phoneRaw ? phoneRaw.replace(/[^\d+]/g, "") : "";
  // US numbers only (10 digits, or 11 starting with 1) - blocks SMS-pumping to
  // premium international numbers on the owner's SMS account.
  const digits = phone.replace(/\D/g, "");
  const phoneValid = !!phone && (digits.length === 10 || (digits.length === 11 && digits.startsWith("1")));

  const emailRaw = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw);
  const email = emailValid ? emailRaw : "";

  // Consent is only honoured when the matching identifier is present + valid.
  const smsOptIn = phoneValid && b.smsConsent === true;
  const emailOptIn = emailValid && b.emailConsent === true;

  if (!smsOptIn && !emailOptIn) {
    return NextResponse.json(
      { ok: false, error: "Enter a phone or email and check the matching box to join." },
      { status: 400 },
    );
  }

  const firstName = typeof b.firstName === "string" && b.firstName.trim() ? b.firstName.trim() : null;
  const birthdayRaw = typeof b.birthday === "string" && b.birthday ? new Date(b.birthday) : null;
  const birthday = birthdayRaw && !isNaN(birthdayRaw.getTime()) ? birthdayRaw : null;
  const consentTextVersion =
    typeof b.consentTextVersion === "string" && b.consentTextVersion.trim()
      ? b.consentTextVersion.trim()
      : loyaltyConsentText();
  const consentIp = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || null;

  let contactId: string;
  let wasSmsSubscribed = false;
  let wasEmailSubscribed = false;
  try {
    // Find any existing contact matching either identifier, then merge. Two
    // separate unique constraints (phone, email) rule out a single upsert.
    const or: { phone?: string; email?: string }[] = [];
    if (phoneValid) or.push({ phone });
    if (emailValid) or.push({ email });
    const existing = await db.loyaltyContact.findFirst({
      where: { projectId: LOYALTY_PROJECT_ID, OR: or },
    });

    if (existing) {
      wasSmsSubscribed = existing.smsSubscribed;
      wasEmailSubscribed = existing.emailSubscribed;
      const updated = await db.loyaltyContact.update({
        where: { id: existing.id },
        data: {
          // never overwrite a contact's existing phone/email (no hijacking by a matching email)
          phone: phoneValid && !existing.phone ? phone : undefined,
          email: emailValid && !existing.email ? email : undefined,
          firstName: firstName ?? undefined,
          birthday: birthday ?? undefined,
          // Consent only ever upgrades here - a channel not opted into this time
          // keeps whatever it already had (never silently turned off).
          smsSubscribed: smsOptIn || existing.smsSubscribed,
          emailSubscribed: emailOptIn || existing.emailSubscribed,
          unsubscribedAt: null,
          consentTextVersion,
          consentTimestamp: new Date(),
          consentIp,
        },
      });
      contactId = updated.id;
    } else {
      const created = await db.loyaltyContact.create({
        data: {
          projectId: LOYALTY_PROJECT_ID,
          phone: phoneValid ? phone : null,
          email: emailValid ? email : null,
          firstName,
          birthday,
          smsSubscribed: smsOptIn,
          emailSubscribed: emailOptIn,
          consentTextVersion,
          consentIp,
        },
      });
      contactId = created.id;
    }
  } catch (e) {
    console.error("loyalty subscribe failed:", (e as Error).message);
    return NextResponse.json({ ok: false, error: "could not save" }, { status: 500 });
  }

  // Instant welcome for whichever channel(s) just opted in. Best-effort: a send
  // failure must never break the join response.
  // Welcome only on a NEW opt-in (no repeat texts on re-submits).
  if (smsOptIn && phone && !wasSmsSubscribed) {
    try {
      await sendSms({ to: toE164(phone), content: loyaltyWelcomeSms(), type: "marketing" });
    } catch (e) {
      console.error("welcome sms failed:", (e as Error).message);
    }
  }
  if (emailOptIn && email && !wasEmailSubscribed) {
    try {
      await sendEmail({
        to: email,
        subject: loyaltyWelcomeEmailSubject(),
        htmlContent: wrapMarketingEmail(loyaltyWelcomeEmailBody(), contactId),
      });
    } catch (e) {
      console.error("welcome email failed:", (e as Error).message);
    }
  }

  return NextResponse.json({ ok: true, sms: smsOptIn, email: emailOptIn });
}
