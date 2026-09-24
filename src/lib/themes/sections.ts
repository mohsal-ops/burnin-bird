// The homepage SECTION CONTRACT — the structure layer that is identical across
// every theme. Themes vary the skin (fonts/colors/motion/component look); they
// can never change which sections exist, their order, or their purpose. This is
// the Starvega conversion formula (Principle 6, "optimize online first
// impression") and it is enforced centrally at page assembly, not left to each
// theme to honor.
//
// A theme supplies its OWN visual component for each section id (a different
// Hero, a different MenuGrid, …); the assembly walks SECTION_ORDER and renders
// them in this fixed sequence, so a theme is structurally unable to skip or
// reorder a section or drop the core-pitch block.
import type { ComponentType, ReactNode } from "react";
import type { ThemeSlug } from "./registry";

export type SectionId =
  | "hero"
  | "popularItems"
  | "socialProof"
  | "faqStory"
  | "corePitch";

// Fixed order + purpose. The order of this array IS the page order.
export const SECTION_CONTRACT: {
  id: SectionId;
  title: string;
  purpose: string;
}[] = [
  {
    id: "hero",
    title: "Hero",
    purpose: "Tagline + best-dish photo. Say what this place is in one glance.",
  },
  {
    id: "popularItems",
    title: "Popular menu items",
    purpose: "Photo-forward grid of best sellers. Names + images, not walls of text.",
  },
  {
    id: "socialProof",
    title: "Social proof",
    purpose: "Real reviews. Borrow trust before asking for the order.",
  },
  {
    id: "faqStory",
    title: "FAQ + Our Story",
    purpose: "Answer the common questions and tell who you are.",
  },
  {
    id: "corePitch",
    title: "Core pitch",
    purpose:
      "The four pillars — catering, commission-free direct ordering, loyalty, and local search visibility — worded in this theme's voice. Non-negotiable, every theme.",
  },
];

// Derived, so nothing can drift from SECTION_CONTRACT.
export const SECTION_ORDER: SectionId[] = SECTION_CONTRACT.map((s) => s.id);

// Everything the page fetches once and hands to whichever theme's section
// components render it. Kept as `unknown`-friendly wrappers so this module stays
// free of prisma/UI imports; the assembly + section components (Phase 3) refine
// these at the point of use.
export type HomeSectionData = {
  hero: {
    images: (string | null)[];
    headline: string;
    subheadline: string;
    logoUrl: string | null;
  };
  // The heavier, DB-backed slots are passed as ready-rendered nodes from the
  // page (which owns Suspense + data fetching), so a theme's section component
  // decides only the FRAME/skin around them, never the data plumbing.
  slots: Partial<Record<SectionId, ReactNode>>;
};

// A theme's set of section components. A theme that registers a set here opts
// into the themed assembly; a theme with no set (classic-starvega) keeps its
// own native page untouched.
export type ThemeSectionSet = Partial<
  Record<SectionId, ComponentType<{ data: HomeSectionData }>>
>;

// Filled in Phase 3 as each theme's section components are built. Empty here
// means every theme still renders the current classic page — a safe no-op that
// establishes the enforcement seam without changing any output yet.
export const THEME_SECTION_SETS: Partial<Record<ThemeSlug, ThemeSectionSet>> = {};

export function getThemeSectionSet(slug: ThemeSlug): ThemeSectionSet | null {
  return THEME_SECTION_SETS[slug] ?? null;
}

// True when a theme drives the homepage through its OWN section components. When
// false (the default, and always for classic-starvega), the page renders its
// existing native layout unchanged.
export function themeHasCustomHome(slug: ThemeSlug): boolean {
  const set = THEME_SECTION_SETS[slug];
  return !!set && Object.keys(set).length > 0;
}
