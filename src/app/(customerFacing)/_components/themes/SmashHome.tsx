"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { CorePitch } from "../CorePitch";

// ── smash-bold homepage — modeled on Ender Hamburguesería's design language ──
// Monochrome + warm-tan, playful and loud: a scrolling announcement marquee, a
// big hand-lettered-feel display hero with doodle scribbles + a spinning badge +
// product shot, a huge slide-in section band, a repeating menu-item marquee, bold
// feature cards, reviews, and a numbered location. Uses the theme's tokens so it
// still respects dark mode + the tenant --brand. Content/photos are the client's
// own (from siteConfig + the DB) — only the DESIGN is modeled on the reference.

type P = { id: string; name: string; priceInCents: number; description: string | null; image: string | null };
type R = { id: string; name: string; review: string; avatar: string };

const usd = (c: number) => `$${(c / 100).toFixed(c % 100 === 0 ? 0 : 2)}`;

// A slice of hand-drawn scribble marks, Ender-style, around the headline.
function Doodles() {
  return (
    <svg className="pointer-events-none absolute -left-4 -top-6 h-[130%] w-[130%] overflow-visible text-primary" viewBox="0 0 400 200" fill="none" aria-hidden>
      <path d="M12 150 q-8 -14 4 -22" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M20 168 q-10 -6 -2 -18" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M356 40 q22 -10 30 14" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M372 66 q14 -2 8 16" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

// Rotating circular badge (SVG text on a circle), like Ender's spinning seal.
function SpinBadge({ text }: { text: string }) {
  const label = ` ${text} • ${text} • `;
  return (
    <div className="absolute -left-6 -top-6 z-20 grid size-24 place-items-center rounded-full bg-foreground text-background shadow-xl md:-left-10 md:size-28">
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full animate-[spin_9s_linear_infinite]">
        <defs>
          <path id="smashcircle" d="M50,50 m-36,0 a36,36 0 1,1 72,0 a36,36 0 1,1 -72,0" />
        </defs>
        <text className="fill-background" style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 }}>
          <textPath href="#smashcircle">{label}</textPath>
        </text>
      </svg>
      <span className="text-2xl">★</span>
    </div>
  );
}

export function SmashHome({ heroImages, logoUrl, featured, reviews }: { heroImages: (string | null)[]; logoUrl: string | null; featured: P[]; reviews: R[] }) {
  const c = SITE_CONFIG;
  const hero = heroImages.find(Boolean) ?? null;
  const promo = c.tagline || `${c.name} — order direct`;
  const items = featured.length ? [...featured, ...featured] : []; // doubled for a seamless marquee loop

  return (
    <div className="w-full pt-20">
      {/* 1 · Announcement marquee */}
      <div className="overflow-hidden border-y border-foreground bg-foreground py-2 text-background">
        <div className="flex w-max animate-[marquee_22s_linear_infinite] gap-8 whitespace-nowrap font-accent text-xs font-bold uppercase tracking-widest">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="flex items-center gap-8">{promo}<span className="text-primary">✦</span></span>
          ))}
        </div>
      </div>

      {/* 2 · Hero */}
      <section className="relative mx-auto grid max-w-7xl items-center gap-8 px-5 py-12 md:grid-cols-2 md:py-16">
        <div className="relative">
          <Doodles />
          <p className="font-accent mb-3 text-lg text-primary">Limited run</p>
          <h1 className="relative text-[clamp(3rem,11vw,7rem)] font-extrabold uppercase leading-[0.9] tracking-tighter text-foreground">
            {c.home.heroHeadline || c.name}
          </h1>
          <p className="mt-5 max-w-md text-base text-muted-foreground">{c.home.heroSubHeadline || c.subTagline}</p>
          <Link
            href="/Menu"
            className="cta-primary mt-7 inline-flex rounded-full bg-primary px-8 py-3 text-sm font-bold uppercase tracking-wide text-primary-foreground transition-transform hover:scale-105"
          >
            {c.menuCtaLabel}
          </Link>
        </div>
        <div className="relative">
          <SpinBadge text={c.trademark || "Fresh"} />
          <div className="overflow-hidden rounded-[2rem] border-2 border-foreground bg-card shadow-2xl">
            {hero ? (
              <Image src={hero} alt={c.name} width={720} height={560} className="h-[320px] w-full object-cover md:h-[440px]" priority />
            ) : (
              <div className="grid h-[320px] w-full place-items-center bg-muted md:h-[440px]">
                {logoUrl && <Image src={logoUrl} alt={c.name} width={140} height={140} className="opacity-60" />}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3 · Big slide-in band */}
      <section className="overflow-hidden bg-foreground py-14 text-background">
        <motion.h2
          initial={{ x: "12%", opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="px-5 text-center text-[clamp(2rem,8vw,5rem)] font-extrabold uppercase leading-none tracking-tighter"
        >
          {(c.cuisines?.[0] ?? "Smash")}<span className="text-primary">.</span>
        </motion.h2>
        <p className="mt-4 px-5 text-center font-accent text-lg text-primary">{c.cuisines?.slice(0, 3).join(" · ")}</p>
      </section>

      {/* 4 · Menu-item marquee */}
      {items.length > 0 && (
        <section className="overflow-hidden bg-background py-12">
          <div className="mb-6 flex items-baseline justify-between px-5">
            <h3 className="text-2xl font-extrabold uppercase tracking-tight text-foreground">The lineup</h3>
            <Link href="/Menu" className="font-accent text-primary hover:underline">See the menu →</Link>
          </div>
          <div className="group flex w-max animate-[marquee_30s_linear_infinite] gap-5 px-5 hover:[animation-play-state:paused]">
            {items.map((p, i) => (
              <div key={`${p.id}-${i}`} className="w-64 shrink-0 overflow-hidden rounded-2xl border-2 border-foreground bg-card">
                <div className="h-40 w-full bg-muted">
                  {p.image && <Image src={p.image} alt={p.name} width={320} height={200} className="h-40 w-full object-cover" />}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-bold uppercase tracking-tight text-card-foreground">{p.name}</h4>
                    <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">{usd(p.priceInCents)}</span>
                  </div>
                  {p.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5 · Feature cards */}
      {c.home.distinctiveFeatures?.length > 0 && (
        <section className="mx-auto grid max-w-7xl gap-5 px-5 py-14 md:grid-cols-2">
          {c.home.distinctiveFeatures.map((f, i) => (
            <motion.div
              key={i}
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="flex flex-col overflow-hidden rounded-3xl border-2 border-foreground bg-card md:flex-row"
            >
              {f.image && (
                <div className="h-48 w-full shrink-0 md:h-auto md:w-2/5">
                  <Image src={f.image} alt={f.title} width={400} height={300} className="h-full w-full object-cover" />
                </div>
              )}
              <div className="p-6">
                <h3 className="text-xl font-extrabold uppercase tracking-tight text-card-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>
              </div>
            </motion.div>
          ))}
        </section>
      )}

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

      {/* 7 · Numbered location */}
      <section className="mx-auto max-w-7xl px-5 py-14">
        <p className="font-accent text-lg text-primary">Find us</p>
        <div className="mt-4 flex items-center gap-5 rounded-3xl border-2 border-foreground bg-card p-6">
          <span className="text-4xl font-extrabold tracking-tighter text-primary">#001</span>
          <div>
            <h3 className="text-xl font-extrabold uppercase tracking-tight text-card-foreground">{c.city}</h3>
            <p className="text-sm text-muted-foreground">{c.address}</p>
          </div>
          <Link href="/Menu" className="cta-primary ml-auto hidden rounded-full bg-primary px-6 py-2.5 text-sm font-bold uppercase text-primary-foreground sm:inline-flex">
            {c.menuCtaLabel}
          </Link>
        </div>
      </section>

      {/* 8 · Core pitch (the four Starvega pillars, in-theme) */}
      <div className="flex justify-center pb-8">
        <CorePitch />
      </div>
    </div>
  );
}
