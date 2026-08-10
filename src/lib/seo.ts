import type { Metadata } from "next";
import { SITE_CONFIG } from "./siteConfig";

// Single source of truth for page metadata. Every page's <title>/description/
// OpenGraph/canonical is GENERATED from SITE_CONFIG here instead of being
// hand-typed in each page.tsx, so cloning the template for a new restaurant
// only requires editing SITE_CONFIG - the SEO can never drift out of sync.

export type PageKey =
  | "home"
  | "menu"
  | "story"
  | "giftCard"
  | "kidsZone"
  | "rewards"
  | "catering"
  | "terms"
  | "blog";

const { name, city, state } = SITE_CONFIG;

// Per-page label + path + description. Descriptions are written generically
// from the restaurant name/city so they read correctly for ANY client without
// editing this file.
const PAGE_DEFS: Record<PageKey, { label: string; path: string; blurb: string }> = {
  home: { label: "", path: "/", blurb: SITE_CONFIG.seoDescription },
  menu: {
    label: "Menu",
    path: "/Menu",
    blurb: `Order online from ${name} in ${city}, ${state}. Pickup or delivery, full menu with kids options.`,
  },
  story: {
    label: "Our Story",
    path: "/story",
    blurb: `The story behind ${name} - a family-owned restaurant in ${city}, ${state}.`,
  },
  giftCard: {
    label: "Gift Cards",
    path: "/GiftCard",
    blurb: `Send a ${name} gift card instantly - perfect for any occasion in ${city}, ${state}. Instant delivery, no expiration.`,
  },
  kidsZone: {
    label: "Kids Zone",
    path: "/KidsZone",
    blurb: `${name} is a family-friendly restaurant in ${city}, ${state}. Free games for kids while you wait for your order.`,
  },
  rewards: {
    label: "Rewards",
    path: "/rewards",
    blurb: `Join ${name} Rewards - earn points on every order and redeem them for free items. No app required.`,
  },
  catering: {
    label: "Catering",
    path: "/catering",
    blurb: `${name} caters events of every size in ${city}, ${state}. Request a custom quote today.`,
  },
  terms: {
    label: "Terms & Policies",
    path: "/terms",
    blurb: `Terms of service, privacy policy, and ordering policies for ${name} in ${city}, ${state}.`,
  },
  blog: {
    label: "Journal",
    path: "/Blog",
    blurb: `Stories, culture, and food from ${name} in ${city}, ${state}.`,
  },
};

export function buildMetadata(page: PageKey): Metadata {
  const def = PAGE_DEFS[page];
  const isHome = page === "home";
  const title = isHome ? SITE_CONFIG.seoTitle : `${def.label} | ${name} ${city}`;
  const ogTitle = isHome ? SITE_CONFIG.seoTitle : `${def.label} | ${name}`;
  const description = def.blurb;

  return {
    metadataBase: new URL(SITE_CONFIG.siteUrl),
    title,
    description,
    keywords: SITE_CONFIG.seoKeywords,
    alternates: { canonical: def.path },
    icons: { icon: "/logo.png" },
    openGraph: {
      title: ogTitle,
      description,
      url: def.path,
      siteName: name,
      images: [
        {
          url: SITE_CONFIG.ogImage,
          width: 1200,
          height: 630,
          alt: `${name} in ${city}, ${state}`,
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: [SITE_CONFIG.ogImage],
    },
  };
}
