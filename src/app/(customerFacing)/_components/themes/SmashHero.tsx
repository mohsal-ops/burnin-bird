"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

// ── smash-bold hero — Ender's rounded "launch" panel ─────────────────────────
// One rounded light panel that auto-rotates through three slides, exactly like
// enderhamburgueseria.com's top block:
//   1 · LAUNCH   walking-mascot icon · "NAME | SUB" wordmark · spinning badge,
//                big balloon sub-brand word (left) + the 3D mascot & branded
//                packaging photo (right), with the brand stamped on the box face
//                and a brand-colour card leaning in front.
//   2 · LINEUP   three isolated products, each headed by the balloon sub-brand
//                + a small suffix, with a "LIMITED EDITION" pill under the dots.
//   3 · LOCATION darkened store photo · #001 · big city · CTA.
// The panel keeps Ender's light studio grey in both colour modes because the
// mascot renders are shot on that grey.

import { mascotFor, type MascotVariant } from "@/lib/themes/mediaSlots";
export type { MascotVariant };

// Where the blank box face sits in each render (percent of the image), so the
// client's brand word can be stamped onto the packaging.
export const MASCOTS: Record<MascotVariant, { src: string; face: { left: string; top: string; width: string } | null }> = {
  box: { src: "/mascots/box.webp", face: { left: "61.5%", top: "60%", width: "27%" } },
  cup: { src: "/mascots/cup.webp", face: { left: "63.5%", top: "60%", width: "20%" } },
  bowl: { src: "/mascots/bowl.webp", face: { left: "65%", top: "63%", width: "24%" } },
  pizza: { src: "/mascots/pizza.webp", face: null },
};

export { mascotFor };

const INK = "#111315";
const PANEL = "radial-gradient(ellipse at 60% 45%, #EEF1F0 0%, #E3E6E5 70%, #D6DAD8 100%)";

export function Balloon({ text, size, className = "" }: { text: string; size: string; className?: string }) {
  return (
    <span
      className={`relative inline-block whitespace-nowrap ${className}`}
      style={{ fontFamily: "var(--font-balloon), system-ui", lineHeight: 0.85, fontSize: size, transform: "rotate(-4deg)" }}
    >
      {text}
    </span>
  );
}

// Ender's little hand-drawn marks around the lettering.
function Scribbles({ className = "" }: { className?: string }) {
  return (
    <>
      <svg className={`pointer-events-none absolute -left-10 bottom-2 h-20 w-16 ${className}`} viewBox="0 0 64 80" fill="none" aria-hidden>
        <path d="M6 18 q10 -3 18 2 M4 40 l18 -8 M22 70 l10 -20" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      </svg>
      <svg className={`pointer-events-none absolute -right-8 -top-6 h-16 w-14 ${className}`} viewBox="0 0 56 64" fill="none" aria-hidden>
        <path d="M6 8 q30 6 40 40" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      </svg>
    </>
  );
}

function SpinBadge({ text }: { text: string }) {
  const label = ` ${text} • ${text} • ${text} • `;
  return (
    <div className="relative grid size-16 place-items-center rounded-full md:size-20" style={{ background: INK }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full animate-[spin_12s_linear_infinite]" aria-hidden>
        <defs><path id="smash-badge-path" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" /></defs>
        <text fill="#fff" style={{ fontSize: 9.5, letterSpacing: 1.5, fontWeight: 800, textTransform: "uppercase" }}>
          <textPath href="#smash-badge-path">{label}</textPath>
        </text>
      </svg>
      <span className="size-7 rounded-full border-[5px] border-white md:size-9" />
    </div>
  );
}

function Walker() {
  return (
    <motion.span
      aria-hidden
      className="block h-16 w-16 md:h-20 md:w-20"
      style={{
        background: INK,
        WebkitMaskImage: "url(/mascots/walker.png)",
        maskImage: "url(/mascots/walker.png)",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
      }}
      animate={{ rotate: [-6, 6, -6], y: [0, -3, 0] }}
      transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

type Item = { id: string; name: string; description: string | null; image: string | null };

export function SmashHero({
  name,
  sub,
  mascot,
  customMascot,
  items,
  city,
  address,
  locationImg,
  ctaLabel,
  limitedLabel = "Limited edition",
  newLabel = "New limited drop",
}: {
  name: string;
  sub: string;
  mascot: MascotVariant;
  customMascot?: string;
  items: Item[];
  city: string;
  address: string;
  locationImg: string | null;
  ctaLabel: string;
  limitedLabel?: string;
  newLabel?: string;
}) {
  const reduce = useReducedMotion();
  const slides = ["launch", ...(items.length ? ["lineup"] : []), "location"] as const;
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const go = useCallback((i: number) => setIdx((i + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (paused || reduce) return;
    const t = setTimeout(() => go(idx + 1), 6500);
    return () => clearTimeout(t);
  }, [idx, paused, reduce, go]);

  // an uploaded render has no known box face, so skip the printed brand word
  const m = customMascot ? { src: customMascot, face: null } : MASCOTS[mascot];
  const current = slides[idx];
  const lineup = items.slice(0, 3);
  const heroWord = sub.length <= 6 ? "clamp(4.5rem, 15vw, 11rem)" : sub.length <= 10 ? "clamp(3.5rem, 10vw, 7.5rem)" : "clamp(2.6rem, 7vw, 5rem)";

  return (
    <section className="px-3 pb-6 pt-3 md:px-5" aria-roledescription="carousel" aria-label={`${name} highlights`}>
      <div
        className="relative overflow-hidden rounded-[1.75rem] md:rounded-[2.25rem]"
        style={{ background: current === "location" ? INK : PANEL, color: INK, transition: "background 500ms" }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <div className="relative min-h-[620px] md:min-h-[640px] lg:h-[calc(100svh-9.5rem)] lg:max-h-[760px] lg:min-h-[600px]">
          <AnimatePresence mode="wait" initial={false}>
            {current === "launch" && (
              <motion.div
                key="launch"
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45 }}
              >
                {/* top row: walker · wordmark · badge */}
                <div className="relative z-10 grid grid-cols-[auto_1fr_auto] items-start px-5 pt-5 md:px-12 md:pt-7">
                  <Walker />
                  <div className="flex flex-col items-center">
                    <p className="whitespace-nowrap text-base font-semibold uppercase tracking-[0.14em] md:text-3xl md:tracking-[0.18em]" style={{ fontFamily: "var(--ff-display)" }}>
                      {name}
                      {sub.toUpperCase() !== name.toUpperCase() && <span className="mx-3 hidden font-light md:inline">|</span>}
                      {sub.toUpperCase() !== name.toUpperCase() && <span className="hidden md:inline">{sub}</span>}
                    </p>
                    <svg className="mt-1 h-3 w-28 md:w-40" viewBox="0 0 160 12" fill="none" aria-hidden>
                      <path d="M4 9 q60 -8 152 -5" stroke="#E0301E" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  </div>
                  <SpinBadge text={limitedLabel} />
                </div>

                <div className="absolute inset-0 flex flex-col justify-center gap-2 pb-10 pt-20 md:grid md:grid-cols-[1fr_1.15fr] md:items-center md:gap-0 md:pb-0 md:pt-0">
                  {/* left: balloon word */}
                  <motion.div
                    className="relative z-10 flex flex-col items-center justify-center px-6 text-center md:pt-10"
                    initial={reduce ? false : { x: -40, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                  >
                    <h1 className="relative" style={{ color: INK }}>
                      <Scribbles />
                      <Balloon text={sub} size={heroWord} />
                    </h1>
                    <p className="mt-4 text-sm font-black uppercase tracking-wide md:mt-6 md:text-2xl" style={{ fontFamily: "var(--font-balloon), system-ui" }}>
                      {newLabel}
                    </p>
                  </motion.div>

                  {/* right: 3D mascot + branded packaging */}
                  <motion.div
                    className="relative mx-auto w-full max-w-[760px]"
                    initial={reduce ? false : { x: 60, opacity: 0, scale: 0.97 }}
                    animate={{ x: 0, opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                  >
                    <div
                      className="relative aspect-[1200/896] w-full"
                      style={{
                        WebkitMaskImage: "radial-gradient(ellipse 50% 52% at 52% 50%, #000 72%, transparent 100%)",
                        maskImage: "radial-gradient(ellipse 50% 52% at 52% 50%, #000 72%, transparent 100%)",
                      }}
                    >
                      <Image src={m.src} alt={`${sub} mascot`} fill priority sizes="(max-width: 768px) 100vw, 55vw" className="object-contain" />
                      {m.face && (
                        <span
                          className="absolute -translate-x-1/2 -translate-y-1/2 text-center"
                          style={{ left: m.face.left, top: m.face.top, width: m.face.width, color: INK }}
                        >
                          <Balloon text={sub} size="clamp(1rem, 3.4vw, 2.6rem)" />
                          <span className="mt-1 block text-right text-[clamp(0.45rem,0.9vw,0.75rem)] font-bold lowercase">{limitedLabel}</span>
                        </span>
                      )}
                    </div>
                    {/* brand card leaning in front of the packaging */}
                    <motion.div
                      className="absolute bottom-[8%] left-[38%] grid aspect-[1.6] w-[26%] place-items-center rounded-md bg-brand text-white shadow-[0_18px_30px_-12px_rgba(0,0,0,0.45)]"
                      initial={reduce ? false : { y: 30, rotate: 0, opacity: 0 }}
                      animate={{ y: 0, rotate: -5, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 160, damping: 14, delay: 0.55 }}
                    >
                      <Balloon text={sub} size="clamp(0.9rem, 2.6vw, 2.1rem)" />
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {current === "lineup" && (
              <motion.div
                key="lineup"
                className="absolute inset-0 flex flex-col"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45 }}
              >
                <div className="grid grid-cols-[auto_1fr_auto] items-start px-5 pt-5 md:px-12 md:pt-7">
                  <Walker />
                  <p className="text-center text-lg font-semibold uppercase tracking-[0.18em] md:text-3xl">{name}</p>
                  <SpinBadge text={limitedLabel} />
                </div>
                <div className="no-scrollbar flex flex-1 snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-20 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-12 md:pb-24">
                  {lineup.map((p, i) => (
                    <motion.div
                      key={p.id}
                      className="flex w-[78vw] shrink-0 snap-center flex-col items-center text-center md:w-auto"
                      initial={reduce ? false : { y: 40, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.08 * i }}
                    >
                      <div className="relative mt-2">
                        <Balloon text={sub} size="clamp(2.4rem, 5vw, 4.2rem)" />
                        <span className="absolute -bottom-5 right-1 text-xs font-black uppercase md:-bottom-6 md:text-lg" style={{ fontFamily: "var(--font-balloon), system-ui" }}>
                          {suffix(p.name, sub)}
                        </span>
                      </div>
                      <Link href="/Menu" className="group relative mt-4 aspect-square w-full max-w-[340px] flex-1">
                        {p.image && (
                          <Image
                            src={p.image}
                            alt={p.name}
                            fill
                            sizes="(max-width: 768px) 78vw, 30vw"
                            className="object-contain mix-blend-multiply transition-transform duration-500 ease-out group-hover:-translate-y-2 group-hover:scale-[1.04]"
                          />
                        )}
                      </Link>
                      {p.description && <p className="mt-4 line-clamp-2 max-w-xs text-sm font-bold md:text-base">{p.description}</p>}
                    </motion.div>
                  ))}
                </div>
                <p className="pointer-events-none absolute bottom-14 left-1/2 -translate-x-1/2 text-sm font-black md:text-base uppercase tracking-wide" style={{ fontFamily: "var(--font-balloon), system-ui" }}>
                  ⟋ {limitedLabel} ⟍
                </p>
              </motion.div>
            )}

            {current === "location" && (
              <motion.div
                key="location"
                className="absolute inset-0 text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                {locationImg && (
                  <motion.div className="absolute inset-0" initial={reduce ? false : { scale: 1.08 }} animate={{ scale: 1 }} transition={{ duration: 6, ease: "linear" }}>
                    <Image src={locationImg} alt={city} fill sizes="100vw" className="object-cover grayscale-[35%]" />
                  </motion.div>
                )}
                <div className="absolute inset-0 bg-black/55" />
                <div className="relative flex h-full flex-col items-center justify-between px-5 py-6 text-center">
                  <p className="text-5xl font-extrabold tracking-tight md:text-7xl">#001</p>
                  <div>
                    <p className="text-xl font-medium md:text-4xl">{address}</p>
                    <motion.h2
                      className="text-[clamp(3rem,11vw,9rem)] font-extrabold uppercase leading-[0.9] tracking-tight"
                      initial={reduce ? false : { y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                    >
                      {city}
                    </motion.h2>
                    <p className="mt-2 text-base font-medium uppercase md:text-3xl">Come see us</p>
                  </div>
                  <Link
                    href="/story"
                    className="mb-10 rounded-full bg-white px-10 py-4 text-base font-semibold uppercase text-black transition-transform duration-300 hover:-translate-y-0.5 hover:scale-105"
                  >
                    {ctaLabel}
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* dots (Ender's grey pill) */}
          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2 rounded-full bg-black/10 px-3 py-2 backdrop-blur" role="tablist">
            {slides.map((s, i) => (
              <button
                key={s}
                role="tab"
                aria-selected={i === idx}
                aria-label={`Slide ${i + 1}`}
                onClick={() => go(i)}
                className={`size-2.5 rounded-full transition-all duration-300 ${i === idx ? "scale-110 bg-white" : "bg-white/55 hover:bg-white/80"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// "Classic Nashville" → "NASHVILLE"; drops the sub-brand word if the item repeats it.
function suffix(item: string, sub: string) {
  const words = item.split(/\s+/).filter((w) => w.toUpperCase() !== sub.toUpperCase());
  return (words[words.length - 1] || item).toUpperCase();
}
