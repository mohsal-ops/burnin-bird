"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { DINER, tint } from "./DinerNav";
import { niceCaption } from "./galleryCaption";

// ── diner-classic gallery — the photo-booth pinboard ────────────────────────
// The owner's dashboard gallery as a scatter of polaroids taped to the wall:
// each one drops in on a spring at its own tilt, straightens + lifts on hover,
// can be picked up and tossed around (it springs back home), and opens into a
// chocolate lightbox (arrows, keys, swipe). Tape strips take the palette's
// golden colour, captions are hand-written in the diner script.

type G = { url: string; alt?: string | null };

const TILT = [-5, 3.5, -2, 4.5, -3.5, 2.5, -4, 3];
const LIFT = ["md:translate-y-6", "", "md:-translate-y-4", "md:translate-y-3", "", "md:translate-y-8", "md:-translate-y-2", ""];
const TAPE = [-8, 6, -3, 10, -6, 4, 8, -10];

function Polaroid({ g, i, onOpen, dragArea }: { g: G; i: number; onOpen: () => void; dragArea: React.RefObject<HTMLDivElement | null> }) {
  const reduce = useReducedMotion();
  const dragged = useRef(false);
  const tilt = TILT[i % TILT.length];
  return (
    <motion.div
      className={`relative ${LIFT[i % LIFT.length]}`}
      initial={reduce ? false : { y: -140, opacity: 0, rotate: tilt * 3 }}
      whileInView={{ y: 0, opacity: 1, rotate: tilt }}
      viewport={{ once: true, margin: "-8%" }}
      transition={{ type: "spring", stiffness: 150, damping: 13, delay: (i % 4) * 0.09 }}
    >
      <motion.button
        type="button"
        aria-label={`Open photo ${i + 1}`}
        className="group relative block w-full cursor-grab touch-pan-y bg-white p-2.5 pb-12 text-left shadow-[0_18px_30px_-18px_rgba(0,0,0,0.55)] active:cursor-grabbing sm:p-3 sm:pb-14"
        drag={!reduce}
        dragConstraints={dragArea}
        dragSnapToOrigin
        dragElastic={0.35}
        whileHover={{ rotate: -tilt, y: -10, scale: 1.04, zIndex: 20 }}
        whileDrag={{ scale: 1.1, rotate: 0, zIndex: 30, boxShadow: "0 40px 60px -24px rgba(0,0,0,0.5)" }}
        onDragStart={() => (dragged.current = true)}
        onClick={() => {
          if (dragged.current) {
            dragged.current = false;
            return;
          }
          onOpen();
        }}
      >
        {/* tape */}
        <span
          aria-hidden
          className="absolute -top-3 left-1/2 z-10 h-6 w-20 -translate-x-1/2 opacity-80 mix-blend-multiply"
          style={{ background: tint(DINER.gold, 80), rotate: `${TAPE[i % TAPE.length]}deg`, clipPath: "polygon(3% 0,97% 4%,100% 50%,96% 100%,2% 96%,0 50%)" }}
        />
        <span className="relative block aspect-square overflow-hidden bg-stone-100">
          <Image src={g.url} alt={g.alt || ""} fill draggable={false} sizes="(max-width: 640px) 45vw, 22vw" className="pointer-events-none object-cover transition-transform duration-700 group-hover:scale-110" />
          <span className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.25),transparent_60%)]" />
        </span>
        <span className="absolute inset-x-3 bottom-3 truncate text-center text-2xl leading-none sm:bottom-4" style={{ fontFamily: "var(--font-script), cursive", color: DINER.brown }}>
          {niceCaption(g.alt) || ["yum!", "so good", "fresh!", "our fave", "hi there", "mmm…", "come by!", "cheers"][i % 8]}
        </span>
      </motion.button>
    </motion.div>
  );
}

export function DinerGallery({ images, instagramUrl }: { images: G[]; instagramUrl?: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const area = useRef<HTMLDivElement>(null);
  const shown = images.slice(0, 8);
  const n = shown.length;
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
      <div ref={area} className="relative mx-auto mt-16 grid max-w-6xl grid-cols-2 gap-x-5 gap-y-10 px-5 sm:gap-x-8 md:grid-cols-4 md:gap-y-14 md:px-8">
        {shown.map((g, i) => (
          <Polaroid key={g.url + i} g={g} i={i} onOpen={() => setOpen(i)} dragArea={area} />
        ))}
      </div>
      <p className="mt-10 text-center text-sm" style={{ fontFamily: "var(--font-courier-prime), monospace", color: tint(DINER.brown, 70) }}>
        psst — you can pick them up.
        {instagramUrl && (
          <>
            {" "}more on{" "}
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="font-bold underline decoration-2 underline-offset-4" style={{ textDecorationColor: DINER.gold }}>
              instagram
            </a>
          </>
        )}
      </p>

      <AnimatePresence>
        {open !== null && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center p-5"
            style={{ background: tint(DINER.brown, 94) }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.figure
                key={open}
                className="relative w-full max-w-[min(88vw,70svh)] bg-white p-3 pb-16 shadow-2xl sm:p-4 sm:pb-20"
                initial={{ opacity: 0, rotate: -8, scale: 0.85, y: 30 }}
                animate={{ opacity: 1, rotate: TILT[open % TILT.length] / 2, scale: 1, y: 0 }}
                exit={{ opacity: 0, rotate: 8, scale: 0.9, y: -20 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -60) go(1);
                  else if (info.offset.x > 60) go(-1);
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <span className="relative block aspect-square overflow-hidden">
                  <Image src={shown[open].url} alt={shown[open].alt || ""} fill sizes="90vw" className="pointer-events-none object-cover" />
                </span>
                <figcaption className="absolute inset-x-4 bottom-4 flex items-end justify-between sm:bottom-6">
                  <span className="truncate text-3xl leading-none" style={{ fontFamily: "var(--font-script), cursive", color: DINER.brown }}>{niceCaption(shown[open].alt) || "snapshot"}</span>
                  <span className="shrink-0 text-xs font-bold" style={{ fontFamily: "var(--font-courier-prime), monospace", color: DINER.brown }}>
                    {String(open + 1).padStart(2, "0")}/{String(n).padStart(2, "0")}
                  </span>
                </figcaption>
              </motion.figure>
            </AnimatePresence>
            {n > 1 &&
              ([-1, 1] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-label={d < 0 ? "Previous photo" : "Next photo"}
                  onClick={(e) => {
                    e.stopPropagation();
                    go(d);
                  }}
                  className={`absolute top-1/2 hidden size-12 -translate-y-1/2 place-items-center rounded-md text-2xl font-black transition-transform hover:scale-110 sm:grid ${d < 0 ? "left-5" : "right-5"}`}
                  style={{ background: DINER.gold, color: DINER.onGold, boxShadow: `4px 4px 0 ${DINER.cream}` }}
                >
                  {d < 0 ? "←" : "→"}
                </button>
              ))}
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(null)}
              className="absolute right-5 top-5 grid size-11 place-items-center rounded-md text-xl font-black"
              style={{ background: DINER.cream, color: DINER.brown }}
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
