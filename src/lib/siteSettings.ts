import db from "@/db/db";
import { SITE_CONFIG } from "@/lib/siteConfig";

// Default brand accent, pulled from siteConfig so a fresh DB (no theme_color
// row yet) still uses the real brand color. Overridden by the "theme_color"
// SiteSetting once the owner picks a color in admin → Branding.
export const DEFAULT_THEME_COLOR = SITE_CONFIG.primaryColor;

export async function getSetting(
  key: string,
  fallback = "",
): Promise<string> {
  try {
    const row = await db.siteSetting.findUnique({ where: { key } });
    return row?.value ?? fallback;
  } catch {
    return fallback;
  }
}

export async function getThemeColor(): Promise<string> {
  return getSetting("theme_color", DEFAULT_THEME_COLOR);
}

/** Custom uploaded logo URL, or "" to fall back to the bundled logo. */
export async function getLogoUrl(): Promise<string> {
  return getSetting("logo_url", "");
}

/** Editable home hero text; empty strings fall back to siteConfig defaults. */
export async function getHomeText(): Promise<{
  headline: string;
  subheadline: string;
}> {
  const [headline, subheadline] = await Promise.all([
    getSetting("home_headline", ""),
    getSetting("home_subheadline", ""),
  ]);
  return { headline, subheadline };
}

export type SiteText = {
  headline: string;
  subheadline: string;
  feature1Title: string;
  feature1Desc: string;
  feature2Title: string;
  feature2Desc: string;
};

/** All editable home-page text. Empty strings fall back to siteConfig defaults. */
export async function getSiteText(): Promise<SiteText> {
  const [headline, subheadline, feature1Title, feature1Desc, feature2Title, feature2Desc] =
    await Promise.all([
      getSetting("home_headline", ""),
      getSetting("home_subheadline", ""),
      getSetting("text_feature1_title", ""),
      getSetting("text_feature1_desc", ""),
      getSetting("text_feature2_title", ""),
      getSetting("text_feature2_desc", ""),
    ]);
  return { headline, subheadline, feature1Title, feature1Desc, feature2Title, feature2Desc };
}
