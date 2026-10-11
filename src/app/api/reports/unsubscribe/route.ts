import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { setReportUnsubscribed, unsubscribeToken } from "@/lib/reports/savingsData";

export const dynamic = "force-dynamic";

// One-click unsubscribe from the monthly report (CAN-SPAM). Signed token, no
// login. The owner can turn it back on from the dashboard card.
export async function GET(req: Request) {
  const t = new URL(req.url).searchParams.get("t") ?? "";
  const want = unsubscribeToken();
  const ok = t.length === want.length && timingSafeEqual(Buffer.from(t), Buffer.from(want));
  if (!ok) return new NextResponse("This link is not valid.", { status: 400 });
  await setReportUnsubscribed(true);
  return new NextResponse(
    `<!doctype html><meta name="viewport" content="width=device-width"><div style="font-family:system-ui;max-width:420px;margin:15vh auto;padding:16px"><h2>You're unsubscribed</h2><p>You won't get the monthly report email any more. You can turn it back on from your dashboard.</p></div>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}
