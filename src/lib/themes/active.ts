import { cookies, draftMode } from "next/headers";
import { isThemeSlug, resolveThemeSlug, type ThemeSlug } from "./registry";

// The theme THIS request renders with. Normally the site's configured theme —
// read WITHOUT touching cookies, so public pages can be statically cached (ISR)
// instead of re-rendered on every visit (the account's free CPU limit).
// Design previews (/api/theme-preview?t=<slug>, the builder's "Try live") turn on
// Next's draft mode, which makes only THAT browser bypass the cache and render
// live; then the `sv_theme_preview` cookie picks the design.
export const THEME_PREVIEW_COOKIE = "sv_theme_preview";

export async function getActiveTheme(): Promise<ThemeSlug> {
  if ((await draftMode()).isEnabled) {
    const v = (await cookies()).get(THEME_PREVIEW_COOKIE)?.value;
    if (isThemeSlug(v)) return v;
  }
  return resolveThemeSlug();
}
