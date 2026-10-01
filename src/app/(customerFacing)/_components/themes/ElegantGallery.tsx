"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { niceCaption } from "./galleryCaption";

// ── refined-elegant gallery — the exhibition walk ───────────────────────────
// Desktop: the section pins and scrolling walks you sideways past the owner's
// dashboard photos like prints hung in a gallery — tall frames at staggered
// heights, each with its catalogue number, a giant outlined "GALLERY" drifting
// behind at half speed, a thin gold progress rule. Frames start slightly
// desaturated and bloom to full colour as you pass/hover. Mobile: a native
// snap-scroll row. Click any print → a quiet full-screen viewer.

type G = { url: string; alt?: string | null };

const stencil: React.CSSProperties = { fontFamily: "var(--font-stencil), sans-serif", letterSpacing: "0.02em", textTransform: "uppercase" };
const jost: React.CSSProperties = { fontFamily: "var(--font-jost), sans-serif" };
const SHAPE = ["h-[62vh] aspect-[3/4]", "h-[48vh] aspect-[4/5] self-end", "h-[56vh] aspect-[1/1]", "h-[66vh] aspect-[2/3] self-start", "h-[50vh] aspect-[5/4] self-center"];

function Print({ g, i, onOpen, className = "" }: { g: G; i: number; onOpen: () => void; className?: string }) {
  return (
    <button type="button" onClick={onOpen} aria-label={`Open photo ${i + 1}`} className={`group relative shrink-0 text-left ${className}`}>
      <span className="relative block size-full overflow-hidden">
        <Image
          src={g.url}
          alt={g.alt || ""}
          fill
          sizes="(max-width: 768px) 80vw, 40vw"
          className="object-cover grayscale-[35%] transition-[transform,filter] duration-[1.4s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06] group-hover:grayscale-0"
        />
        <span className="absolute inset-0 ring-1 ring-inset ring-white/10" />
      </span>
      <span className="mt-4 flex items-baseline justify-between gap-4 text-xs font-semibold uppercase tracking-[0.25em] text-white/60" style={jost}>
        <span className="text-white/90">{String(i + 1).padStart(2, "0")}</span>
        <span className="truncate">{niceCaption(g.alt) || " "}</span>
        <span className="h-px w-8 bg-white/30 transition-all duration-500 group-hover:w-16 group-hover:bg-[var(--tp-accent)]" />
      </span>
    </button>
  );
}

export function ElegantGallery({ images }: { images: G[] }) {
  const reduce = useReducedMotion();
  const shown = images; // every dashboard photo — the walk simply gets longer
  const n = shown.length;
  const wrap = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [dist, setDist] = useState(0);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    const measure = () => {
      if (!track.current) return;
      setDist(Math.max(0, track.current.scrollWidth - window.innerWidth));
    };
    measure();
    window.addEventListener("resize", measure);
    const t = setTimeout(measure, 600);
    return () => {
      window.removeEventListener("resize", measure);
      clearTimeout(t);
    };
  }, [n]);

  const { scrollYProgress } = useScroll({ target: wrap, offset: ["start start", "end end"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.4 });
  const x = useTransform(smooth, [0, 1], [0, -dist]);
  const bgX = useTransform(smooth, [0, 1], ["4%", "-30%"]);
  const bar = useTransform(smooth, [0, 1], ["0%", "100%"]);

  const go = useCallback((d: number) => setOpen((o) => (o === null ? o : (o + d + n) % n)), [n]);
  useEffect(() => {
    if (open === null) return;
    const on = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", on);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", on);
      document.body.style.overflow = prev;
    };
  }, [open, go]);

  if (!n) return null;

  return (
    <>
      {/* Desktop: pinned horizontal walk (height = the sideways distance) */}
      <section
        ref={wrap}
        className="relative hidden md:block"
        style={{ height: reduce ? "auto" : `calc(100svh + ${dist}px)`, background: "var(--tp-ink)" }}
      >
        <div className={`${reduce ? "" : "sticky top-0 h-svh"} flex flex-col justify-center overflow-hidden`}>
          <motion.span
            aria-hidden
            className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 whitespace-nowrap text-[26vw] leading-none text-transparent"
            style={{ ...stencil, x: reduce ? 0 : bgX, WebkitTextStroke: "1px rgba(255,255,255,0.09)" }}
          >
            Gallery · Gallery
          </motion.span>
          <motion.div ref={track} className="relative flex h-[74vh] w-max items-center gap-[6vw] pl-[8vw] pr-[12vw]" style={{ x: reduce ? 0 : x }}>
            <div className="w-[26vw] shrink-0 self-center text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--tp-accent)]" style={jost}>The room · the plates</p>
              <h2 className="mt-5 text-[clamp(3rem,6vw,5.5rem)] leading-[0.9]" style={stencil}>Gallery</h2>
              <p className="mt-6 max-w-xs text-base font-light leading-relaxed text-white/70" style={jost}>A few moments from our kitchen and our tables. Keep scrolling.</p>
              <span className="mt-8 inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-white/60" style={jost}>
                Scroll <span className="h-px w-14 bg-white/40" /> →
              </span>
            </div>
            {shown.map((g, i) => (
              <Print key={g.url + i} g={g} i={i} onOpen={() => setOpen(i)} className={SHAPE[i % SHAPE.length]} />
            ))}
          </motion.div>
          <div className="absolute inset-x-[8vw] bottom-10 h-px bg-white/10">
            <motion.span className="absolute inset-y-0 left-0 bg-[var(--tp-accent)]" style={{ width: reduce ? "100%" : bar }} />
          </div>
        </div>
      </section>

      {/* Mobile: native snap row */}
      <section className="py-20 text-white md:hidden" style={{ background: "var(--tp-ink)" }}>
        <div className="px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--tp-accent)]" style={jost}>The room · the plates</p>
          <h2 className="mt-4 text-5xl leading-none" style={stencil}>Gallery</h2>
        </div>
        <div className="mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-4 [scrollbar-width:none]">
          {shown.map((g, i) => (
            <Print key={g.url + i} g={g} i={i} onOpen={() => setOpen(i)} className="aspect-[3/4] w-[78vw] snap-center" />
          ))}
        </div>
      </section>

      <AnimatePresence>
        {open !== null && (
          <motion.div
            className="fixed inset-0 z-[80] flex flex-col items-center justify-center px-5"
            style={{ background: "color-mix(in srgb, var(--tp-ink) 96%, transparent)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            onClick={() => setOpen(null)}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={open}
                className="relative h-[72svh] w-full max-w-5xl"
                initial={{ opacity: 0, scale: 1.03 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -60) go(1);
                  else if (info.offset.x > 60) go(-1);
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <Image src={shown[open].url} alt={shown[open].alt || ""} fill sizes="90vw" className="pointer-events-none object-contain" />
              </motion.div>
            </AnimatePresence>
            <div className="mt-8 flex items-center gap-8 text-xs font-semibold uppercase tracking-[0.3em] text-white/70" style={jost} onClick={(e) => e.stopPropagation()}>
              <button type="button" onClick={() => go(-1)} className="transition-colors hover:text-[var(--tp-accent)]">Prev</button>
              <span className="text-white">{String(open + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}</span>
              <button type="button" onClick={() => go(1)} className="transition-colors hover:text-[var(--tp-accent)]">Next</button>
            </div>
            <button type="button" aria-label="Close" onClick={() => setOpen(null)} className="absolute right-6 top-6 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition-colors hover:text-white" style={jost}>
              Close ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
