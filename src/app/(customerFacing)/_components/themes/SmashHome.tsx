"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { CorePitch } from "../CorePitch";
import { SmashMascot, WalkingSnack, mascotVariant } from "./SmashMascot";

// ── smash-bold homepage — modeled closely on Ender Hamburguesería ────────────
// Bespoke, not a re-skin: a bespoke marquee, a launch-style hero that CYCLES
// through product "slides" while the big puffy balloon brand word stays waving,
// a cuisine-adaptive mascot + a little walking snack, a full-bleed slide-in
// band, LARGE product cards with a hover lift, bold feature blocks, a dark
// reviews band, a numbered location, and the in-voice core pitch. Content/photos
// are the client's own — only the DESIGN is modeled on the reference.

type P = { id: string; name: string; priceInCents: number; description: string | null; image: string | null };
type R = { id: string; name: string; review: string; avatar: string };

const usd = (c: number) => `$${(c / 100).toFixed(c % 100 === 0 ? 0 : 2)}`;

// Size the balloon word to the brand length so short names go huge (Ender's
// "ENDY") and longer ones stay on two tidy lines without overflowing.
function balloonSize(text: string): string {
  const n = text.replace(/\s/g, "").length;
  if (n <= 5) return "clamp(3.5rem, 13vw, 8.5rem)";
  if (n <= 9) return "clamp(3rem, 9vw, 6rem)";
  return "clamp(2.2rem, 6.5vw, 4.5rem)";
}

// The big "waved" balloon brand word — letters bob individually, but words stay
// whole (wrap only at spaces), each letter with its own tilt.
function BalloonWord({ text }: { text: string }) {
  const words = text.split(/\s+/).filter(Boolean);
  let n = 0;
  return (
    <span aria-label={text} className="flex flex-wrap gap-x-[0.25em]" style={{ fontFamily: "var(--font-balloon), system-ui", lineHeight: 0.85 }}>
      {words.map((word, wi) => (
        <span key={wi} className="inline-flex whitespace-nowrap">
          {[...word].map((ch, ci) => {
            const i = n++;
            return (
              <span
                key={ci}
                aria-hidden
                className="inline-block motion-safe:animate-[balloon-bob_2.6s_ease-in-out_infinite]"
                style={{ ["--r" as string]: `${(i % 2 ? 1 : -1) * (2 + (i % 3))}deg`, animationDelay: `${i * 0.08}s` }}
              >
                {ch}
              </span>
            );
          })}
        </span>
      ))}
    </span>
  );
}

function SpinBadge({ text }: { text: string }) {
  const label = ` ${text} • ${text} • `;
  return (
    <div className="absolute -right-3 -top-3 z-20 grid size-20 place-items-center rounded-full bg-foreground text-background shadow-xl md:size-24">
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full animate-[spin_9s_linear_infinite]">
        <defs><path id="smashcircle" d="M50,50 m-36,0 a36,36 0 1,1 72,0 a36,36 0 1,1 -72,0" /></defs>
        <text className="fill-background" style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 }}>
          <textPath href="#smashcircle">{label}</textPath>
        </text>
      </svg>
      <span className="text-xl">★</span>
    </div>
  );
}

export function SmashHome({ heroImages, logoUrl, featured, reviews }: { heroImages: (string | null)[]; logoUrl: string | null; featured: P[]; reviews: R[] }) {
  const c = SITE_CONFIG;
  const brand = (c.trademark || c.name.split(" ")[0] || c.name).toUpperCase();
  const variant = mascotVariant(c.loaderStyle, c.cuisines);
  const promo = c.tagline || `${c.name} — order direct`;

  // Hero "slides" = the top featured products (fallback to a single brand slide).
  const slides: { title: string; image: string | null; desc: string | null }[] =
    featured.length > 0
      ? featured.slice(0, 4).map((p) => ({ title: p.name, image: p.image, desc: p.description }))
      : [{ title: c.cuisines?.[0] ?? "Signature", image: heroImages.find(Boolean) ?? null, desc: c.home.heroSubHeadline }];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % slides.length), 4200);
    return () => clearInterval(t);
  }, [slides.length]);
  const slide = slides[idx];

  const marqueeItems = featured.length ? [...featured, ...featured] : [];

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

      {/* 2 · Launch hero — persistent balloon word + cycling product slide */}
      <section className="relative mx-auto grid max-w-7xl items-center gap-6 px-5 py-10 md:grid-cols-2 md:py-14">
        {/* little walking snack strutting in */}
        <WalkingSnack variant={variant} className="absolute left-5 top-2 h-12 w-12 text-foreground motion-safe:animate-[snack-walk_3s_ease-in-out_infinite]" />

        <div className="relative pt-8">
          <p className="font-accent mb-1 text-xl text-primary">{brand} · {c.city}</p>
          <h1 className="text-foreground" style={{ fontSize: balloonSize(brand) }}>
            <BalloonWord text={brand} />
          </h1>
          <motion.p
            key={idx}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="mt-2 text-2xl font-extrabold uppercase tracking-tight text-foreground"
          >
            {slide.title}
          </motion.p>
          <p className="mt-1 font-accent text-lg uppercase tracking-widest text-muted-foreground">Limited edition</p>
          {slide.desc && <p className="mt-4 max-w-md text-sm text-muted-foreground">{slide.desc}</p>}
          <div className="mt-6 flex items-center gap-4">
            <Link href="/Menu" className="cta-primary inline-flex rounded-full bg-primary px-8 py-3 text-sm font-bold uppercase tracking-wide text-primary-foreground transition-transform hover:scale-105">
              {c.menuCtaLabel}
            </Link>
            {/* slide dots */}
            {slides.length > 1 && (
              <div className="flex gap-2">
                {slides.map((_, i) => (
                  <button key={i} onClick={() => setIdx(i)} aria-label={`Slide ${i + 1}`} className={`h-2.5 rounded-full transition-all ${i === idx ? "w-7 bg-primary" : "w-2.5 bg-foreground/25"}`} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* right: product card + mascot + spinning badge */}
        <div className="relative">
          <SpinBadge text={brand.slice(0, 8)} />
          <SmashMascot variant={variant} brand={brand} className="absolute -bottom-4 -left-6 z-20 hidden h-52 w-40 drop-shadow-xl sm:block" />
          <div className="relative overflow-hidden rounded-[2rem] border-2 border-foreground bg-card shadow-2xl">
            <motion.div key={idx} initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
              {slide.image ? (
                <Image src={slide.image} alt={slide.title} width={720} height={560} className="h-[300px] w-full object-cover md:h-[430px]" priority />
              ) : (
                <div className="grid h-[300px] w-full place-items-center bg-muted md:h-[430px]">
                  {logoUrl && <Image src={logoUrl} alt={c.name} width={140} height={140} className="opacity-60" />}
                </div>
              )}
            </motion.div>
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

      {/* 4 · Big product cards with hover lift (the "lineup") */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 py-14">
          <div className="mb-8 flex items-end justify-between">
            <h3 className="text-3xl font-extrabold uppercase tracking-tight text-foreground">The lineup</h3>
            <Link href="/Menu" className="font-accent text-xl text-primary hover:underline">See the full menu →</Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.slice(0, 6).map((p) => (
              <Link
                key={p.id}
                href="/Menu"
                className="group flex flex-col overflow-hidden rounded-3xl border-2 border-foreground bg-card transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.35)]"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                  {p.image ? (
                    <Image src={p.image} alt={p.name} width={520} height={400} className="size-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <div className="grid size-full place-items-center">{logoUrl && <Image src={logoUrl} alt={p.name} width={90} height={90} className="opacity-50" />}</div>
                  )}
                  <span className="absolute right-3 top-3 rounded-full bg-primary px-3 py-1 text-sm font-bold text-primary-foreground shadow">{usd(p.priceInCents)}</span>
                </div>
                <div className="p-5">
                  <h4 className="text-lg font-extrabold uppercase tracking-tight text-card-foreground">{p.name}</h4>
                  {p.description && <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>}
                  <span className="mt-3 inline-flex font-accent text-lg text-primary opacity-0 transition-opacity group-hover:opacity-100">Order it →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 5 · Feature blocks */}
      {c.home.distinctiveFeatures?.length > 0 && (
        <section className="mx-auto grid max-w-7xl gap-5 px-5 pb-14 md:grid-cols-2">
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
        <p className="font-accent text-xl text-primary">Find us</p>
        <div className="mt-4 flex flex-wrap items-center gap-5 rounded-3xl border-2 border-foreground bg-card p-6">
          <span className="text-4xl font-extrabold tracking-tighter text-primary">#001</span>
          <div>
            <h3 className="text-xl font-extrabold uppercase tracking-tight text-card-foreground">{c.city}</h3>
            <p className="text-sm text-muted-foreground">{c.address}</p>
          </div>
          <Link href="/Menu" className="cta-primary ml-auto inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-bold uppercase text-primary-foreground">
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
