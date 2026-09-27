"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";

// ── smash-bold lineup — Ender's "HAMBURGUESAS SMASH." block ──────────────────
// A huge uppercase category headline with a full stop, a one-line "PAPAS
// CRINKLE. POLLO FRITO." sub-list, then an ENDLESS auto-sliding row of BIG
// white product cards (like Ender's: every item drifts past without touching
// anything), fading out at both edges; hovering pauses it. Cards lift + scale
// on hover, the food nudges up and the price slides in. Dark "SEE MENU" pill.

type P = { id: string; name: string; priceInCents: number; description: string | null; image: string | null };

const usd = (c: number) => `$${(c / 100).toFixed(c % 100 === 0 ? 0 : 2)}`;

function Card({ p }: { p: P }) {
  return (
    <Link
      href="/Menu"
      className="group flex w-[78vw] shrink-0 flex-col rounded-[1.75rem] bg-card p-3 shadow-[0_2px_6px_rgba(0,0,0,0.04)] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-[0_30px_50px_-20px_rgba(0,0,0,0.28)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground sm:w-[46vw] lg:w-[31vw] lg:max-w-[560px]"
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
        <h3 className="truncate text-[clamp(1.6rem,2.6vw,2.4rem)] font-extrabold uppercase leading-none tracking-[-0.04em] text-card-foreground">{p.name}</h3>
        {p.description && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>}
      </div>
    </Link>
  );
}

export function SmashLineup({ title, subtitle, items, ctaLabel }: { title: string; subtitle: string; items: P[]; ctaLabel: string }) {
  const reduce = useReducedMotion();
  // Two identical halves → translate -50% loops seamlessly. Short menus get
  // repeated so the strip is always wider than the screen.
  const base = items.length < 4 ? [...items, ...items, ...items] : items;
  const loop = [...base, ...base];
  const seconds = Math.max(28, base.length * 7);

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

      <div
        className="mt-10 overflow-hidden md:mt-14"
        style={{
          WebkitMaskImage: "linear-gradient(90deg, transparent 0, #000 7%, #000 93%, transparent 100%)",
          maskImage: "linear-gradient(90deg, transparent 0, #000 7%, #000 93%, transparent 100%)",
        }}
      >
        {reduce ? (
          <div className="no-scrollbar flex snap-x gap-5 overflow-x-auto px-[8vw] pb-10 pt-4 md:gap-6">
            {items.map((p) => <Card key={p.id} p={p} />)}
          </div>
        ) : (
          <div
            className="flex w-max pb-10 pt-4 hover:[animation-play-state:paused]"
            style={{ animation: `marquee ${seconds}s linear infinite` }}
          >
            {/* spacing as padding (not gap) so -50% lands exactly on the seam */}
            {loop.map((p, i) => <div key={`${p.id}-${i}`} className="pr-5 md:pr-6"><Card p={p} /></div>)}
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
