"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

// ── smash-bold story blocks — Ender's "ENDER CAFÉ" section ──────────────────
// A big rounded photo carousel (slow crossfade + Ken Burns, Ender's grey dot
// pill) beside a huge hand-lettered title, typewriter body copy and two dark
// pill buttons. One block per homepage feature, alternating sides. Replaces
// the old bordered feature cards.

type Feature = { title: string; description: string; image: string | null };

function PhotoCarousel({ pics, alt }: { pics: string[]; alt: string }) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (pics.length < 2 || reduce) return;
    const t = setInterval(() => setI((v) => (v + 1) % pics.length), 4500);
    return () => clearInterval(t);
  }, [pics.length, reduce]);
  return (
    <motion.div
      className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.75rem] bg-foreground/5 md:aspect-[16/10]"
      initial={reduce ? false : { clipPath: "inset(12% 12% 12% 12% round 1.75rem)", opacity: 0.4 }}
      whileInView={{ clipPath: "inset(0% 0% 0% 0% round 1.75rem)", opacity: 1 }}
      viewport={{ once: true, margin: "-15%" }}
      transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
    >
      <AnimatePresence initial={false}>
        {pics[i] && (
          <motion.div
            key={pics[i] + i}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 0.9 }, scale: { duration: 5.5, ease: "linear" } }}
          >
            <Image src={pics[i]} alt={alt} fill sizes="(max-width: 768px) 100vw, 60vw" className="object-cover" />
          </motion.div>
        )}
      </AnimatePresence>
      {pics.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/15 px-2.5 py-1.5 backdrop-blur">
          {pics.map((_, k) => (
            <button
              key={k}
              aria-label={`Photo ${k + 1}`}
              onClick={() => setI(k)}
              className={`size-2 rounded-full transition-all duration-300 ${k === i ? "scale-125 bg-white" : "bg-white/55 hover:bg-white/80"}`}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

export function SmashStory({ features, gallery, ctaLabel, instagram, instagramUrl }: {
  features: Feature[]; gallery: string[]; ctaLabel: string; instagram?: string; instagramUrl?: string;
}) {
  const reduce = useReducedMotion();
  if (!features.length) return null;
  return (
    <section className="mx-auto max-w-7xl space-y-16 px-5 py-10 md:space-y-24 md:py-16">
      {features.slice(0, 2).map((f, idx) => {
        const extra = gallery.slice(idx * 2, idx * 2 + 2);
        const pics = [f.image, ...extra].filter((x, k, a): x is string => !!x && a.indexOf(x) === k);
        const words = f.title.split(/\s+/);
        return (
          <div key={idx} className={`grid items-center gap-8 md:gap-14 ${idx % 2 ? "md:grid-cols-[1fr_1.35fr]" : "md:grid-cols-[1.35fr_1fr]"}`}>
            <div className={idx % 2 ? "md:order-2" : ""}>
              {pics.length > 0 ? <PhotoCarousel pics={pics} alt={f.title} /> : <div className="aspect-[16/10] rounded-[1.75rem] bg-foreground/5" />}
            </div>
            <div className="text-center">
              <h2
                className="uppercase leading-[0.95] text-foreground"
                style={{ fontFamily: "var(--font-marker), cursive", fontSize: f.title.length > 22 ? "clamp(2rem,3.6vw,3.4rem)" : "clamp(2.6rem,5.4vw,5rem)" }}
              >
                {words.map((w, k) => (
                  <span key={k} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                    <motion.span
                      className="inline-block"
                      initial={reduce ? false : { y: "105%", rotate: 6 }}
                      whileInView={{ y: "0%", rotate: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: k * 0.06 }}
                    >
                      {w}
                      {k < words.length - 1 ? " " : ""}
                    </motion.span>
                  </span>
                ))}
              </h2>
              <motion.p
                className="mx-auto mt-6 max-w-md text-base leading-[1.55] text-foreground/85 md:text-lg"
                style={{ fontFamily: "var(--font-courier-prime), ui-monospace, monospace" }}
                initial={reduce ? false : { opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.25 }}
              >
                {f.description}
              </motion.p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/Menu" className="rounded-full bg-foreground px-7 py-3.5 text-sm font-bold uppercase tracking-tight text-background transition-transform duration-300 hover:-translate-y-0.5 hover:scale-105 md:text-base">
                  {ctaLabel}
                </Link>
                {instagram && instagramUrl && (
                  <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="rounded-full bg-foreground px-7 py-3.5 text-sm font-bold uppercase tracking-tight text-background transition-transform duration-300 hover:-translate-y-0.5 hover:scale-105 md:text-base">
                    @{instagram}
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
