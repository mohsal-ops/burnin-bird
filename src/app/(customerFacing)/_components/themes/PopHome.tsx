"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useAnimate, useInView, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowRight, ArrowUpRight, Clock, MapPin, Star } from "lucide-react";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { cfg } from "@/lib/configOpt";
import type { ThemeHomeContent } from "@/lib/themes/homeContent";
import { PopGallery } from "./PopGallery";

// "Pop Bento" — the bright, playful 5th design. Everything sits in rounded
// bento cards; the restaurant's own brand colour (--brand) fills the big ones,
// dishes pop out of their cards, a ticker runs dish names, stickers carry the
// numbers. Distinct from the other themes on purpose: Smash is black/caps,
// Diner retro cream/gold, Refined dark serif.

type P = { id: string; name: string; priceInCents: number; description: string | null; image: string | null };
type Cat = { id: string; name: string; count?: number };
type R = { id: string; name: string; review: string; avatar: string };
type Hours = { dayIndex: number; open: number; close: number };

const BRAND = "var(--brand)";
const ON_BRAND = "var(--brand-foreground)";
// Surfaces come from themes.css (--pop-*) so the page follows light/dark.
const FG = "var(--pop-fg)";
const PAPER = "var(--pop-paper)";
const SOFT = "var(--pop-soft)"; // neutral surface for small tiles
const CARD = "var(--pop-card)";
const INK = "var(--pop-ink)"; // contrast tone - near-black in light, off-white in dark
const ON_INK = "var(--pop-on-ink)";
const RING = "inset 0 0 0 1px var(--pop-ring)"; // hairline, only visible in dark
// Things that sit on the brand colour or a photo keep fixed colours in both modes.
const FIXED_INK = "#15110E";
const usd = (c: number) => `$${(c / 100).toFixed(2).replace(/\.00$/, "")}`;
const SPRING = { type: "spring" as const, stiffness: 220, damping: 22 };

function hourLabel(h: number) {
  const x = Math.floor(h) % 24;
  return `${x % 12 || 12}${x < 12 ? "am" : "pm"}`;
}
function todayHours(hours: Hours[]) {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: SITE_CONFIG.timezone }));
  const t = hours.find((h) => h.dayIndex === d.getDay());
  if (!t || t.open === t.close) return "Closed today";
  return `Today ${hourLabel(t.open)} – ${hourLabel(t.close)}`;
}

// A card that pops in as it scrolls into view.
function Pop({ children, className = "", style, delay = 0 }: { children: React.ReactNode; className?: string; style?: React.CSSProperties; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      style={style}
      initial={reduce ? false : { opacity: 0, y: 40, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-8%" }}
      transition={{ ...SPRING, delay }}
    >
      {children}
    </motion.div>
  );
}

function Sticker({ children, className = "", rotate = -8, bg = "#fff", fg = FIXED_INK }: { children: React.ReactNode; className?: string; rotate?: number; bg?: string; fg?: string }) {
  return (
    <motion.span
      className={`pointer-events-none absolute z-20 grid place-items-center rounded-full text-center font-display font-semibold leading-[1.05] shadow-[0_8px_24px_rgba(0,0,0,0.18)] ${className}`}
      style={{ background: bg, color: fg }}
      initial={{ scale: 0, rotate: rotate - 30 }}
      whileInView={{ scale: 1, rotate }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.35 }}
    >
      {children}
    </motion.span>
  );
}

export function PopHome({
  content,
  heroImage,
  featured,
  menu,
  reviews,
  gallery = [],
  hours = [],
}: {
  content: ThemeHomeContent;
  heroImage: string | null;
  featured: P[];
  menu: Cat[];
  reviews: R[];
  gallery?: { url: string; alt?: string | null }[];
  hours?: Hours[];
}) {
  const c = SITE_CONFIG;
  const reduce = useReducedMotion();
  const withPhoto = featured.filter((p) => p.image);
  // The hero plate rotates through the top 3 dishes (lazy-susan swap).
  const spin = withPhoto.slice(0, 3);
  const [slot, setSlot] = useState(0);
  const [swaps, setSwaps] = useState(0); // 0 = still the first dish (entrance timings)
  const [hold, setHold] = useState(false); // paused while hovered
  const hero = spin[slot] ?? withPhoto[0];
  const heroSrc = hero?.image ?? content.images.pop_hero ?? heroImage;
  const loved = withPhoto.slice(0, 5);
  const dish = cfg("primaryDish") || c.cuisines?.[0] || "Good food";
  const headline = content.words.pop_headline || content.headline || `${dish}, done loud.`;
  const sub = content.subheadline || c.tagline;

  const heroRef = useRef<HTMLDivElement>(null);
  const heroInView = useInView(heroRef, { amount: 0.3 });
  const [discScope, animateDisc] = useAnimate();
  const [plateScope, animatePlate] = useAnimate();
  useEffect(() => {
    if (spin.length < 2 || hold || !heroInView) return;
    const t = setTimeout(() => {
      setSlot((i) => (i + 1) % spin.length);
      setSwaps((n) => n + 1);
    }, swaps === 0 ? 5200 : 4200);
    return () => clearTimeout(t);
  }, [spin.length, hold, heroInView, swaps]);
  // The plate lands with a little squash and the disc answers with a thump.
  useEffect(() => {
    if (!swaps || reduce) return;
    animatePlate(plateScope.current, { scale: [1, 0.95, 1.02, 1] }, { duration: 0.7, delay: 0.3, ease: "easeOut" });
    animateDisc(discScope.current, { scale: [1, 1.06, 1] }, { duration: 0.6, delay: 0.38, ease: "easeOut" });
  }, [swaps, reduce, animatePlate, animateDisc, plateScope, discScope]);
  const pick = (i: number) => {
    if (i === slot) return;
    setSlot(i);
    setSwaps((n) => n + 1);
  };
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  // Depth on scroll (no spinning): each layer drifts at its own speed, so the
  // plate seems to lift off the brand disc towards you. Transforms only = cheap.
  const k = reduce ? 0 : 1;
  const discY = useTransform(scrollYProgress, [0, 1], [0, 60 * k]);
  const discScale = useTransform(scrollYProgress, [0, 1], [1, 1 + 0.15 * k]);
  const plateY = useTransform(scrollYProgress, [0, 1], [0, -40 * k]);
  const plateScale = useTransform(scrollYProgress, [0, 1], [1, 1 + 0.08 * k]);
  const stickerY = useTransform(scrollYProgress, [0, 1], [0, -110 * k]);
  const pillY = useTransform(scrollYProgress, [0, 1], [0, -70 * k]);

  const tickerItems = (featured.length ? featured.map((p) => p.name.trim()) : [dish, "Order online", "Pickup", "Delivery"]).slice(0, 10);

  return (
    <div className="tp-home theme-bespoke w-full overflow-x-clip pb-16 pt-24 md:pt-28" style={{ background: PAPER, color: FG }}>
      {/* 1 · Hero: one focal point - the best seller on a brand-colour disc.
          Entrance runs in order: disc grows, dish drops onto it, headline
          words rise, buttons, then the price sticker pops. */}
      <section ref={heroRef} className="relative mx-auto grid max-w-6xl items-center gap-8 px-5 md:grid-cols-2 md:gap-10">
        <div className="order-2 md:order-1">
          <motion.p
            className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium"
            style={{ background: SOFT, boxShadow: RING }}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: BRAND }} />
            {todayHours(hours)} · Pickup &amp; delivery
          </motion.p>
          <h1 className="mt-5 font-display text-[clamp(2.5rem,6.2vw,4.6rem)] font-semibold leading-[1.02] tracking-[-0.03em]">
            {headline.split(" ").map((w, i, arr) => (
              <span key={i} className="inline-block overflow-hidden pb-1 align-bottom">
                <motion.span
                  className="inline-block"
                  style={i === arr.length - 1 ? { color: BRAND } : undefined}
                  initial={reduce ? false : { y: "105%" }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.35 + i * 0.07, duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
                >
                  {w}
                  {i < arr.length - 1 ? "\u00a0" : ""}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.p
            className="mt-5 max-w-[42ch] text-lg leading-relaxed text-[var(--pop-muted)]"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            {sub}
          </motion.p>
          <motion.div
            className="mt-8 flex flex-wrap items-center gap-3"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.6 }}
          >
            <Link
              href="/Menu"
              className="group inline-flex items-center gap-2.5 rounded-full py-3.5 pl-7 pr-3.5 text-base font-semibold transition-transform active:scale-95"
              style={{ background: BRAND, color: ON_BRAND }}
            >
              {c.menuCtaLabel || "Order now"}
              <span className="grid h-8 w-8 place-items-center rounded-full bg-white/25 transition-transform group-hover:translate-x-0.5">
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
            <Link href="/Menu" className="rounded-full px-6 py-3.5 text-base font-semibold text-[var(--pop-ghost)] ring-1 ring-inset ring-[color:var(--pop-line)] transition-colors hover:bg-[var(--pop-hover)]">
              See the menu
            </Link>
          </motion.div>
        </div>

        <div
          className="relative order-1 mx-auto aspect-square w-full max-w-[300px] md:order-2 md:max-w-[520px]"
          onMouseEnter={() => setHold(true)}
          onMouseLeave={() => setHold(false)}
        >
          <motion.div className="absolute inset-0" style={{ y: discY, scale: discScale }}>
          <div ref={discScope} className="absolute inset-0">
          <motion.div
            className="absolute inset-[6%] rounded-full"
            style={{ background: BRAND }}
            initial={reduce ? false : { scale: 0.55, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 120, damping: 16 }}
          />
          </div>
          </motion.div>
          <motion.div className="absolute inset-0" style={{ y: plateY, scale: plateScale }}>
          <div ref={plateScope} className="absolute inset-0">
          <motion.div
            className="absolute inset-[12%] overflow-hidden rounded-full bg-white shadow-[var(--pop-hero-plate-shadow)]"
            initial={reduce ? false : { y: -60, opacity: 0, rotate: -20 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 140, damping: 15, delay: 0.25 }}
          >
            {heroSrc && (
              <motion.div
                className="absolute inset-[3%] scale-[1.04]"
                animate={reduce ? undefined : { y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.4 }}
              >
                {/* Lazy-susan swap: dishes ride an arc pivoting far below the
                    plate - the old one slides off the right rim as the next
                    swings in from the left and settles with a little overshoot. */}
                <AnimatePresence initial={false}>
                  <motion.div
                    key={hero?.id ?? "hero"}
                    className="absolute inset-0"
                    style={{ originX: 0.5, originY: 1.9 }}
                    initial={reduce ? { opacity: 0 } : { rotate: -50, scale: 0.85, opacity: 0 }}
                    animate={{ rotate: 0, scale: 1, opacity: 1, transition: { type: "spring", stiffness: 85, damping: 13, opacity: { duration: 0.35 } } }}
                    exit={reduce ? { opacity: 0 } : { rotate: 50, scale: 0.85, opacity: 0, transition: { duration: 0.55, ease: [0.55, 0, 0.75, 0.2], opacity: { duration: 0.45, delay: 0.15 } } }}
                  >
                    <Image src={heroSrc} alt={hero?.name ?? c.name} fill priority={slot === 0} sizes="(max-width:768px) 80vw, 460px" className="object-contain mix-blend-multiply" />
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            )}
          </motion.div>
          </div>
          </motion.div>
          {/* warm the other dishes' images so each swap lands instantly */}
          {spin.length > 1 && (
            <div aria-hidden className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0">
              {spin.map((d) => (
                <Image key={d.id} src={d.image!} alt="" width={1} height={1} sizes="(max-width:768px) 80vw, 460px" />
              ))}
            </div>
          )}
          {hero && (
            <motion.div className="pointer-events-none absolute inset-0 z-10" style={{ y: stickerY }}>
            <AnimatePresence mode="popLayout">
            <motion.span
              key={hero.id}
              className="absolute right-[4%] top-[8%] z-10 grid h-20 w-20 place-items-center rounded-full text-lg font-semibold shadow-lg md:h-24 md:w-24 md:text-xl"
              style={{ background: INK, color: ON_INK }}
              initial={reduce ? false : { scale: 0, rotate: -40 }}
              animate={{ scale: 1, rotate: 10 }}
              exit={reduce ? { opacity: 0 } : { scale: 0, rotate: 50, transition: { duration: 0.25, ease: "easeIn" } }}
              transition={{ type: "spring", stiffness: 300, damping: 14, delay: swaps ? 0.45 : 1.05 }}
            >
              {usd(hero.priceInCents)}
            </motion.span>
            </AnimatePresence>
            </motion.div>
          )}
          {hero && (
            <motion.div className="pointer-events-none absolute inset-0 z-10" style={{ y: pillY }}>
            <div className="absolute bottom-[4%] left-1/2 z-10 -translate-x-1/2">
            <AnimatePresence mode="wait">
            <motion.p
              key={hero.id}
              className="whitespace-nowrap rounded-full bg-[var(--pop-card)] px-5 py-2.5 text-sm font-semibold shadow-[var(--pop-pill-shadow)]"
              initial={reduce ? false : { opacity: 0, y: 14, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.92, transition: { duration: 0.2 } }}
              transition={swaps ? { type: "spring", stiffness: 320, damping: 22 } : { delay: 1.15, duration: 0.5 }}
            >
              <span className="mr-1.5" style={{ color: BRAND }}>★</span> {["Best seller", "Fan favourite", "Must try"][slot] ?? "Best seller"} · {hero.name.trim()}
            </motion.p>
            </AnimatePresence>
            </div>
            </motion.div>
          )}
          {spin.length > 1 && (
            <motion.div
              className="absolute -bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center md:-bottom-4"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4, duration: 0.5 }}
            >
              {spin.map((d, i) => (
                <button key={d.id} type="button" onClick={() => pick(i)} aria-label={`Show ${d.name.trim()}`} aria-current={i === slot} className="p-1.5">
                  <motion.span
                    className="block h-1.5 rounded-full"
                    animate={{ width: i === slot ? 22 : 6 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    style={{ background: i === slot ? BRAND : "color-mix(in srgb, var(--pop-fg) 22%, transparent)" }}
                  />
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* 2 · Ticker */}
      <div className="relative my-14 overflow-hidden py-3.5 md:my-20" style={{ background: "var(--pop-band)", color: "var(--pop-on-band)", boxShadow: "inset 0 1px 0 var(--pop-ring), inset 0 -1px 0 var(--pop-ring)" }}>
        <motion.div
          className="flex w-max gap-10 whitespace-nowrap font-display text-xl font-medium uppercase tracking-[0.04em] md:text-2xl"
          animate={reduce ? undefined : { x: ["0%", "-50%"] }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
        >
          {[...tickerItems, ...tickerItems].map((t, i) => (
            <span key={i} className="flex items-center gap-10">
              {t}
              <span style={{ color: BRAND }}>✦</span>
            </span>
          ))}
        </motion.div>
      </div>

      {/* 3 · Most loved bento */}
      {loved.length > 0 && (
        <section className="mx-auto max-w-6xl px-4">
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 className="font-display text-4xl font-semibold tracking-[-0.03em] md:text-6xl">Most loved</h2>
            <Link href="/Menu" className="inline-flex items-center gap-1.5 rounded-full border-2 px-4 py-2 text-sm font-bold" style={{ borderColor: FG }}>
              Full menu <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid auto-rows-[225px] grid-cols-2 gap-3 md:auto-rows-[290px] md:grid-cols-4 md:gap-4">
            {loved.map((p, i) => {
              const big = i === 0;
              // Fill the grid with no holes whatever the count: the big card is
              // 2x2; the rest share the 2x2 block beside it (desktop), and on
              // phones an odd last card goes full width.
              const rest = loved.length - 1;
              const span = big
                ? rest === 0
                  ? "col-span-2 row-span-2 md:col-span-4"
                  : "col-span-2 row-span-2"
                : [
                    rest === 1 ? "md:col-span-2 md:row-span-2" : rest === 2 || (rest === 3 && i === 1) ? "md:col-span-2" : "",
                    rest % 2 === 1 && i === loved.length - 1 ? "col-span-2" : "",
                  ].join(" ");
              const bg = i % 3 === 0 ? BRAND : i % 3 === 1 ? SOFT : INK;
              const fg = i % 3 === 0 ? ON_BRAND : i % 3 === 1 ? FG : ON_INK;
              return (
                <Pop key={p.id} delay={i * 0.06} className={span}>
                  <Link
                    href="/Menu"
                    className={`group relative flex h-full flex-col overflow-hidden rounded-[30px] p-5 transition-transform duration-300 hover:scale-[1.015] ${big ? "md:p-7" : ""}`}
                    style={{ background: bg, color: fg, containerType: "size", boxShadow: i % 3 === 1 ? RING : undefined }}
                  >
                    <div className="relative z-10 flex items-start justify-between gap-2">
                      <p className={`font-display font-semibold leading-[0.95] tracking-tight ${big ? "max-w-[60%] text-3xl md:text-5xl" : "text-[15px] md:text-lg"}`}>{p.name.trim()}</p>
                      <span className="shrink-0 rounded-full px-3 py-1 text-sm font-semibold" style={{ background: fg, color: bg }}>
                        {usd(p.priceInCents)}
                      </span>
                    </div>
                    {/* the dish fills a big round white plate, sized from the card's
                        own width AND height (container units - measured inside the padding) so it's always as big
                        as the card allows; white-background photos melt into it */}
                    <div
                      className={`absolute aspect-square ${
                        big
                          ? "-bottom-[8%] -right-[8%] w-[min(110cqw,96cqh)]"
                          : "bottom-[-24%] left-1/2 w-[min(112cqw,104cqh)] -translate-x-1/2"
                      }`}
                    >
                      <div className="absolute inset-0 overflow-hidden rounded-full bg-white shadow-[var(--pop-plate-shadow)] transition-transform duration-500 group-hover:scale-[1.04]">
                        <div className={`absolute inset-[3%] transition-[scale] duration-700 ${big ? "scale-[1.12] group-hover:scale-[1.2]" : "-translate-y-[6%] scale-[1.25] group-hover:scale-[1.35]"}`}>
                          <Image src={p.image!} alt={p.name} fill sizes={big ? "(max-width:768px) 80vw, 480px" : "(max-width:768px) 50vw, 300px"} className="object-contain mix-blend-multiply" />
                        </div>
                      </div>
                    </div>
                    {big && p.description && <p className="relative z-10 mt-3 line-clamp-4 max-w-[46%] text-sm font-medium opacity-85 md:text-base">{p.description}</p>}
                  </Link>
                </Pop>
              );
            })}
          </div>
        </section>
      )}

      {/* 4 · Category tiles */}
      {menu.length > 0 && (
        <section className="mx-auto mt-14 max-w-6xl px-4">
          <h2 className="mb-5 font-display text-3xl font-semibold tracking-[-0.03em] md:text-5xl">What are you craving?</h2>
          <div className="flex flex-wrap gap-2.5">
            {menu.map((m, i) => (
              <Pop key={m.id} delay={i * 0.04}>
                <Link
                  href="/Menu"
                  className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-base font-bold transition-transform hover:-translate-y-0.5 active:scale-95"
                  style={i % 2 ? { background: CARD, color: FG, boxShadow: "inset 0 0 0 1px var(--pop-line)" } : { background: SOFT, color: FG, boxShadow: RING }}
                >
                  {m.name}
                  {typeof m.count === "number" && <span className="rounded-full px-2 text-xs" style={{ background: INK, color: ON_INK }}>{m.count}</span>}
                </Link>
              </Pop>
            ))}
          </div>
        </section>
      )}

      {/* 5 · Story */}
      <section className="mx-auto mt-14 grid max-w-6xl gap-3 px-4 md:grid-cols-2 md:gap-4">
        <Pop className="relative min-h-[320px] overflow-hidden rounded-[36px]" style={{ background: SOFT, boxShadow: RING }}>
          {(content.images.home_feature_1 || gallery[0]?.url) && (
            <Image src={(content.images.home_feature_1 || gallery[0]?.url)!} alt={c.name} fill sizes="(max-width:768px) 92vw, 560px" className="object-cover" />
          )}
          <Sticker className="bottom-5 left-5 h-24 w-24 px-2 text-sm" rotate={-12}>
            Made
            <br />
            fresh
            <br />
            daily
          </Sticker>
        </Pop>
        <Pop delay={0.08} className="flex flex-col justify-center rounded-[36px] p-8 md:p-10" style={{ background: "var(--pop-band)", color: "var(--pop-on-band)", boxShadow: RING }}>
          <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: BRAND }}>
            Our story
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold leading-[0.95] tracking-[-0.03em] md:text-5xl">
            {content.features[0]?.title || `Hello from ${c.name}`}
          </h2>
          <p className="mt-4 max-w-[46ch] text-base opacity-80">{content.features[0]?.description || c.tagline}</p>
          <Link href="/story" className="mt-6 inline-flex w-fit items-center gap-2 rounded-full px-5 py-3 font-bold" style={{ background: BRAND, color: ON_BRAND }}>
            Read our story <ArrowRight className="h-4 w-4" />
          </Link>
        </Pop>
      </section>

      {/* 6 · Reviews */}
      {reviews.length > 0 && (
        <section className="mt-14">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="mb-5 font-display text-3xl font-semibold tracking-[-0.03em] md:text-5xl">People are talking</h2>
          </div>
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:px-[max(1rem,calc((100vw-72rem)/2+1rem))]">
            {reviews.slice(0, 8).map((r, i) => (
              <Pop key={r.id} delay={i * 0.05} className="w-[82vw] max-w-[360px] shrink-0 snap-start">
                <figure
                  className="flex h-full flex-col justify-between rounded-[30px] p-6"
                  style={i % 2 ? { background: CARD, color: FG, boxShadow: RING } : { background: BRAND, color: ON_BRAND }}
                >
                  <div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, k) => (
                        <Star key={k} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <blockquote className="mt-3 line-clamp-6 text-lg font-semibold leading-snug">“{r.review}”</blockquote>
                  </div>
                  <figcaption className="mt-5 text-sm font-bold opacity-80">— {r.name}</figcaption>
                </figure>
              </Pop>
            ))}
          </div>
        </section>
      )}

      {/* 7 · Gallery: bento mosaic + full gallery sheet / lightbox */}
      {gallery.length >= 5 && <PopGallery images={gallery} name={c.name} />}

      {/* 8 · Order CTA */}
      <section className="mx-auto mt-14 max-w-6xl px-4">
        <Pop className="relative overflow-hidden rounded-[40px] p-8 text-center md:p-14" style={{ background: BRAND, color: ON_BRAND }}>
          <div aria-hidden className="absolute -left-16 -top-16 h-64 w-64 rounded-full opacity-20" style={{ background: FIXED_INK }} />
          <div aria-hidden className="absolute -bottom-20 -right-10 h-72 w-72 rounded-full opacity-15" style={{ background: "#fff" }} />
          <h2 className="relative font-display text-5xl font-semibold leading-[0.9] tracking-[-0.03em] md:text-8xl">Hungry?</h2>
          <p className="relative mx-auto mt-4 max-w-[36ch] text-lg font-medium opacity-90">
            Order on our own site. Pickup or delivery, ready when you are. {todayHours(hours)}.
          </p>
          <div className="relative mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/Menu" className="inline-flex items-center gap-2 rounded-full px-7 py-4 text-lg font-bold" style={{ background: FIXED_INK, color: "#fff" }}>
              {c.menuCtaLabel || "Order now"} <ArrowRight className="h-5 w-5" />
            </Link>
            {c.googleMapsUrl && (
              <a href={c.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border-2 px-7 py-4 text-lg font-bold" style={{ borderColor: ON_BRAND }}>
                <MapPin className="h-5 w-5" /> Directions
              </a>
            )}
          </div>
        </Pop>
      </section>
    </div>
  );
}
