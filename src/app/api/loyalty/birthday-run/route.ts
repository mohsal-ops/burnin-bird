import { NextRequest, NextResponse } from "next/server";
import db from "@/db/db";
import { getLoyaltySettings, LOYALTY_PROJECT_ID } from "@/lib/loyalty";
import { sendToSubscribed } from "@/app/admin/loyalty/_actions/loyaltyActions";

// Daily birthday send, driven by the n8n workflow (one call per client site).
// Sends the owner's saved birthday message to contacts whose birthday is exactly
// `daysAhead` (default 7) away — never on the day, never unless the owner turned
// it on AND saved a message. Uses the shared send path, so subscribed-only +
// quiet-hours + opt-out all apply (no automated bypass).
// Auth: ?key=<LOYALTY_CRON_SECRET> or Authorization: Bearer <LOYALTY_CRON_SECRET>.
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = process.env.LOYALTY_CRON_SECRET;
  const bearer = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const key = req.nextUrl.searchParams.get("key");
  if (!secret || (key !== secret && bearer !== secret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const settings = await getLoyaltySettings();
  if (!settings.enabled || !settings.birthdayEnabled || !settings.birthdayMessage.trim()) {
    return NextResponse.json({ ok: true, skipped: true, reason: "birthday automation off or no saved message" });
  }

  // Target month/day = today + daysAhead, in UTC (birthdays are date-only).
  const target = new Date();
  target.setUTCDate(target.getUTCDate() + settings.birthdayDaysAhead);
  const tMonth = target.getUTCMonth();
  const tDay = target.getUTCDate();

  const contacts = await db.loyaltyContact.findMany({
    where: { projectId: LOYALTY_PROJECT_ID, subscribed: true, birthday: { not: null } },
    select: { phone: true, firstName: true, birthday: true },
  });
  const due = contacts.filter(
    (c) => c.birthday && c.birthday.getUTCMonth() === tMonth && c.birthday.getUTCDate() === tDay,
  );

  if (due.length === 0) return NextResponse.json({ ok: true, sent: 0 });

  const res = await sendToSubscribed(
    settings.birthdayMessage,
    "birthday_auto",
    due.map((c) => ({ phone: c.phone, firstName: c.firstName })),
  );
  return NextResponse.json({ ok: true, ...res, dueCount: due.length });
}
