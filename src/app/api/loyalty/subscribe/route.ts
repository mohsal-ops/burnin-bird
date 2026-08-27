import { NextRequest, NextResponse } from "next/server";
import db from "@/db/db";
import { getLoyaltySettings, loyaltyConsentText, LOYALTY_PROJECT_ID } from "@/lib/loyalty";

// POST /api/loyalty/subscribe { phone, firstName?, birthday?, consentTextVersion }
// Records an SMS marketing opt-in captured at checkout. Stores the EXACT consent
// wording shown + timestamp + IP so it's provable later. Only active when the
// owner has enabled the loyalty add-on. Birthday is optional (never required to
// opt in).
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const settings = await getLoyaltySettings();
  if (!settings.enabled) {
    return NextResponse.json({ ok: false, error: "not enabled" }, { status: 403 });
  }

  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const phoneRaw = typeof b.phone === "string" ? b.phone.trim() : "";
  const phone = phoneRaw.replace(/[^\d+]/g, "");
  if (!phone || phone.replace(/\D/g, "").length < 10) {
    return NextResponse.json({ ok: false, error: "valid phone required" }, { status: 400 });
  }

  const firstName = typeof b.firstName === "string" && b.firstName.trim() ? b.firstName.trim() : null;
  const birthday =
    typeof b.birthday === "string" && b.birthday ? new Date(b.birthday) : null;
  // Store what was actually shown; fall back to the current server text.
  const consentTextVersion =
    typeof b.consentTextVersion === "string" && b.consentTextVersion.trim()
      ? b.consentTextVersion.trim()
      : loyaltyConsentText();
  const consentIp = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || null;

  try {
    await db.loyaltyContact.upsert({
      where: { projectId_phone: { projectId: LOYALTY_PROJECT_ID, phone } },
      // Re-opt-in resubscribes and refreshes the consent record.
      update: {
        subscribed: true,
        unsubscribedAt: null,
        firstName: firstName ?? undefined,
        birthday: birthday && !isNaN(birthday.getTime()) ? birthday : undefined,
        consentTextVersion,
        consentTimestamp: new Date(),
        consentIp,
      },
      create: {
        projectId: LOYALTY_PROJECT_ID,
        phone,
        firstName,
        birthday: birthday && !isNaN(birthday.getTime()) ? birthday : null,
        subscribed: true,
        consentTextVersion,
        consentIp,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("loyalty subscribe failed:", (e as Error).message);
    return NextResponse.json({ ok: false, error: "could not save" }, { status: 500 });
  }
}
