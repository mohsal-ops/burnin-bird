import { NextResponse, type NextRequest } from "next/server";
import { isThemeSlug } from "@/lib/themes/registry";
import { THEME_PREVIEW_COOKIE } from "@/lib/themes/active";

// GET /api/theme-preview?t=diner-classic → preview that design on this site (in
// this browser only, 1 day) and land on the homepage. ?t=off clears it.
export function GET(req: NextRequest) {
  const t = req.nextUrl.searchParams.get("t");
  const res = NextResponse.redirect(new URL("/", req.url));
  if (isThemeSlug(t)) {
    res.cookies.set(THEME_PREVIEW_COOKIE, t, { path: "/", maxAge: 60 * 60 * 24, sameSite: "lax" });
  } else {
    res.cookies.delete(THEME_PREVIEW_COOKIE);
  }
  return res;
}
