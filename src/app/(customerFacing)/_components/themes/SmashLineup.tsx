"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";

// ── smash-bold lineup — Ender's "HAMBURGUESAS SMASH." block ──────────────────
// A huge uppercase category headline with a full stop, a one-line "PAPAS
// CRINKLE. POLLO FRITO." sub-list, then a drag/scroll-snap row of BIG white
// product cards (isolated food on a soft studio gradient, heavy name, small
// description) fading out at both edges, and a dark "SEE MENU" pill.
// Cards lift + scale on hover and the food nudges up.

type P = { id: string; name: string; priceInCents: number; description: string | null; image: string | null };

const usd = (c: number) => `$${(c / 100).toFixed(c % 100 === 0 ? 0 : 2)}`;

export function SmashLineup({ title, subtitle, items, ctaLabel }: { title: string; subtitle: string; items: P[]; ctaLabel: string }) {
  const row = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const nudge = (dir: 1 | -1) => row.current?.scrollBy({ left: dir * (row.current.clientWidth * 0.6), behavior: "smooth" });

  return (
    <section className="py-16 md:py-24">
      <motion.h2
        className="px-5 text-center text-[clamp(2.4rem,7.5vw,6.5rem)] font-extrabold uppercase leading-[0.9] tracking-[-0.04em] text-foreground"
        initial={reduce ? false : { y: 40, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, margin: "-15%" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {title}.
      </motion.h2>
      {subtitle && <p className="mt-3 px-5 text-center text-base uppercase text-foreground/80 md:text-2xl">{subtitle}</p>}

      <div className="relative mt-10 md:mt-14">
        <div
          ref={row}
          className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto px-[8vw] pb-10 pt-4 md:gap-6"
          style={{
            WebkitMaskImage: "linear-gradient(90deg, transparent 0, #000 7%, #000 93%, transparent 100%)",
            maskImage: "linear-gradient(90deg, transparent 0, #000 7%, #000 93%, transparent 100%)",
          }}
        >
          {items.map((p, i) => (
            <motion.div
              key={p.id}
              className="shrink-0 snap-center"
              initial={reduce ? false : { y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, margin: "-5%" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: Math.min(i, 4) * 0.07 }}
            >
              <Link
                href="/Menu"
                className="group flex w-[78vw] flex-col rounded-[1.75rem] bg-card p-3 shadow-[0_2px_6px_rgba(0,0,0,0.04)] transition-[transform,box-shadow] duration-300 ease-out will-change-transform hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-[0_30px_50px_-20px_rgba(0,0,0,0.28)] focus-visible:-translate-y-1.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground sm:w-[46vw] lg:w-[31vw] lg:max-w-[560px]"
              >
                <div className="relative aspect-[5/4] w-full overflow-hidden rounded-[1.25rem] bg-[linear-gradient(135deg,#fff_0%,#f3f4f4_100%)] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)] dark:bg-[linear-gradient(135deg,#1c1f21_0%,#151719_100%)]">
                  {p.image ? (
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      sizes="(max-width: 640px) 78vw, (max-width: 1024px) 46vw, 31vw"
                      className="object-cover transition-transform duration-500 ease-out group-hover:-translate-y-1 group-hover:scale-[1.06]"
                    />
                  ) : (
                    <div className="grid size-full place-items-center text-6xl font-extrabold uppercase text-foreground/10">{p.name.slice(0, 1)}</div>
                  )}
                  <span className="absolute right-3 top-3 translate-y-1 rounded-full bg-foreground px-3 py-1 text-sm font-bold text-background opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    {usd(p.priceInCents)}
                  </span>
                </div>
                <div className="px-1 pb-3 pt-5">
                  <h3 className="text-[clamp(1.6rem,2.6vw,2.4rem)] font-extrabold uppercase leading-none tracking-[-0.04em] text-card-foreground">{p.name}</h3>
                  {p.description && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {items.length > 3 && (
          <div className="pointer-events-none absolute inset-x-0 top-1/2 hidden -translate-y-1/2 justify-between px-4 md:flex">
            {([-1, 1] as const).map((d) => (
              <button
                key={d}
                onClick={() => nudge(d)}
                aria-label={d < 0 ? "Previous items" : "Next items"}
                className="pointer-events-auto grid size-12 place-items-center rounded-full bg-foreground text-xl text-background shadow-lg transition-transform hover:scale-110"
              >
                {d < 0 ? "←" : "→"}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-center">
        <Link
          href="/Menu"
          className="rounded-full bg-foreground px-10 py-4 text-lg font-bold uppercase tracking-tight text-background transition-transform duration-300 hover:-translate-y-0.5 hover:scale-105"
        >
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}
