import { NextRequest, NextResponse } from "next/server";
import db from "@/db/db";
import { verifyPassword } from "@/lib/password";
import { createAdminSessionToken } from "@/lib/adminSession";
import { ADMIN_COOKIE_NAME } from "@/lib/adminAuth";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { sendMail } from "@/lib/email";
import { SITE_CONFIG } from "@/lib/siteConfig";

// Emails the owner whenever someone signs into the dashboard. Best-effort:
// a mail failure must never block a legitimate login. Set OWNER_ALERT_EMAIL
// in the environment to control where the alert goes (falls back to the
// SMTP account itself). Delete this call to turn the alerts off.
async function sendLoginAlert(admin: { name: string; email: string }, ip: string) {
  const to = process.env.OWNER_ALERT_EMAIL || process.env.SMTP_USER;
  if (!to) return;
  const when = new Date().toLocaleString("en-US", {
    timeZone: SITE_CONFIG.timezone,
    dateStyle: "medium",
    timeStyle: "short",
  });
  try {
    await sendMail({
      to,
      subject: `Dashboard sign-in: ${admin.name}`,
      html: `
        <div style="font-family:system-ui,Segoe UI,sans-serif;font-size:15px;color:#1c1917">
          <h2 style="margin:0 0 12px">Someone just signed into the ${SITE_CONFIG.name} dashboard</h2>
          <table style="border-collapse:collapse">
            <tr><td style="padding:4px 14px 4px 0;color:#78716c">Name</td><td><strong>${admin.name}</strong></td></tr>
            <tr><td style="padding:4px 14px 4px 0;color:#78716c">Email</td><td>${admin.email}</td></tr>
            <tr><td style="padding:4px 14px 4px 0;color:#78716c">Time</td><td>${when} (${SITE_CONFIG.timezone})</td></tr>
            <tr><td style="padding:4px 14px 4px 0;color:#78716c">IP address</td><td>${ip}</td></tr>
          </table>
          <p style="margin-top:16px;color:#78716c;font-size:13px">
            You're receiving this because dashboard sign-in alerts are on. If this was you, no action is needed.
          </p>
        </div>`,
    });
  } catch (err) {
    console.error("login alert email failed:", err);
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (isRateLimited(`admin-login:${ip}`, 5, 60_000)) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a minute." },
      { status: 429 },
    );
  }

  const { email, password } = await req.json();

  if (typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await db.admin.findUnique({ where: { email: email.trim().toLowerCase() } });

  if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  if (admin.status === "PENDING_VERIFICATION") {
    return NextResponse.json(
      { error: "Please verify your email before signing in." },
      { status: 403 },
    );
  }
  if (admin.status === "PENDING_APPROVAL") {
    return NextResponse.json(
      { error: "Your account is awaiting approval from an existing admin." },
      { status: 403 },
    );
  }
  if (admin.status === "REJECTED") {
    return NextResponse.json({ error: "This account is not authorized." }, { status: 403 });
  }

  const token = await createAdminSessionToken(admin.id);

  await sendLoginAlert({ name: admin.name, email: admin.email }, ip);

  const res = NextResponse.json({ ok: true });

  res.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24h, matches session token TTL
    path: "/",
  });

  return res;
}
