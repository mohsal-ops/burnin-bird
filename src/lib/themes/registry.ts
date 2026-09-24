// Design-theme registry — the single source of truth for which visual "skins" a
// client site can wear. A theme controls the SKIN only (fonts, colors, motion
// feel, component styling). The section STRUCTURE + sales content is identical
// across every theme and lives in the page-assembly layer, not here.
//
// SYNC: keep the slug list identical to the panel's copy at
// vegastar-builder-panel/src/lib/themes.ts (labels/descriptions may differ).
//
// Adding a theme = add a slug + ThemePack here, a CSS token block in
// src/app/themes.css, its fonts in ./fonts.ts, and its component variants in the
// section registry (Phase 3). Nothing else needs to change.
import { SITE_CONFIG } from "@/lib/siteConfig";

export const THEME_SLUGS = [
  "classic-starvega",
  "smash-bold",
  "diner-classic",
  "refined-elegant",
] as const;

export type ThemeSlug = (typeof THEME_SLUGS)[number];

// The current, live design. Every existing client site (whose siteConfig has no
// `theme` field, since siteConfig is on the template-sync blocklist) resolves to
// this and therefore renders exactly as it does today.
export const DEFAULT_THEME: ThemeSlug = "classic-starvega";

// How dramatic a theme's motion feels — consumed by the shared FadeIn/section
// wrappers in Phase 3. Kept data-only here so the registry stays framework-free.
export type MotionFeel = "subtle" | "lively" | "dramatic";

export type ThemePack = {
  slug: ThemeSlug;
  label: string; // shown in the builder's theme picker
  description: string; // one line, owner-facing
  // What each theme is "for" — used as copy guidance and picker subtext.
  personality: string;
  motion: MotionFeel;
  // Reference direction (internal only — never shown to a client, never a clone).
  inspiredBy: string;
};

export const THEMES: Record<ThemeSlug, ThemePack> = {
  "classic-starvega": {
    slug: "classic-starvega",
    label: "Classic Starvega",
    description: "Our signature clean, bright layout — the default every site ships with.",
    personality: "Versatile and trustworthy. Fits almost any restaurant out of the box.",
    motion: "subtle",
    inspiredBy: "current Starvega template",
  },
  "smash-bold": {
    slug: "smash-bold",
    label: "Smash & Bold",
    description: "Urban, high-energy, late-night. Big uppercase type and warm tan on near-black.",
    personality: "Loud and confident — smash burgers, wings, street food, late-night spots.",
    motion: "dramatic",
    inspiredBy: "Ender Hamburguesería",
  },
  "diner-classic": {
    slug: "diner-classic",
    label: "Diner Classic",
    description: "Warm, retro comfort. Cream and golden yellow with a friendly, homey feel.",
    personality: "Cozy and nostalgic — comfort food, grilled cheese, breakfast, family diners.",
    motion: "subtle",
    inspiredBy: "Fame Grilled Cheese",
  },
  "refined-elegant": {
    slug: "refined-elegant",
    label: "Refined Elegant",
    description: "Upscale and understated. Wide elegant type, soft gold, generous whitespace.",
    personality: "Polished and premium — Italian, fine dining, wine bars, date-night spots.",
    motion: "lively",
    inspiredBy: "Fiorella SF",
  },
};

export function isThemeSlug(v: unknown): v is ThemeSlug {
  return typeof v === "string" && (THEME_SLUGS as readonly string[]).includes(v);
}

export function getTheme(slug: ThemeSlug): ThemePack {
  return THEMES[slug];
}

// Resolve the active theme for THIS site. Read loosely from SITE_CONFIG so a
// client whose siteConfig predates the theme field (no `theme` key) compiles and
// falls back to the default — the guarantee that no existing site changes look.
export function resolveThemeSlug(): ThemeSlug {
  const raw = (SITE_CONFIG as Record<string, unknown>).theme;
  return isThemeSlug(raw) ? raw : DEFAULT_THEME;
}
