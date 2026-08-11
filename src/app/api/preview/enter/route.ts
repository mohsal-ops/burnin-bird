import { NextRequest, NextResponse } from "next/server";
import { createPreviewToken } from "@/lib/adminSession";
import { PREVIEW_COOKIE_NAME } from "@/lib/adminAuth";
import { outreachEnabled } from "@/lib/outreach";

// The trial popup's "See your dashboard" CTA lands here. It mints a read-only
// preview token, drops it in a cookie, and sends the visitor into /admin. No
// login, no account created — writes are blocked by assertWritable(). Clicking
// the original link again just refreshes the token, so the preview stays
// reachable indefinitely.
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!outreachEnabled()) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const token = await createPreviewToken();
  const res = NextResponse.redirect(new URL("/admin", req.url));
  res.cookies.set(PREVIEW_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90, // 90 days
  });
  // Record the FIRST preview visit once, so the demo dashboard can grow across
  // return visits (the honest day-2 hook). Re-clicking the link never resets it.
  if (!req.cookies.get("admin_preview_since")) {
    res.cookies.set("admin_preview_since", String(Date.now()), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
    });
  }
  return res;
}
