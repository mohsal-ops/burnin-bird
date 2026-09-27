import { cookies } from "next/headers";
import { isThemeSlug, resolveThemeSlug, type ThemeSlug } from "./registry";

// The theme THIS request renders with: a `sv_theme_preview` cookie (set by
// /api/theme-preview?t=<slug>, e.g. from the builder's "Preview" link) wins so an
// owner/agency can try any design on the live site in their own browser only;
// otherwise the site's configured theme. Visitors never have the cookie.
export const THEME_PREVIEW_COOKIE = "sv_theme_preview";

export async function getActiveTheme(): Promise<ThemeSlug> {
  const v = (await cookies()).get(THEME_PREVIEW_COOKIE)?.value;
  return isThemeSlug(v) ? v : resolveThemeSlug();
}
