"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { CorePitch } from "../CorePitch";
import { DINER, DinerButton, tint } from "./DinerNav";
import { DinerGallery } from "./DinerGallery";
import { SmartDishImage } from "./SmartDishImage";
import type { ThemeHomeContent } from "@/lib/themes/homeContent";
import { stretchWord } from "@/lib/themes/mediaSlots";

// ── diner-classic homepage — modeled closely on Fame Grilled Cheese ──────────
// Menu-first and warm: a golden hero with a HUGE cream sign-painter script word
// ("Cheeeese!" → the client's dish, vowel-stretched) popping in letter by letter
// over steaming food, a dripping-cheese edge melting into cream, then the menu
// itself — script category titles between dotted rules, each dish on a
// chocolate circle, heavy uppercase names, typewriter descriptions — with
// chocolate "receipt" banners, halftone dots, fan-mail reviews, a visit block
// and the in-voice core pitch. Content/photos are the client's own.

type P = { id: string; name: string; priceInCents: number; description: string | null; image: string | null };
type Cat = { id: string; name: string; count?: number; items: P[] };
type R = { id: string; name: string; review: string; avatar: string };

const { brown: BROWN, cream: CREAM, gold: GOLD, onGold: ON_GOLD, onBrown: ON_BROWN, text: TEXT, heroText: HERO_TEXT } = DINER;
const usd = (c: number) => `$${(c / 100).toFixed(2)}`;
const EASE = [0.22, 1, 0.36, 1] as const;


const Script = ({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) => (
  <span className={className} style={{ fontFamily: "var(--font-script), cursive", ...style }}>
    {children}
  </span>
);

// ── hero pieces ──────────────────────────────────────────────────────────────
function PopWord({ text }: { text: string }) {
  const reduce = useReducedMotion();
  return (
    <h1 aria-label={text} className="relative z-10 select-none text-center leading-[0.8]" style={{ color: HERO_TEXT, fontSize: "clamp(4.5rem, 15vw, 13.5rem)", transform: "rotate(-7deg)" }}>
      {Array.from(text).map((ch, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="inline-block"
          style={{ fontFamily: "var(--font-script), cursive", textShadow: `0 6px 0 ${tint(BROWN, 14)}` }}
          initial={reduce ? false : { y: 80, opacity: 0, rotate: -12, scale: 0.6 }}
          animate={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 16, delay: 0.25 + i * 0.055 }}
        >
          {ch === " " ? " " : ch}
        </motion.span>
      ))}
    </h1>
  );
}

function Steam() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[18%] z-0 flex justify-center gap-[12vw]">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block h-56 w-24 rounded-full bg-white/35 blur-2xl"
          style={{ animation: `dinerSteam 5.5s ease-in-out ${i * 1.4}s infinite` }}
        />
      ))}
    </div>
  );
}

// Fame's melted-cheese edge: golden drips (with glossy highlight streaks)
// hanging into the cream page, each one slowly stretching.
function Drips() {
  const drips = [
    { x: 4, w: 5, h: 70 }, { x: 11, w: 3.5, h: 38 }, { x: 27, w: 4, h: 30 }, { x: 34, w: 6, h: 92 },
    { x: 52, w: 3.5, h: 44 }, { x: 64, w: 5.5, h: 110 }, { x: 71, w: 4, h: 58 }, { x: 88, w: 5, h: 34 }, { x: 96, w: 4.5, h: 80 },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-0">
      <div className="absolute inset-x-0 -top-1 h-7 rounded-b-[2rem]" style={{ background: GOLD }} />
      {drips.map((d, i) => (
        <span
          key={i}
          className="absolute top-0 origin-top rounded-b-full"
          style={{
            left: `${d.x}%`,
            width: `${d.w}%`,
            height: d.h,
            background: GOLD,
            animation: `dinerDrip ${5 + (i % 3)}s ease-in-out ${i * 0.35}s infinite`,
          }}
        >
          <span className="absolute bottom-[18%] right-[22%] h-[30%] w-[18%] rounded-full bg-white/45" />
        </span>
      ))}
    </div>
  );
}

// A hero dish, BIG and true-colour (no multiply blend — that's what tinted the
// food yellow). Cut-out photos (transparent PNG/WebP) float free with a soft
// contact shadow; ordinary rectangular photos are detected on load (corner
// alpha) and served as a round plate with a cream rim instead of showing a
// white box. Hover lifts it and pops a chocolate price tag.
function HeroDish({ p, i, count }: { p: P; i: number; count: number }) {
  const reduce = useReducedMotion();
  const center = count === 3 ? i === 1 : count === 1;
  const side = count === 3 ? i - 1 : count === 2 ? (i === 0 ? -1 : 1) : 0;

  return (
    <motion.div
      className={`group relative aspect-square ${center ? "z-[3] w-[46%] max-w-[440px] md:w-[38%]" : "z-[2] w-[40%] max-w-[380px] md:w-[32%]"} ${count > 1 ? "-mx-[3%] md:-mx-[2.5%]" : ""}`}
      initial={reduce ? false : { y: 160, opacity: 0, rotate: side * 18 }}
      animate={{ y: center ? -6 : 10, opacity: 1, rotate: side * 6 }}
      transition={{ type: "spring", stiffness: 110, damping: 14, delay: 0.9 + i * 0.12 }}
    >
      <Link href="/Menu" aria-label={p.name} className="absolute inset-0 block">
        <motion.span
          className="absolute inset-0 block"
          animate={reduce ? undefined : { y: [0, -10, 0] }}
          transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
        >
          {/* contact shadow */}
          <span aria-hidden className="absolute inset-x-[14%] bottom-[2%] h-[9%] rounded-[50%] blur-md transition-transform duration-500 group-hover:scale-x-90" style={{ background: tint(BROWN, 35) }} />
          <SmartDishImage
            src={p.image!}
            alt={p.name}
            priority
            sizes="(max-width: 768px) 46vw, 480px"
            className="transition-transform duration-500 ease-out group-hover:-translate-y-3 group-hover:scale-[1.06]"
            photoClassName="inset-[5%] overflow-hidden rounded-full"
            cutoutClassName="inset-0"
            photoStyle={{ boxShadow: `0 0 0 clamp(5px,0.9vw,10px) ${CREAM}, 0 24px 40px -18px ${tint(BROWN, 70)}` }}
            cutoutStyle={{ filter: `drop-shadow(0 22px 26px ${tint(BROWN, 40)})` }}
          />
        </motion.span>
        {/* price tag */}
        <span
          className="absolute bottom-[8%] left-1/2 z-10 -translate-x-1/2 translate-y-3 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 md:text-sm"
          style={{ background: BROWN, color: ON_BROWN, boxShadow: `3px 3px 0 ${GOLD}`, fontFamily: "var(--font-courier-prime), monospace" }}
        >
          {p.name} · {usd(p.priceInCents)}
        </span>
      </Link>
    </motion.div>
  );
}

// ── menu pieces ──────────────────────────────────────────────────────────────
function DottedRule({ flip = false }: { flip?: boolean }) {
  return (
    <motion.span
      aria-hidden
      className={`hidden h-2 flex-1 sm:block ${flip ? "origin-left" : "origin-right"}`}
      style={{ backgroundImage: `radial-gradient(circle, ${BROWN} 1.6px, transparent 2px)`, backgroundSize: "20px 8px", backgroundRepeat: "repeat-x", backgroundPosition: "center" }}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.9, ease: EASE }}
    />
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-5xl items-center justify-center gap-6 px-5 md:gap-10">
      <DottedRule />
      <motion.h2
        className="shrink-0 text-center text-[clamp(3rem,7vw,5rem)] leading-none"
        style={{ color: TEXT, fontFamily: "var(--font-script), cursive" }}
        initial={{ y: 24, opacity: 0, rotate: -4 }}
        whileInView={{ y: 0, opacity: 1, rotate: -2 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ type: "spring", stiffness: 180, damping: 14 }}
      >
        {children}
      </motion.h2>
      <DottedRule flip />
    </div>
  );
}

function Banner({ children }: { children: React.ReactNode }) {
  return (
    <motion.p
      className="mx-auto mt-8 max-w-5xl px-6 py-5 text-center text-base font-bold uppercase leading-relaxed tracking-wide md:px-10 md:text-xl"
      style={{ background: BROWN, color: ON_BROWN, fontFamily: "var(--font-courier-prime), monospace" }}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      {children}
    </motion.p>
  );
}

// "Diner window" frame — ONE clean arched photo (no stacked discs), framed in
// white with the theme's signature hard golden offset shadow (same language as
// the buttons). It wipes up into view; on hover it lifts and the shadow tucks in.
// Arch radius: half-width round top (40% of a 4:5 frame's height = 50% of its
// width) + soft bottom corners. "rounded-t-full" made browsers scale ALL radii
// down, flattening the bottom.
const ARCH = (px: number) => `50% 50% ${px}px ${px}px / 40% 40% ${px}px ${px}px`;

function Plate({ src, alt, size = "md", priority }: { src: string | null; alt: string; size?: "md" | "lg"; priority?: boolean }) {
  const reduce = useReducedMotion();
  const dim = size === "lg" ? "w-64 md:w-80" : "w-52 md:w-60";
  return (
    <motion.div
      className={`relative aspect-[4/5] ${dim}`}
      initial={reduce ? false : { y: 36, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ type: "spring", stiffness: 130, damping: 18 }}
    >
      <div
        className="absolute inset-0 overflow-hidden border-[5px] border-white bg-white transition-all duration-300 ease-out group-hover:-translate-x-1 group-hover:-translate-y-1.5"
        style={{ boxShadow: `10px 10px 0 ${GOLD}`, borderRadius: ARCH(26) }}
      >
        <motion.div
          className="absolute inset-0 overflow-hidden"
          style={{ borderRadius: ARCH(20) }}
          initial={reduce ? false : { clipPath: "inset(100% 0% 0% 0%)" }}
          whileInView={{ clipPath: "inset(0% 0% 0% 0%)" }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}
        >
          {src ? (
            <Image src={src} alt={alt} fill priority={priority} sizes="(max-width: 768px) 60vw, 320px" className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.07]" />
          ) : (
            <span className="grid size-full place-items-center text-6xl" style={{ fontFamily: "var(--font-script), cursive", color: BROWN, background: GOLD }}>{alt.charAt(0)}</span>
          )}
          {/* soft top sheen, like light on a window */}
          <span aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),transparent_38%)]" />
        </motion.div>
      </div>
    </motion.div>
  );
}

function Dish({ p }: { p: P }) {
  return (
    <Link href="/Menu" className="group flex flex-col items-center px-4 text-center">
      <Plate src={p.image} alt={p.name} />
      <h3 className="mt-6 text-2xl font-black uppercase tracking-tight md:text-[1.7rem]" style={{ color: TEXT }}>{p.name}</h3>
      {p.description && (
        <p className="mt-4 line-clamp-3 max-w-md text-sm leading-7" style={{ color: TEXT, fontFamily: "var(--font-courier-prime), monospace" }}>{p.description}</p>
      )}
      <p className="mt-4 text-lg font-extrabold" style={{ color: TEXT }}>{usd(p.priceInCents)}</p>
    </Link>
  );
}

function Halftone({ side }: { side: "left" | "right" }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute top-10 hidden size-[30rem] md:block ${side === "left" ? "-left-64" : "-right-64"}`}
      style={{
        backgroundImage: `radial-gradient(circle, ${tint(BROWN, 13)} 2.2px, transparent 2.6px)`,
        backgroundSize: "14px 14px",
        WebkitMaskImage: "radial-gradient(circle, transparent 28%, #000 30%, #000 48%, transparent 70%)",
        maskImage: "radial-gradient(circle, transparent 28%, #000 30%, #000 48%, transparent 70%)",
      }}
    />
  );
}

export function DinerHome({ content, menu, featured, reviews, heroImage, gallery = [] }: { content: ThemeHomeContent; menu: Cat[]; featured: P[]; reviews: R[]; heroImage: string | null; gallery?: { url: string; alt?: string | null }[] }) {
  const c = SITE_CONFIG;
  const heroWord = content.words.theme_heroword || stretchWord(c.primaryDish || c.cuisines?.[0] || "Delicious");
  const heroFood = featured.filter((p) => p.image).slice(0, 3);
  const cats = menu.filter((m) => m.items.length > 0).map((m) => ({ id: m.id, name: m.name, count: m.count ?? m.items.length }));
  const favPool = featured.length > 0 ? featured : (menu.find((m) => m.items.length > 0)?.items ?? []);
  const favorites = favPool.slice(0, 5);
  const [lead, ...more] = favorites;
  const banner = content.subheadline || c.tagline;

  return (
    <div className="theme-bespoke w-full overflow-x-clip pt-20" style={{ background: CREAM, color: TEXT }}>
      {/* 1 · Golden hero */}
      <section className="relative overflow-visible" style={{ background: GOLD }}>
        <div className="relative mx-auto flex max-w-7xl flex-col items-center justify-center overflow-hidden px-4 pb-28 pt-16 md:min-h-[78svh] md:pb-24 md:pt-14">
          <Steam />
          <PopWord text={heroWord} />
          <div className="relative z-10 -mt-[1vw] flex w-full max-w-6xl items-end justify-center">
            {heroFood.length > 0 ? (
              heroFood.map((p, i) => <HeroDish key={p.id} p={p} i={i} count={heroFood.length} />)
            ) : heroImage ? (
              <motion.div className="relative aspect-[16/9] w-full max-w-3xl overflow-hidden rounded-3xl" initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.8 }}>
                <Image src={heroImage} alt={c.name} fill priority sizes="80vw" className="object-cover" />
              </motion.div>
            ) : null}
          </div>
          <motion.div className="relative z-20 mt-8" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4 }}>
            <DinerButton href="/Menu" tone="brown" shadow={CREAM}>{c.menuCtaLabel}</DinerButton>
          </motion.div>
        </div>
        <Drips />
      </section>

      {/* 2 · Favorites, not the whole menu — a long menu used to scroll forever
          here. The owner's featured dishes (else the first category) as one
          big lead + up to 4, then every category as a tag that jumps straight
          to it on the menu page. */}
      <div className="relative overflow-hidden pb-10 pt-40">
        <Halftone side="left" />
        <Halftone side="right" />
        {favorites.length > 0 && (
          <section>
            <SectionTitle>Our Favorites</SectionTitle>
            {banner && <Banner>{banner}</Banner>}
            <Link href="/Menu" className="group mx-auto mt-14 grid max-w-5xl items-center gap-10 px-6 md:grid-cols-2">
              <div className="flex justify-center"><Plate src={lead.image} alt={lead.name} size="lg" /></div>
              <div className="text-center">
                <p className="text-xs font-extrabold uppercase tracking-[0.3em]" style={{ color: tint(BROWN, 60) }}>the one everyone orders</p>
                <h3 className="mt-3 text-3xl font-black uppercase tracking-tight">{lead.name}</h3>
                {lead.description && <p className="mx-auto mt-5 max-w-sm text-sm leading-7" style={{ fontFamily: "var(--font-courier-prime), monospace" }}>{lead.description}</p>}
                <p className="mt-5 text-xl font-extrabold">{usd(lead.priceInCents)}</p>
                <span className="mt-7 inline-block"><span className="inline-flex rounded-md px-7 py-3 text-base font-extrabold lowercase shadow-[5px_5px_0_var(--tp-ink)] transition-all duration-200 group-hover:translate-x-[2px] group-hover:translate-y-[2px] group-hover:shadow-[2px_2px_0_var(--tp-ink)]" style={{ background: GOLD, color: ON_GOLD }}>{c.menuCtaLabel}</span></span>
              </div>
            </Link>
            {more.length > 0 && (
              <div className={`mx-auto mt-20 grid max-w-5xl gap-x-8 gap-y-16 sm:grid-cols-2 ${more.length > 2 ? "lg:max-w-6xl lg:grid-cols-4" : ""}`}>
                {more.map((p) => <Dish key={p.id} p={p} />)}
              </div>
            )}
          </section>
        )}

        {cats.length > 0 && (
          <section className="pt-24">
            <SectionTitle>On the Menu</SectionTitle>
            <div className="mx-auto mt-12 flex max-w-4xl flex-wrap justify-center gap-x-4 gap-y-5 px-6">
              {cats.map((cat, i) => (
                <motion.div
                  key={cat.id}
                  initial={{ y: 24, opacity: 0, rotate: i % 2 ? 3 : -3 }}
                  whileInView={{ y: 0, opacity: 1, rotate: i % 2 ? 1.5 : -1.5 }}
                  viewport={{ once: true, margin: "-10%" }}
                  transition={{ type: "spring", stiffness: 200, damping: 16, delay: (i % 6) * 0.05 }}
                >
                  <Link
                    href={`/Menu#cat-${cat.id}`}
                    className="group relative flex items-center gap-3 rounded-md border-[3px] py-2.5 pl-4 pr-3 transition-all duration-200 hover:-translate-y-1 hover:rotate-0"
                    style={{ background: CREAM, borderColor: BROWN, boxShadow: `4px 4px 0 ${BROWN}` }}
                  >
                    {/* receipt-tag punch hole */}
                    <span aria-hidden className="size-2.5 rounded-full border-2" style={{ borderColor: BROWN }} />
                    <span className="text-2xl leading-none" style={{ fontFamily: "var(--font-script), cursive" }}>{cat.name}</span>
                    <span className="rounded px-1.5 py-0.5 text-[0.65rem] font-extrabold" style={{ background: GOLD, color: ON_GOLD, fontFamily: "var(--font-courier-prime), monospace" }}>
                      {cat.count}
                    </span>
                    <span aria-hidden className="text-lg font-black transition-transform duration-200 group-hover:translate-x-1">→</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}
        <div className="mt-16 flex justify-center">
          <DinerButton href="/Menu">see the whole menu</DinerButton>
        </div>
      </div>

      {/* 3 · Fan mail (reviews) */}
      {reviews.length > 0 && (
        <section className="relative overflow-hidden py-20" style={{ background: GOLD }}>
          <SectionTitle>Fan Mail</SectionTitle>
          <div className="mx-auto mt-14 grid max-w-6xl gap-8 px-6 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.slice(0, 6).map((r, i) => (
              <motion.figure
                key={r.id}
                className="rounded-md border-[3px] p-6 transition-transform duration-300 hover:rotate-0 hover:-translate-y-1"
                style={{ background: CREAM, borderColor: BROWN, boxShadow: `7px 7px 0 ${BROWN}`, rotate: `${i % 2 ? 1.5 : -1.5}deg` }}
                initial={{ y: 40, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ type: "spring", stiffness: 160, damping: 16, delay: (i % 3) * 0.08 }}
              >
                <p className="text-lg tracking-widest">★★★★★</p>
                <blockquote className="mt-3 line-clamp-6 text-sm leading-7" style={{ fontFamily: "var(--font-courier-prime), monospace" }}>“{r.review}”</blockquote>
                <figcaption className="mt-4 text-sm font-extrabold uppercase">— {r.name}</figcaption>
              </motion.figure>
            ))}
          </div>
        </section>
      )}

      {/* 3b · Snapshots (the dashboard gallery as a polaroid pinboard) */}
      {gallery.length > 0 && (
        <section className="relative overflow-hidden pb-6 pt-24">
          <Halftone side="right" />
          <SectionTitle>Snapshots</SectionTitle>
          <DinerGallery images={gallery} instagramUrl={c.instagramUrl} />
        </section>
      )}

      {/* 4 · Good questions (Our Story lives on its own page now) */}
      {c.home.faq?.length > 0 && (
        <section className="relative overflow-hidden py-24">
          <SectionTitle>Good Questions</SectionTitle>
          <div className="mx-auto mt-12 max-w-3xl px-6">
            {c.home.faq.slice(0, 6).map((q, i) => (
              <details key={i} className="group border-b-2 border-dashed py-4" style={{ borderColor: tint(BROWN, 25) }}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-extrabold uppercase">
                  {q.question}
                  <span className="grid size-8 shrink-0 place-items-center rounded-md text-xl transition-transform duration-300 group-open:rotate-45" style={{ background: GOLD, color: ON_GOLD }}>+</span>
                </summary>
                <p className="pt-3 text-sm leading-7" style={{ fontFamily: "var(--font-courier-prime), monospace" }}>{q.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* 5 · Come say hi */}
      <section className="px-5 pb-20">
        <motion.div
          className="relative mx-auto flex max-w-5xl flex-col items-center overflow-hidden rounded-2xl px-6 py-14 text-center"
          style={{ background: BROWN, color: ON_BROWN }}
          initial={{ y: 40, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <Script className="text-5xl md:text-6xl" style={{ color: GOLD }}>Come say hi!</Script>
          <p className="mt-5 text-lg font-bold uppercase tracking-wide" style={{ fontFamily: "var(--font-courier-prime), monospace" }}>{c.address}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-5">
            <DinerButton href="/Menu" shadow={CREAM}>{c.menuCtaLabel}</DinerButton>
            {c.googleMapsUrl && (
              <a href={c.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-md border-2 border-current px-7 py-3 font-extrabold lowercase transition-colors hover:bg-[var(--tp-on-ink)] hover:text-[var(--tp-ink)]">
                get directions
              </a>
            )}
          </div>
        </motion.div>
      </section>

      {/* 6 · Core pitch, in the diner voice */}
      <div className="flex justify-center pb-10">
        <CorePitch theme="diner-classic" />
      </div>
    </div>
  );
}
