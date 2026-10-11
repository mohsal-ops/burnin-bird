import { NextResponse } from "next/server";
import db from "@/db/db";
import { isJobRequest } from "@/lib/jobAuth";
import { isEnabled } from "@/lib/flags";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { previousMonth } from "@/lib/reports/savings";
import { isReportUnsubscribed, statsForMonth } from "@/lib/reports/savingsData";
import { sendMonthlyReport } from "@/lib/reports/sendReport";

export const dynamic = "force-dynamic";

// n8n calls this on the 1st of each month (?key=STARVEGA_JOBS_SECRET). Emails
// the owner LAST month's report, once (SiteSetting "savings_sent:YYYY-MM"
// guards against double sends). ?dry=1 returns the numbers without emailing.
// Respects the owner's unsubscribe.
async function handle(req: Request) {
  if (!isJobRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isEnabled("savings_report"))) return NextResponse.json({ skipped: "savings_report off" });

  const { year, month0 } = previousMonth(new Date(), SITE_CONFIG.timezone);
  if (new URL(req.url).searchParams.get("dry") === "1") return NextResponse.json(await statsForMonth(year, month0));
  if (await isReportUnsubscribed()) return NextResponse.json({ skipped: "owner unsubscribed" });

  const to = process.env.OWNER_ALERT_EMAIL;
  if (!to) return NextResponse.json({ skipped: "no OWNER_ALERT_EMAIL" });

  const key = `savings_sent:${year}-${String(month0 + 1).padStart(2, "0")}`;
  const claimed = await db.siteSetting.create({ data: { key, value: new Date().toISOString() } }).then(
    () => true,
    () => false,
  );
  if (!claimed) return NextResponse.json({ skipped: "already sent" });

  try {
    const stats = await sendMonthlyReport(to, year, month0);
    return NextResponse.json({ sent: true, month: stats.label, orders: stats.orders });
  } catch (e) {
    await db.siteSetting.delete({ where: { key } }).catch(() => {}); // let the next run retry
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
export const GET = handle;
export const POST = handle;
