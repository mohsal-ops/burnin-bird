"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, ChevronLeft, ChevronRight, X } from "lucide-react";

// Pop Bento gallery: the home mosaic (first 5 photos) + "See all" opens a
// full-screen sheet that springs up from the bottom with every photo popping
// into a bento masonry; tap one for a swipeable lightbox with a filmstrip.
// Phone back button closes the sheet instead of leaving the page.

type G = { url: string; alt?: string | null };

const BRAND = "var(--brand)";
const ON_BRAND = "var(--brand-foreground)";
// Masonry rhythm - varied tile shapes so the wall reads like a bento, not a grid.
const SHAPES = ["aspect-[4/5]", "aspect-square", "aspect-[3/4]", "aspect-[4/3]", "aspect-square", "aspect-[4/5]", "aspect-[5/4]"];
const SPRING = { type: "spring" as const, stiffness: 220, damping: 22 };

export function PopGallery({ images, name }: { images: G[]; name: string }) {
  const reduce = useReducedMotion();
  const [sheet, setSheet] = useState(false);
  const [open, setOpen] = useState<number | null>(null); // lightbox index
  const [dir, setDir] = useState(1);
  const [mounted, setMounted] = useState(false);
  const n = images.length;
  useEffect(() => setMounted(true), []);

  const openSheet = useCallback((at: number | null = null) => {
    setSheet(true);
    setOpen(at);
    if (!history.state?.popGallery) history.pushState({ ...history.state, popGallery: true }, "");
  }, []);
  const closeSheet = useCallback(() => {
    if (history.state?.popGallery) history.back(); // popstate below does the closing
    else {
      setSheet(false);
      setOpen(null);
    }
  }, []);
  const go = useCallback(
    (d: number) => {
      setDir(d);
      setOpen((o) => (o === null ? o : (o + d + n) % n));
    },
    [n],
  );

  useEffect(() => {
    if (!sheet) return;
    const onPop = () => {
      setSheet(false);
      setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") open !== null ? setOpen(null) : closeSheet();
      if (open !== null && e.key === "ArrowRight") go(1);
      if (open !== null && e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [sheet, open, go, closeSheet]);

  if (n === 0) return null;
  const more = n - 5;

  return (
    <section className="mx-auto mt-14 max-w-6xl px-4">
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 className="font-display text-3xl font-semibold tracking-[-0.03em] md:text-5xl">Fresh from the kitchen</h2>
        <button
          type="button"
          onClick={() => openSheet()}
          className="group inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 px-4 py-2 text-sm font-bold transition-transform active:scale-95"
          style={{ borderColor: "var(--pop-fg)" }}
        >
          See all {n} <span className="hidden sm:inline">photos</span>
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* home mosaic */}
      <div className="grid auto-rows-[150px] grid-cols-2 gap-3 md:auto-rows-[200px] md:grid-cols-4 md:gap-4">
        {images.slice(0, 5).map((g, i) => {
          const last = i === Math.min(n, 5) - 1;
          return (
            <motion.button
              key={g.url}
              type="button"
              onClick={() => (last && more > 0 ? openSheet() : openSheet(i))}
              aria-label={last && more > 0 ? `See all ${n} photos` : "Open photo"}
              className={`group relative overflow-hidden rounded-[26px] text-left ${i === 0 ? "col-span-2 row-span-2" : ""} ${n === 4 && i === 3 ? "col-span-2" : ""}`}
              initial={reduce ? false : { opacity: 0, y: 40, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-8%" }}
              transition={{ ...SPRING, delay: i * 0.05 }}
            >
              <Image src={g.url} alt={g.alt || name} fill sizes={i === 0 ? "(max-width:768px) 92vw, 560px" : "(max-width:768px) 50vw, 300px"} className="object-cover transition-transform duration-700 group-hover:scale-110" />
              {last && more > 0 ? (
                <>
                  <span className="absolute inset-0 bg-black/35 transition-colors duration-300 group-hover:bg-black/45" />
                  <motion.span
                    className="absolute left-1/2 top-1/2 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-center font-display text-lg font-semibold leading-none shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition-transform duration-300 group-hover:scale-110 md:h-24 md:w-24 md:text-xl"
                    style={{ background: BRAND, color: ON_BRAND }}
                    initial={reduce ? false : { scale: 0, rotate: -40 }}
                    whileInView={{ scale: 1, rotate: -8 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.45 }}
                  >
                    <span>
                      +{more}
                      <span className="block text-xs font-medium opacity-90">photos</span>
                    </span>
                  </motion.span>
                </>
              ) : (
                <span className="absolute bottom-3 right-3 grid h-9 w-9 translate-y-2 place-items-center rounded-full opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100" style={{ background: BRAND, color: ON_BRAND }}>
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {sheet && (
              <motion.div key="pop-gallery" className="fixed inset-0 z-[90]" initial={{ opacity: 1 }} exit={{ opacity: 1 }}>
                <motion.div
                  className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={closeSheet}
                />
                <Sheet images={images} name={name} reduce={!!reduce} onClose={closeSheet} onPick={(i) => { setDir(1); setOpen(i); }} />
                <AnimatePresence>
                  {open !== null && <Lightbox key="lb" images={images} index={open} dir={dir} reduce={!!reduce} go={go} setIndex={(i) => { setDir(i > open ? 1 : -1); setOpen(i); }} onClose={() => setOpen(null)} />}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </section>
  );
}

function Sheet({ images, name, reduce, onClose, onPick }: { images: G[]; name: string; reduce: boolean; onClose: () => void; onPick: (i: number) => void }) {
  const scroller = useRef<HTMLDivElement>(null);
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Photo gallery"
      className="absolute inset-x-0 bottom-0 top-3 flex flex-col overflow-hidden rounded-t-[36px] shadow-[0_-20px_60px_rgba(0,0,0,0.25)] md:inset-x-4 md:top-6"
      style={{ background: "var(--pop-paper)", color: "var(--pop-fg)", boxShadow: "inset 0 1px 0 var(--pop-ring), 0 -20px 60px rgba(0,0,0,0.25)" }}
      initial={reduce ? { opacity: 0 } : { y: "100%" }}
      animate={reduce ? { opacity: 1 } : { y: 0 }}
      exit={reduce ? { opacity: 0 } : { y: "100%", transition: { duration: 0.35, ease: [0.4, 0, 1, 1] } }}
      transition={{ type: "spring", stiffness: 260, damping: 32 }}
    >
      {/* grab handle + header */}
      <div className="relative z-10 shrink-0 px-5 pb-4 pt-3 md:px-10 md:pb-6">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full" style={{ background: "color-mix(in srgb, var(--pop-fg) 15%, transparent)" }} />
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <motion.h2
              className="truncate font-display text-3xl font-semibold tracking-[-0.03em] md:text-5xl"
              initial={reduce ? false : { y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
            >
              Gallery
            </motion.h2>
            <motion.span
              className="shrink-0 rounded-full px-3 py-1 text-sm font-bold"
              style={{ background: BRAND, color: ON_BRAND }}
              initial={reduce ? false : { scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: -6 }}
              transition={{ type: "spring", stiffness: 320, damping: 14, delay: 0.3 }}
            >
              {images.length}
            </motion.span>
          </div>
          <motion.button
            type="button"
            onClick={onClose}
            aria-label="Close gallery"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full transition-transform hover:rotate-90 active:scale-90"
            style={{ background: "var(--pop-ink)", color: "var(--pop-on-ink)" }}
            initial={reduce ? false : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 18, delay: 0.2 }}
          >
            <X className="h-5 w-5" />
          </motion.button>
        </div>
      </div>

      <div ref={scroller} className="flex-1 overflow-y-auto overscroll-contain px-3 pb-[calc(24px+env(safe-area-inset-bottom))] md:px-10">
        <div className="columns-2 gap-3 md:columns-3 md:gap-4 lg:columns-4">
          {images.map((g, i) => (
            <motion.button
              key={g.url + i}
              type="button"
              onClick={() => onPick(i)}
              aria-label={`Open photo ${i + 1}`}
              className={`group relative mb-3 block w-full break-inside-avoid overflow-hidden rounded-[26px] md:mb-4 ${SHAPES[i % SHAPES.length]}`}
              style={{ background: "var(--pop-soft)" }}
              initial={reduce ? false : { opacity: 0, y: 50, scale: 0.9, rotate: i % 2 ? 2.5 : -2.5 }}
              whileInView={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
              viewport={{ once: true, root: scroller, margin: "0px 0px -6% 0px" }}
              transition={{ ...SPRING, delay: i < 8 ? 0.25 + i * 0.05 : (i % 4) * 0.05 }}
            >
              <Image src={g.url} alt={g.alt || name} fill sizes="(max-width:768px) 48vw, (max-width:1024px) 32vw, 300px" className="object-cover transition-transform duration-700 group-hover:scale-110" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="absolute bottom-3 right-3 grid h-9 w-9 translate-y-2 place-items-center rounded-full opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100" style={{ background: BRAND, color: ON_BRAND }}>
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function Lightbox({
  images,
  index,
  dir,
  reduce,
  go,
  setIndex,
  onClose,
}: {
  images: G[];
  index: number;
  dir: number;
  reduce: boolean;
  go: (d: number) => void;
  setIndex: (i: number) => void;
  onClose: () => void;
}) {
  const strip = useRef<HTMLDivElement>(null);
  useEffect(() => {
    strip.current?.querySelector<HTMLElement>(`[data-i="${index}"]`)?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [index]);
  const g = images[index];
  const many = images.length > 1;
  return (
    <motion.div
      className="absolute inset-0 z-20 flex flex-col"
      style={{ background: "rgba(12,10,9,0.94)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.25 } }}
      onClick={onClose}
    >
      <div className="flex shrink-0 items-center justify-between px-4 pt-4 md:px-8 md:pt-6">
        <span className="rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-semibold tabular-nums text-white/90">
          {index + 1} <span className="text-white/45">/ {images.length}</span>
        </span>
        <button type="button" aria-label="Close photo" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition hover:rotate-90 hover:bg-white/20">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.div
            key={index}
            custom={dir}
            className="absolute inset-4 md:inset-x-24 md:inset-y-6"
            variants={{
              enter: (d: number) => (reduce ? { opacity: 0 } : { x: d * 120, rotate: d * 4, scale: 0.88, opacity: 0 }),
              center: { x: 0, rotate: 0, scale: 1, opacity: 1 },
              exit: (d: number) => (reduce ? { opacity: 0 } : { x: d * -120, rotate: d * -4, scale: 0.88, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 260, damping: 28, opacity: { duration: 0.2 } }}
            drag={many ? "x" : false}
            dragElastic={0.25}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60 || info.velocity.x < -400) go(1);
              else if (info.offset.x > 60 || info.velocity.x > 400) go(-1);
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Image src={g.url} alt={g.alt || ""} fill sizes="100vw" className="pointer-events-none select-none rounded-[22px] object-contain" priority />
          </motion.div>
        </AnimatePresence>
        {many && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
              className="absolute left-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:scale-110 hover:bg-[var(--brand)] hover:text-[var(--brand-foreground)] md:left-8 md:grid"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
              className="absolute right-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:scale-110 hover:bg-[var(--brand)] hover:text-[var(--brand-foreground)] md:right-8 md:grid"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      {many && (
        <div
          ref={strip}
          className="flex shrink-0 gap-2 overflow-x-auto px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3 [scrollbar-width:none] md:justify-center-safe md:px-8 md:pb-6"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((t, i) => (
            <button
              key={t.url + i}
              data-i={i}
              type="button"
              aria-label={`Photo ${i + 1}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl transition-all duration-300 md:h-16 md:w-16"
              style={{
                opacity: i === index ? 1 : 0.45,
                transform: i === index ? "scale(1.06)" : "scale(1)",
                boxShadow: i === index ? "0 0 0 2px rgba(12,10,9,1), 0 0 0 4px var(--brand)" : "none",
              }}
            >
              <Image src={t.url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
