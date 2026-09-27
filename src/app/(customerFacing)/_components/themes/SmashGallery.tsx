"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

// ── smash-bold gallery — the photo wall ─────────────────────────────────────
// The owner's dashboard gallery as two endless rows of rounded, slightly
// tilted tiles drifting in opposite directions (varied widths so it reads like
// a pinned-up wall, not a grid). Hover pauses the row and straightens + lifts
// the tile; click opens a full-screen lightbox (arrows, keys, swipe, counter).

type G = { url: string; alt?: string };

const WIDTHS = ["w-[58vw] sm:w-[34vw] lg:w-[22vw]", "w-[44vw] sm:w-[26vw] lg:w-[16vw]", "w-[66vw] sm:w-[40vw] lg:w-[26vw]"];
const TILT = [-2.5, 1.8, -1.2, 2.6, -1.8, 1.2];

function Row({ items, offset, reverse, onOpen }: { items: G[]; offset: number; reverse?: boolean; onOpen: (i: number) => void }) {
  const base = items.length < 5 ? [...items, ...items, ...items] : items;
  const loop = [...base, ...base];
  return (
    <div className="overflow-hidden py-4">
      <div
        className="flex w-max hover:[animation-play-state:paused]"
        style={{ animation: `marquee ${Math.max(30, base.length * 6)}s linear infinite${reverse ? " reverse" : ""}` }}
      >
        {loop.map((g, k) => {
          const i = (k % base.length) % items.length;
          const t = TILT[(k + offset) % TILT.length];
          return (
            <div key={k} className="pr-4 md:pr-6">
              <button
                type="button"
                onClick={() => onOpen(i)}
                className={`group relative block aspect-[4/5] overflow-hidden rounded-[1.4rem] bg-foreground/5 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.5)] transition-all duration-500 ease-out hover:z-10 hover:!rotate-0 hover:-translate-y-2 hover:scale-[1.04] hover:shadow-[0_30px_60px_-24px_rgba(0,0,0,0.55)] ${WIDTHS[(k + offset) % WIDTHS.length]}`}
                style={{ rotate: `${t}deg` }}
                aria-label="Open photo"
              >
                <Image src={g.url} alt={g.alt || ""} fill sizes="(max-width: 640px) 60vw, 26vw" className="object-cover transition-transform duration-700 group-hover:scale-110" />
                <span className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="absolute bottom-3 right-3 grid size-9 translate-y-2 place-items-center rounded-full bg-white text-lg text-black opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">↗</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SmashGallery({ images, title, handle, handleUrl }: { images: G[]; title: string; handle?: string; handleUrl?: string }) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState<number | null>(null);
  const n = images.length;
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

  if (n === 0) return null;
  const half = Math.ceil(n / 2);
  const rowA = images.slice(0, Math.max(half, Math.min(n, 3)));
  const rowB = n > 3 ? images.slice(half) : images;

  return (
    <section className="overflow-hidden py-16 md:py-24">
      <div className="mb-8 flex flex-col items-center gap-3 px-5 text-center md:mb-12">
        <motion.h2
          className="text-[clamp(2.4rem,7vw,6rem)] font-extrabold uppercase leading-[0.9] tracking-[-0.04em] text-foreground"
          initial={reduce ? false : { y: 40, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {title}
          <span className="text-brand">.</span>
        </motion.h2>
        {handle && handleUrl && (
          <a href={handleUrl} target="_blank" rel="noopener noreferrer" className="rounded-full border-2 border-foreground px-5 py-2 text-sm font-bold uppercase tracking-tight text-foreground transition-colors hover:bg-foreground hover:text-background">
            @{handle}
          </a>
        )}
      </div>

      {reduce ? (
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-5 md:grid-cols-4">
          {images.map((g, i) => (
            <button key={i} onClick={() => setOpen(i)} className="relative aspect-[4/5] overflow-hidden rounded-2xl">
              <Image src={g.url} alt={g.alt || ""} fill sizes="25vw" className="object-cover" />
            </button>
          ))}
        </div>
      ) : (
        <div className="-mx-4">
          <Row items={rowA} offset={0} onOpen={(i) => setOpen(i)} />
          <Row items={rowB} offset={2} reverse onOpen={(i) => setOpen(n > 3 ? i + half : i)} />
        </div>
      )}

      <AnimatePresence>
        {open !== null && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
          >
            <motion.div
              key={open}
              className="relative h-[82svh] w-[min(92vw,1100px)]"
              initial={{ scale: 0.92, opacity: 0, rotate: -1.5 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 24 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.x < -60) go(1);
                else if (info.offset.x > 60) go(-1);
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Image src={images[open].url} alt={images[open].alt || ""} fill sizes="92vw" className="rounded-2xl object-contain" />
            </motion.div>
            <button aria-label="Previous" onClick={(e) => { e.stopPropagation(); go(-1); }} className="absolute left-3 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-2xl text-white transition hover:bg-white/30 md:left-8">←</button>
            <button aria-label="Next" onClick={(e) => { e.stopPropagation(); go(1); }} className="absolute right-3 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-2xl text-white transition hover:bg-white/30 md:right-8">→</button>
            <button aria-label="Close" onClick={() => setOpen(null)} className="absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-white/15 text-xl text-white transition hover:bg-white/30">✕</button>
            <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/15 px-3 py-1 font-mono text-xs text-white">{open + 1} / {n}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
