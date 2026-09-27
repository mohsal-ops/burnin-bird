import db from "@/db/db";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { getSiteText, getSetting } from "@/lib/siteSettings";
import { THEME_MEDIA } from "./mediaSlots";
import type { ThemeSlug } from "./registry";

// Everything a bespoke themed homepage shows that the owner can edit in the
// dashboard: Content text (headline / subheadline / feature copy), Media photos
// (shared + this theme's own slots, each falling back sensibly) and the
// theme's signature words. Dashboard values win; siteConfig is the default.

export type ThemeHomeContent = {
  headline: string;
  subheadline: string;
  features: { title: string; description: string; image: string | null }[];
  images: Record<string, string | null>;
  words: Record<string, string>;
};

const opt = (k: string) => (SITE_CONFIG as unknown as Record<string, string | undefined>)[k];

export async function getThemeHomeContent(theme: ThemeSlug): Promise<ThemeHomeContent> {
  const spec = THEME_MEDIA[theme];
  const keys = new Set<string>(["home_hero", "home_hero_2", "home_hero_3", "home_feature_1", "home_feature_2"]);
  spec.slots.forEach((s) => {
    keys.add(s.key);
    if (s.fallback) keys.add(s.fallback);
  });

  const [text, rows, ...wordVals] = await Promise.all([
    getSiteText(),
    db.siteImage.findMany({ where: { key: { in: [...keys] } } }).catch(() => []),
    ...spec.words.map((w) => getSetting(w.key, "")),
  ]);
  const byKey = new Map(rows.map((r) => [r.key, r.url]));

  const images: Record<string, string | null> = {};
  for (const k of keys) images[k] = byKey.get(k) || null;
  for (const s of spec.slots) images[s.key] = byKey.get(s.key) || (s.fallback ? byKey.get(s.fallback) || null : null);

  const cf = SITE_CONFIG.home.distinctiveFeatures ?? [];
  const features = [0, 1].map((i) => ({
    title: (i === 0 ? text.feature1Title : text.feature2Title) || cf[i]?.title || "",
    description: (i === 0 ? text.feature1Desc : text.feature2Desc) || cf[i]?.description || "",
    image: byKey.get(`home_feature_${i + 1}`) || cf[i]?.image || null,
  })).filter((f) => f.title || f.description || f.image);

  // theme words: dashboard value → siteConfig override → none (component default)
  const legacy: Record<string, string | undefined> = {
    theme_subbrand: opt("subBrand"),
    theme_heroword: opt("heroWord"),
    theme_headline: opt("elegantHeadline"),
  };
  const words: Record<string, string> = {};
  spec.words.forEach((w, i) => {
    const v = (wordVals[i] as string) || legacy[w.key];
    if (v) words[w.key] = v;
  });

  return {
    headline: text.headline || SITE_CONFIG.home.heroHeadline,
    subheadline: text.subheadline || SITE_CONFIG.home.heroSubHeadline,
    features,
    images,
    words,
  };
}
