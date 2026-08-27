import { NextRequest, NextResponse } from "next/server";
import db from "@/db/db";
import { LOYALTY_PROJECT_ID } from "@/lib/loyalty";

// Brevo unsubscribe / STOP webhook. When a contact texts STOP (or unsubscribes),
// Brevo posts here — we flip subscribed=false + set unsubscribedAt so the
// dashboard reflects real status and no further sends go to that number.
// Configure this URL in Brevo with ?key=<BREVO_WEBHOOK_SECRET>.
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = process.env.BREVO_WEBHOOK_SECRET;
  if (secret && req.nextUrl.searchParams.get("key") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const event = String(b.event || b.type || "").toLowerCase();
  // Phone can arrive under several keys depending on the Brevo event.
  const rawPhone = String(b.msisdn || b.recipient || b.to || b.phone || b.mobile || "");
  const phone = rawPhone.replace(/[^\d+]/g, "");

  const isUnsub =
    event.includes("unsub") || event.includes("stop") || b.unsubscribed === true;

  if (!phone || !isUnsub) return NextResponse.json({ ok: true, ignored: true });

  try {
    // Match with or without a leading "+".
    await db.loyaltyContact.updateMany({
      where: { projectId: LOYALTY_PROJECT_ID, phone: { in: [phone, phone.replace(/^\+/, ""), `+${phone.replace(/^\+/, "")}`] } },
      data: { subscribed: false, unsubscribedAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("loyalty unsubscribe webhook failed:", (e as Error).message);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
