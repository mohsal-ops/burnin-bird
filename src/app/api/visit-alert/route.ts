import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/email";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { ADMIN_COOKIE_NAME } from "@/lib/adminAuth";
import { verifyAdminSessionToken } from "@/lib/adminSession";

// Once an admin (the owner) has been seen, their browser is muted for this long
// so they don't get visit emails even after they log out.
const MUTE_COOKIE = "va_mute";
const MUTE_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

// Emails the AGENCY when a browser opens the ADMIN/preview dashboard - a lead
// looking at their demo. Mounted in admin/layout.tsx gated to preview mode ONLY
// (NOT the public customer site: that emailed on every live-site visit and
// flooded the inbox). Always goes to AGENCY_ALERT_EMAIL, never the client's
// OWNER_ALERT_EMAIL. The client pings this at most once per browser every couple
// of hours (see VisitAlert.tsx), plus an IP backstop here; logged-in owners are
// muted below. To turn it off entirely: remove the <VisitAlert /> mount in
// admin/layout.tsx.
export const runtime = "nodejs";

// Agency inbox for access-tracking / lead alerts. Provisioned as AGENCY_ALERT_EMAIL
// (see the builder's provision.ts); the literal is the guaranteed fallback so this
// keeps reaching us even on a site whose env var wasn't backfilled.
const AGENCY_ALERT_EMAIL = process.env.AGENCY_ALERT_EMAIL || "bensa0016@gmail.com";

export async function POST(req: NextRequest) {
  const to = AGENCY_ALERT_EMAIL;
  if (!to) return NextResponse.json({ ok: true });

  // Don't alert on the owner's own visits. Skip if they're a logged-in admin,
  // or if this browser was muted after a previous admin visit. Logging into the
  // admin once mutes the browser for MUTE_MAX_AGE, so browsing the live site
  // (even logged out) won't email you.
  const isAdmin = !!(await verifyAdminSessionToken(req.cookies.get(ADMIN_COOKIE_NAME)?.value));
  const muted = req.cookies.get(MUTE_COOKIE)?.value === "1";
  if (isAdmin || muted) {
    const res = NextResponse.json({ ok: true, skipped: "owner" });
    if (isAdmin) {
      res.cookies.set(MUTE_COOKIE, "1", {
        maxAge: MUTE_MAX_AGE,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
    }
    return res;
  }

  const ip = getClientIp(req);
  // Backstop: at most one visit alert per IP per 30 minutes.
  if (isRateLimited(`visit-alert:${ip}`, 1, 30 * 60_000)) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  let path = "/";
  let referrer = "";
  try {
    const body = await req.json();
    if (typeof body?.path === "string") path = body.path;
    if (typeof body?.referrer === "string") referrer = body.referrer;
  } catch {
    /* body optional */
  }

  const ua = req.headers.get("user-agent") ?? "unknown";
  const when = new Date().toLocaleString("en-US", {
    timeZone: SITE_CONFIG.timezone,
    dateStyle: "medium",
    timeStyle: "short",
  });

  try {
    await sendMail({
      to,
      subject: `Website visit: ${SITE_CONFIG.name}`,
      html: `
        <div style="font-family:system-ui,Segoe UI,sans-serif;font-size:15px;color:#1c1917">
          <h2 style="margin:0 0 12px">Someone opened the ${SITE_CONFIG.name} website</h2>
          <table style="border-collapse:collapse">
            <tr><td style="padding:4px 14px 4px 0;color:#78716c">Time</td><td>${when} (${SITE_CONFIG.timezone})</td></tr>
            <tr><td style="padding:4px 14px 4px 0;color:#78716c">Page</td><td>${path}</td></tr>
            <tr><td style="padding:4px 14px 4px 0;color:#78716c">Came from</td><td>${referrer || "direct / unknown"}</td></tr>
            <tr><td style="padding:4px 14px 4px 0;color:#78716c">IP address</td><td>${ip}</td></tr>
            <tr><td style="padding:4px 14px 4px 0;color:#78716c">Device</td><td style="max-width:420px">${ua}</td></tr>
          </table>
          <p style="margin-top:16px;color:#78716c;font-size:13px">
            You're receiving this because website visit alerts are on (private pre-launch link).
            At most one email per visitor every couple of hours.
          </p>
        </div>`,
    });
  } catch (err) {
    console.error("visit alert email failed:", err);
  }

  return NextResponse.json({ ok: true });
}
