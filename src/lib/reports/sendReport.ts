import "server-only";
import { sendMail } from "@/lib/email";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { renderReportEmail } from "./savings";
import { getCommissionPct, statsForMonth, unsubscribeToken } from "./savingsData";

/** Render + send one month's report to `to`. Used by the n8n job and the "send me a test" button. */
export async function sendMonthlyReport(to: string, year: number, month0: number, opts: { test?: boolean } = {}) {
  const [stats, pct] = await Promise.all([statsForMonth(year, month0), getCommissionPct()]);
  const { subject, html, text } = renderReportEmail(stats, pct, SITE_CONFIG.name, {
    dashboard: `${SITE_CONFIG.siteUrl}/admin`,
    unsubscribe: `${SITE_CONFIG.siteUrl}/api/reports/unsubscribe?t=${unsubscribeToken()}`,
  });
  await sendMail({ to, subject: opts.test ? `[Test] ${subject}` : subject, html, text });
  return stats;
}
