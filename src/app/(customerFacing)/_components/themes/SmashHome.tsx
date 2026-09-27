"use client";

import { SITE_CONFIG } from "@/lib/siteConfig";
import { CorePitch } from "../CorePitch";
import { SmashHero, mascotFor, type MascotVariant } from "./SmashHero";
import { SmashLineup } from "./SmashLineup";
import { SmashStory } from "./SmashStory";
import { SmashGallery } from "./SmashGallery";
import type { ThemeHomeContent } from "@/lib/themes/homeContent";

// ── smash-bold homepage — modeled closely on Ender Hamburguesería ────────────
// Bespoke, not a re-skin: Ender's rounded launch panel
// (mascot + branded packaging · 3-up limited lineup · #001 location, auto-
// rotating) → the huge "CATEGORY." headline with a drag row of big product
// cards → feature blocks → dark reviews band → tilted tagline ticker → the
// in-voice core pitch. Content/photos are the client's own — only the DESIGN
// is modeled on the reference. The mascot adapts to the business type
// (takeout bag · coffee cup · pizza box · bowl) via loaderStyle/cuisines, and
// siteConfig may pin it with `mascot` or rename the sub-brand with `subBrand`.

type P = { id: string; name: string; priceInCents: number; description: string | null; image: string | null };
type R = { id: string; name: string; review: string; avatar: string };

// Optional per-client knobs that older siteConfigs don't have.
const opt = <T,>(key: string): T | undefined => (SITE_CONFIG as unknown as Record<string, T | undefined>)[key];

export function SmashHome({ content, heroImages, featured, reviews, gallery = [] }: { content: ThemeHomeContent; heroImages: (string | null)[]; logoUrl: string | null; featured: P[]; reviews: R[]; gallery?: { url: string; alt?: string }[] }) {
  const c = SITE_CONFIG;
  const name = (c.trademark || c.name).toUpperCase();
  // Ender | ENDY → the brand's short, shoutable first word is the sub-brand.
  const sub = (content.words.theme_subbrand || (c.trademark || c.name).split(/\s+/)[0]).toUpperCase();
  // Media → 3D mascot: a preset path, "auto", or the owner's own upload.
  const picked = content.images.smash_mascot;
  const preset = picked?.match(/^\/mascots\/(box|cup|pizza|bowl)\.webp$/)?.[1] as MascotVariant | undefined;
  const mascot = preset ?? opt<MascotVariant>("mascot") ?? mascotFor(c.loaderStyle, c.cuisines);
  const customMascot = picked && picked !== "auto" && !preset ? picked : undefined;
  const promo = c.tagline || `${c.name} — order direct`;
  const heroPics = heroImages.filter(Boolean) as string[];
  const locationImg = content.images.smash_location ?? heroPics[1] ?? heroPics[0] ?? content.features[0]?.image ?? null;
  const category = opt<string>("primaryDish") || c.cuisines?.[1] || c.cuisines?.[0] || "Our menu";
  const subList = (c.cuisines ?? []).filter((x) => x !== category).slice(0, 4).map((x) => `${x}.`).join(" ");

  return (
    <div className="w-full overflow-x-clip pt-20">
      {/* 2 · Launch panel (mascot · lineup · location), auto-rotating */}
      <SmashHero
        name={name}
        sub={sub}
        mascot={mascot}
        customMascot={customMascot}
        items={featured.filter((p) => p.image).slice(0, 3)}
        city={c.city}
        address={c.address}
        locationImg={locationImg}
        ctaLabel="Learn more"
      />

      {/* 3 · "CATEGORY." + big product cards */}
      {featured.length > 0 && (
        <SmashLineup title={category} subtitle={subList} items={featured.slice(0, 10)} ctaLabel={c.menuCtaLabel} />
      )}

      {/* 5 · Story blocks (Ender café style) + the photo wall */}
      <SmashStory features={content.features} gallery={gallery.map((g) => g.url)} ctaLabel={c.menuCtaLabel} instagram={c.instagram} instagramUrl={c.instagramUrl} />
      <SmashGallery images={gallery} title="Straight from our kitchen" handle={c.instagram} handleUrl={c.instagramUrl} />

      {/* 6 · Reviews */}
      {reviews.length > 0 && (
        <section className="bg-foreground py-14 text-background">
          <h3 className="mb-8 px-5 text-center text-3xl font-extrabold uppercase tracking-tight">Word on the street</h3>
          <div className="mx-auto grid max-w-6xl gap-5 px-5 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.slice(0, 6).map((r) => (
              <div key={r.id} className="rounded-2xl border border-background/20 bg-background/5 p-5">
                <p className="text-primary">{"★★★★★"}</p>
                <p className="mt-2 text-sm leading-relaxed text-background/90">“{r.review}”</p>
                <p className="mt-3 text-xs font-bold uppercase tracking-wide">{r.name}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Announcement marquee — a tilted ticker band after the reviews */}
      <div className="relative z-10 my-6 overflow-hidden bg-foreground py-3 text-background shadow-xl" style={{ transform: "rotate(-1.5deg) scale(1.03)" }}>
        <div className="flex w-max animate-[marquee_28s_linear_infinite] gap-14 whitespace-nowrap text-sm font-semibold uppercase md:text-lg">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="flex items-center gap-14">{promo}<span className="text-brand">★</span></span>
          ))}
        </div>
      </div>

      {/* 8 · Core pitch (the four Starvega pillars, in-theme) */}
      <div className="flex justify-center pb-8">
        <CorePitch theme="smash-bold" />
      </div>
    </div>
  );
}
