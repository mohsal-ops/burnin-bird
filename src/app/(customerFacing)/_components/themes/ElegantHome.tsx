"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useInView, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { CorePitch } from "../CorePitch";
import { ElegantGallery } from "./ElegantGallery";
import type { ThemeHomeContent } from "@/lib/themes/homeContent";

// ── refined-elegant homepage — modeled closely on Fiorella SF ────────────────
// Editorial and dark-lit: a full-screen photo hero (slow Ken Burns) with a heavy
// geometric STENCIL headline revealing line by line under a transparent nav, a
// sticky soft-gold "ORDER ONLINE" pill, a split photo/prose "doors are open"
// intro, an elegant priced menu list with a cursor-following photo preview,
// full-bleed parallax photo sections ("VISIT US" with outlined location pills,
// "OUR STORY" with long-form prose), a quiet rotating review, FAQ, and the
// in-voice core pitch. Content/photos are the client's own.

type P = { id: string; name: string; priceInCents: number; description: string | null; image: string | null };
type R = { id: string; name: string; review: string; avatar: string };

// Owner-editable palette (admin → Branding → Design colours) via --tp-* vars;
// defaults = Fiorella's soft gold #FFD469 on warm near-black #0F0606.
const GOLD = "var(--tp-accent)";
const INK = "var(--tp-ink)";
const ON_GOLD = "var(--tp-on-accent)";
const EASE = [0.16, 1, 0.3, 1] as const;
const usd = (c: number) => `$${(c / 100).toFixed(2)}`;
const stencil: React.CSSProperties = { fontFamily: "var(--font-stencil), sans-serif", letterSpacing: "0.02em", textTransform: "uppercase" };
const jost: React.CSSProperties = { fontFamily: "var(--font-jost), sans-serif" };

// Each line slides up out of its own clip mask. In-view is observed on the
// (unclipped) wrapper — observing the translated line itself never fires,
// because it starts fully hidden inside its overflow-hidden mask.
function RevealLines({ lines, className = "", delay = 0 }: { lines: string[]; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-5% 0px" });
  const show = reduce || inView;
  return (
    <span ref={ref} className={`block ${className}`}>
      {lines.map((l, i) => (
        <span key={i} className="block overflow-hidden pb-[0.06em]">
          <motion.span
            className="block"
            initial={reduce ? false : { y: "110%" }}
            animate={show ? { y: "0%" } : { y: "110%" }}
            transition={{ duration: 1.1, ease: EASE, delay: delay + i * 0.14 }}
          >
            {l}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

function FadeUp({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12%" }}
      transition={{ duration: 1, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

function Pill({ href, children, solid = false, external = false }: { href: string; children: React.ReactNode; solid?: boolean; external?: boolean }) {
  const cls = solid
    ? "bg-[var(--tp-accent)] text-[var(--tp-on-accent)] hover:bg-white hover:text-[var(--tp-ink)]"
    : "border-2 border-white/90 text-white hover:bg-white hover:text-[var(--tp-ink)]";
  const body = (
    <span className={`inline-flex min-w-[11rem] items-center justify-center rounded-full px-8 py-3.5 text-sm font-semibold uppercase tracking-[0.08em] transition-colors duration-300 ${cls}`} style={jost}>
      {children}
    </span>
  );
  return external ? <a href={href} target="_blank" rel="noopener noreferrer">{body}</a> : <Link href={href}>{body}</Link>;
}

// Full-bleed photo band with a gentle parallax drift.
function PhotoBand({ src, children, minH = "min-h-[90svh]" }: { src: string | null; children: React.ReactNode; minH?: string }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);
  return (
    <section ref={ref} className={`relative flex ${minH} items-center justify-center overflow-hidden`} style={{ background: INK }}>
      {src && (
        <motion.div className="absolute -inset-y-[14%] inset-x-0" style={{ y }}>
          <Image src={src} alt="" fill sizes="100vw" className="object-cover" />
        </motion.div>
      )}
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 w-full px-6 py-24 text-center text-white">{children}</div>
    </section>
  );
}

// Menu list whose rows summon a floating photo that trails the cursor.
function MenuList({ items }: { items: P[] }) {
  const [hover, setHover] = useState<P | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 24 });
  const sy = useSpring(y, { stiffness: 220, damping: 24 });
  return (
    <div
      className="relative mx-auto grid max-w-6xl gap-x-16 md:grid-cols-2"
      onMouseMove={(e) => {
        x.set(e.clientX + 24);
        y.set(e.clientY - 110);
      }}
      onMouseLeave={() => setHover(null)}
    >
      {items.map((p, i) => (
        <FadeUp key={p.id} delay={(i % 2) * 0.08}>
          <Link href="/Menu" onMouseEnter={() => setHover(p.image ? p : null)} className="group block border-b border-black/10 py-6">
            <div className="flex items-baseline gap-4">
              <h3 className="text-base font-semibold uppercase tracking-[0.12em] transition-colors group-hover:text-[var(--tp-accent-deep)] md:text-lg" style={jost}>{p.name}</h3>
              <span className="mb-1 flex-1 border-b border-dotted border-black/25" />
              <span className="text-base font-medium" style={jost}>{usd(p.priceInCents)}</span>
            </div>
            {p.description && <p className="mt-2 line-clamp-2 text-[0.95rem] leading-relaxed text-[#737373]" style={jost}>{p.description}</p>}
          </Link>
        </FadeUp>
      ))}
      <AnimatePresence>
        {hover?.image && (
          <motion.div
            key={hover.id}
            className="pointer-events-none fixed left-0 top-0 z-40 hidden h-56 w-44 overflow-hidden rounded-sm shadow-2xl md:block"
            style={{ x: sx, y: sy }}
            initial={{ opacity: 0, scale: 0.85, rotate: -4 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <Image src={hover.image} alt="" fill sizes="176px" className="object-cover" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Reviews({ reviews }: { reviews: R[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reviews.length < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % reviews.length), 7000);
    return () => clearInterval(t);
  }, [reviews.length]);
  const r = reviews[i];
  return (
    <section className="px-6 py-28 text-center" style={{ color: INK, background: "var(--tp-paper)" }}>
      <FadeUp>
        <p className="text-sm font-semibold uppercase tracking-[0.3em]" style={{ ...jost, color: "var(--tp-accent-deep)" }}>★ ★ ★ ★ ★</p>
      </FadeUp>
      <div className="relative mx-auto mt-8 min-h-[14rem] max-w-3xl">
        <AnimatePresence mode="wait">
          <motion.figure key={r.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} transition={{ duration: 0.8, ease: EASE }}>
            <blockquote className="line-clamp-5 text-xl font-light leading-relaxed md:text-[1.7rem] md:leading-snug" style={jost}>“{r.review}”</blockquote>
            <figcaption className="mt-8 text-sm font-semibold uppercase tracking-[0.25em] text-[#737373]" style={jost}>{r.name}</figcaption>
          </motion.figure>
        </AnimatePresence>
      </div>
      {reviews.length > 1 && (
        <div className="mt-8 flex justify-center gap-3">
          {reviews.slice(0, 8).map((rv, k) => (
            <button key={rv.id} onClick={() => setI(k)} aria-label={`Review ${k + 1}`} className={`h-px transition-all duration-500 ${k === i ? "w-12 bg-black" : "w-6 bg-black/25 hover:bg-black/50"}`} />
          ))}
        </div>
      )}
    </section>
  );
}

export function ElegantHome({ content, heroImages, gallery, galleryItems = [], featured, reviews }: { content: ThemeHomeContent; heroImages: (string | null)[]; gallery: string[]; galleryItems?: { url: string; alt?: string | null }[]; featured: P[]; reviews: R[] }) {
  const c = SITE_CONFIG;
  const reduce = useReducedMotion();
  const photos = [...(heroImages.filter(Boolean) as string[]), ...gallery, ...(content.features.map((f) => f.image).filter(Boolean) as string[])];
  // Media's four Refined slots win; otherwise cycle the owner's other photos.
  const slotKeys = ["elegant_hero", "elegant_intro", "elegant_visit", "elegant_story"];
  const pic = (n: number) => content.images[slotKeys[n]] ?? photos[n % Math.max(photos.length, 1)] ?? null;
  const headline = (content.words.theme_headline || `Neighborhood ${c.primaryDish || c.cuisines?.[0] || "kitchen"}`).toUpperCase();
  const words = headline.split(/\s+/);
  const lines = words.length > 2 ? [words.slice(0, Math.ceil(words.length / 2)).join(" "), words.slice(Math.ceil(words.length / 2)).join(" ")] : words;

  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const heroFade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <div className="theme-bespoke w-full overflow-x-clip" style={{ color: INK, background: "var(--tp-paper)" }}>
      {/* 1 · Full-screen photo hero */}
      <section ref={heroRef} className="relative flex h-svh min-h-[560px] items-center justify-center overflow-hidden" style={{ background: INK }}>
        {pic(0) && (
          <motion.div className="absolute inset-0" style={{ y: reduce ? 0 : heroY }}>
            <div className="absolute inset-0" style={{ animation: reduce ? undefined : "elegantKenBurns 14s ease-out forwards" }}>
              <Image src={pic(0)!} alt={c.name} fill priority sizes="100vw" className="object-cover" />
            </div>
          </motion.div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/60" />
        <motion.div className="relative z-10 px-6 text-center text-white" style={{ opacity: heroFade }}>
          <h1 className="text-[clamp(2.6rem,7.5vw,6.5rem)] leading-[0.95]" style={stencil}>
            <RevealLines lines={lines} delay={0.3} />
          </h1>
          <motion.p
            className="mx-auto mt-6 max-w-xl text-base font-light tracking-wide text-white/85 md:text-lg"
            style={jost}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 1 }}
          >
            {c.tagline}
          </motion.p>
        </motion.div>
        <motion.span
          aria-hidden
          className="absolute bottom-24 left-1/2 h-14 w-px -translate-x-1/2 origin-top bg-white/70"
          animate={{ scaleY: [0, 1, 0], originY: [0, 0, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
      </section>

      {/* sticky soft-gold order pill (Fiorella's ORDER ONLINE) */}
      <motion.div
        className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.8, ease: EASE }}
      >
        <Link
          href="/Menu"
          className="inline-flex w-[18rem] items-center justify-center rounded-full py-3 text-[0.95rem] font-semibold uppercase tracking-[0.06em] shadow-[0_12px_30px_-10px_rgba(0,0,0,0.5)] transition-transform duration-300 hover:scale-[1.04]"
          style={{ ...jost, background: GOLD, color: ON_GOLD }}
        >
          Order online
        </Link>
      </motion.div>

      {/* 2 · Split intro */}
      <section className="mx-auto grid max-w-[90rem] items-start gap-10 px-6 py-24 md:grid-cols-2 md:gap-12 md:px-10 md:py-40">
        <FadeUp className="relative aspect-[4/5] w-full overflow-hidden">
          {pic(1) && <Image src={pic(1)!} alt="" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover transition-transform duration-[1.6s] ease-out hover:scale-105" />}
        </FadeUp>
        <div className="md:pt-4">
          <FadeUp>
            <h2 className="text-2xl font-semibold md:text-[1.7rem]" style={jost}>Our doors are open in {c.city}!</h2>
          </FadeUp>
          <FadeUp delay={0.1}>
            <p className="mt-8 text-lg leading-[1.75] text-[#737373]" style={jost}>{content.subheadline}. {content.features[0]?.description}</p>
          </FadeUp>
          {content.features[1] && (
            <FadeUp delay={0.2}>
              <p className="mt-5 text-lg leading-[1.75] text-[#737373]" style={jost}>{content.features[1].description}</p>
            </FadeUp>
          )}
          <FadeUp delay={0.3} className="mt-10">
            <Link href="/story" className="group inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em]" style={jost}>
              Our story
              <span className="h-px w-10 bg-current transition-all duration-500 group-hover:w-20" />
            </Link>
          </FadeUp>
        </div>
      </section>

      {/* 3 · The menu (elegant list) */}
      {featured.length > 0 && (
        <section className="px-6 pb-28 md:px-10">
          <h2 className="mb-14 text-center text-[clamp(2.4rem,6vw,4.5rem)]" style={stencil}>
            <RevealLines lines={["The menu"]} />
          </h2>
          <MenuList items={featured.slice(0, 8)} />
          <div className="mt-14 flex justify-center">
            <Link href="/Menu" className="inline-flex rounded-full border-2 border-[var(--tp-ink)] px-10 py-3.5 text-sm font-semibold uppercase tracking-[0.1em] transition-colors duration-300 hover:bg-[var(--tp-ink)] hover:text-white" style={jost}>
              View full menu
            </Link>
          </div>
        </section>
      )}

      {/* 4 · Visit us (Fiorella's RESERVATIONS band) */}
      <PhotoBand src={pic(2)}>
        <h2 className="text-[clamp(2.6rem,7vw,5.5rem)] leading-none" style={stencil}>
          <RevealLines lines={["Visit us"]} />
        </h2>
        <FadeUp>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-light leading-relaxed md:text-2xl" style={jost}>
            {c.address}. Pickup, delivery and catering — ordered direct from us.
          </p>
        </FadeUp>
        <FadeUp delay={0.15} className="mt-10 flex flex-col items-center gap-5">
          <Pill href="/Menu">Order pickup</Pill>
          {c.navLinks.some((l) => l.href === "/catering") && <Pill href="/catering">Catering</Pill>}
          {c.googleMapsUrl && <Pill href={c.googleMapsUrl} external>Directions</Pill>}
        </FadeUp>
      </PhotoBand>

      {/* 5 · Reviews */}
      {reviews.length > 0 && <Reviews reviews={reviews} />}

      {/* 5b · Gallery — pinned sideways "exhibition walk" of the dashboard gallery */}
      {galleryItems.length > 0 && <ElegantGallery images={galleryItems} />}

      {/* 6 · Our story (long-form over photo) */}
      <PhotoBand src={pic(3)} minH="min-h-[100svh]">
        <h2 className="text-[clamp(2.6rem,7vw,5.5rem)] leading-none" style={stencil}>
          <RevealLines lines={["Our story"]} />
        </h2>
        <div className="mx-auto mt-8 max-w-3xl space-y-5 text-left text-lg leading-[1.8] text-white/90" style={jost}>
          <FadeUp><p>{content.headline}. {content.subheadline}.</p></FadeUp>
          {content.features.slice(0, 2).map((f, i) => (
            <FadeUp key={i} delay={0.1 * (i + 1)}><p><strong className="font-semibold text-white">{f.title}.</strong> {f.description}</p></FadeUp>
          ))}
        </div>
        <FadeUp delay={0.3} className="mt-10"><Pill href="/story">Read more</Pill></FadeUp>
      </PhotoBand>

      {/* 7 · FAQ */}
      {c.home.faq?.length > 0 && (
        <section className="mx-auto max-w-3xl px-6 py-28">
          <h2 className="mb-10 text-center text-[clamp(2rem,5vw,3.5rem)]" style={stencil}>
            <RevealLines lines={["Questions"]} />
          </h2>
          {c.home.faq.slice(0, 6).map((q, i) => (
            <FadeUp key={i} delay={i * 0.04}>
              <details className="group border-b border-black/10 py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-base font-semibold uppercase tracking-[0.08em]" style={jost}>
                  {q.question}
                  <span className="relative size-4 shrink-0">
                    <span className="absolute inset-x-0 top-1/2 h-px bg-current" />
                    <span className="absolute inset-y-0 left-1/2 w-px bg-current transition-transform duration-300 group-open:scale-y-0" />
                  </span>
                </summary>
                <p className="pt-4 leading-relaxed text-[#737373]" style={jost}>{q.answer}</p>
              </details>
            </FadeUp>
          ))}
        </section>
      )}

      {/* 8 · Core pitch, in the elegant voice */}
      <div className="flex justify-center pb-28">
        <CorePitch theme="refined-elegant" />
      </div>
    </div>
  );
}
