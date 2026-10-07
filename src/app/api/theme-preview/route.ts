import { cookies, draftMode } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { isThemeSlug } from "@/lib/themes/registry";
import { THEME_PREVIEW_COOKIE } from "@/lib/themes/active";

// GET /api/theme-preview?t=diner-classic → preview that design on this site (in
// this browser only, 1 day) and land on the homepage. ?t=off clears it.
// Draft mode makes this browser skip the static page cache so the preview renders.
export async function GET(req: NextRequest) {
  const t = req.nextUrl.searchParams.get("t");
  const jar = await cookies();
  const dm = await draftMode();
  if (isThemeSlug(t)) {
    dm.enable();
    jar.set(THEME_PREVIEW_COOKIE, t, { path: "/", maxAge: 60 * 60 * 24, sameSite: "lax" });
  } else {
    dm.disable();
    jar.delete(THEME_PREVIEW_COOKIE);
  }
  redirect("/");
}
