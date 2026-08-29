// ─────────────────────────────────────────────────────────────────────────────
// Package tiers — the single source of truth for VegaStar's product ladder:
// prices, and which site + admin capabilities each tier unlocks.
//
// SYNC: this file is mirrored byte-for-byte in two repos. Keep them identical:
//   - D:/next-js/projects/vegastar-builder-panel/src/lib/packages.ts   (panel: enum, provisioning feature-derivation, card labels)
//   - D:/next-js/projects/burnin-bird/src/lib/packages.ts              (template: nav/admin gating, trial popup pricing)
// Prices are defined ONLY here. Nothing else in either repo should hardcode a
// package price. Standard/Pro numbers are a starting point and safe to adjust.
// ─────────────────────────────────────────────────────────────────────────────

export type PackageTier = "STARTER" | "STANDARD" | "PRO";

export const PACKAGES = {
  STARTER: {
    label: "Starter",
    price: 399,
    blurb: "Food trucks, counter-service, first website ever.",
  },
  STANDARD: {
    label: "Standard",
    price: 999, // starting point — adjustable
    blurb: "Most sit-down independents who want the real toolkit.",
  },
  PRO: {
    label: "Pro",
    price: 1999, // starting point — adjustable
    blurb: "Multi-location owners, or anyone who wants everything.",
  },
} as const;

// Ordered low → high. Used by `atLeast` for tier comparisons.
export const TIER_ORDER: PackageTier[] = ["STARTER", "STANDARD", "PRO"];

// True when `have` is the same tier or higher than `need`.
export const atLeast = (have: PackageTier, need: PackageTier): boolean =>
  TIER_ORDER.indexOf(have) >= TIER_ORDER.indexOf(need);

// Resolve a site's tier defensively. A site whose siteConfig predates tiers (no
// packageTier field — e.g. an existing client that receives new template code via
// "Update from template" but keeps its blocklisted siteConfig) is treated as PRO,
// so gating never strips sections from an already-live site.
export function tierOf(cfg: { packageTier?: PackageTier }): PackageTier {
  return cfg.packageTier ?? "PRO";
}

// Per-tier capability flags. Drives the panel's FEATURES derivation and the
// template's ordering/section gating. Nav items also carry their own `minTier`
// tags (see siteConfig.ts / admin/_components/nav.tsx) and compare with `atLeast`.
export type TierCapabilities = {
  // Site sections
  catering: boolean;
  giftCard: boolean;
  rewards: boolean;
  blog: boolean;
  gallery: boolean;
  kidsZone: boolean;
  // Ordering
  delivery: boolean; // pickup is always on; this adds delivery + time-slots
  multiLocation: boolean; // "places" tooling
};

export const TIER_CAPABILITIES: Record<PackageTier, TierCapabilities> = {
  STARTER: {
    catering: false,
    giftCard: false,
    rewards: false,
    blog: false,
    gallery: false,
    kidsZone: false,
    delivery: false,
    multiLocation: false,
  },
  STANDARD: {
    catering: true,
    giftCard: true,
    rewards: false,
    blog: true,
    gallery: true,
    kidsZone: false,
    delivery: true,
    multiLocation: false,
  },
  PRO: {
    catering: true,
    giftCard: true,
    rewards: true,
    blog: true,
    gallery: true,
    kidsZone: true,
    delivery: true,
    multiLocation: true,
  },
};

// The four nav feature flags the restaurant template understands (its FEATURES
// block). Derived from a tier so the panel writes the right flags at provision.
export type Features = { catering: boolean; giftCard: boolean; rewards: boolean; blog: boolean };

export function featuresForTier(tier: PackageTier): Features {
  const c = TIER_CAPABILITIES[tier];
  return { catering: c.catering, giftCard: c.giftCard, rewards: c.rewards, blog: c.blog };
}
