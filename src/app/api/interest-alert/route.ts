import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/email";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { getOutreach } from "@/lib/outreach";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";

// Emails me the moment a prospect checks "Yes, let's talk about getting this
// live" in the trial popup (website) or the read-only preview dashboard. This is
// a signal I act on personally - no auto-checkout, no auto-messaging - and it's
// paired with the CRM interest flag written by POST /api/interest on the builder.
// Reuses the same mailer + recipient as the visit alert (OWNER_ALERT_EMAIL).
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const to = process.env.OWNER_ALERT_EMAIL || process.env.SMTP_USER;
  if (!to) return NextResponse.json({ ok: true }); // no mail configured -> no-op

  const o = getOutreach();

  // Backstop against a double-check spamming the mailbox: at most one per site
  // (or IP) per 10 minutes.
  const rlKey = `interest-alert:${o.signalKey || getClientIp(req)}`;
  if (isRateLimited(rlKey, 1, 10 * 60_000)) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  let source: "website" | "dashboard" = "website";
  try {
    const body = await req.json();
    if (body?.source === "dashboard") source = "dashboard";
  } catch {
    /* body optional */
  }

  const when = new Date().toLocaleString("en-US", {
    timeZone: SITE_CONFIG.timezone,
    dateStyle: "medium",
    timeStyle: "short",
  });
  const demoLink = SITE_CONFIG.siteUrl;
  const panelBase = o.signalEndpoint.replace(/\/api\/interest\/?$/, "");
  const panelLink = o.signalKey ? `${panelBase} (project: ${o.signalKey})` : panelBase;

  try {
    await sendMail({
      to,
      subject: `🔥 ${SITE_CONFIG.name} just said yes`,
      html: `
        <div style="font-family:system-ui,Segoe UI,sans-serif;font-size:15px;color:#1c1917;line-height:1.6">
          <p><strong>${SITE_CONFIG.name}</strong> checked &ldquo;Yes, let&apos;s talk about getting this live&rdquo; on their demo.</p>
          <table style="border-collapse:collapse;margin-top:8px">
            <tr><td style="padding:4px 14px 4px 0;color:#78716c">When</td><td>${when} (${SITE_CONFIG.timezone})</td></tr>
            <tr><td style="padding:4px 14px 4px 0;color:#78716c">Viewed from</td><td>${source}</td></tr>
            <tr><td style="padding:4px 14px 4px 0;color:#78716c">Demo link</td><td><a href="${demoLink}">${demoLink}</a></td></tr>
            <tr><td style="padding:4px 14px 4px 0;color:#78716c">Builder panel</td><td>${panelLink}</td></tr>
          </table>
          <p style="margin-top:16px">Reach out and get pricing sorted.</p>
        </div>`,
    });
  } catch (err) {
    console.error("interest alert email failed:", err);
  }

  return NextResponse.json({ ok: true });
}
