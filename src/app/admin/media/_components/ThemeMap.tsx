"use client";

import Image from "next/image";
import type { ThemeSlug } from "@/lib/themes/registry";

// A live miniature of the owner's homepage IN THEIR DESIGN, painted with their
// real current photos, dishes and words. Every photo spot carries a numbered
// badge matching its card on the right; hovering either lights up the other,
// clicking a badge scrolls to its card. Stylised (not a screenshot) so it's
// instant and always reflects unsaved-free current state.

export type MapData = {
  theme: ThemeSlug;
  name: string;
  img: (key: string) => string | null; // effective image for a slot
  num: (key: string) => number; // slot number (1-based) or 0
  dishes: string[];
  words: { sub: string; heroWord: string; headline: string };
  brand: string;
  gallery: string[];
};

type HotProps = { k: string; d: MapData; active: string | null; onHover: (k: string | null) => void; className?: string; round?: boolean; children?: React.ReactNode };

function Hot({ k, d, active, onHover, className = "", round, children }: HotProps) {
  const src = d.img(k);
  const n = d.num(k);
  const on = active === k;
  return (
    <button
      type="button"
      onMouseEnter={() => onHover(k)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(k)}
      onBlur={() => onHover(null)}
      onClick={() => document.getElementById(`slot-${k}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}
      className={`group/hot relative overflow-hidden transition-all duration-300 ${round ? "rounded-full" : ""} ${on ? "z-10 scale-[1.03] ring-[3px] ring-[#c85a1e] ring-offset-2" : "ring-0"} ${className}`}
      aria-label={`Photo spot ${n}`}
    >
      {src ? (
        <Image src={src} alt="" fill sizes="300px" className="object-cover transition-transform duration-500 group-hover/hot:scale-110" unoptimized={src.startsWith("blob:")} />
      ) : (
        <span className="absolute inset-0 bg-[repeating-linear-gradient(45deg,#e7e5e4_0_6px,#f5f5f4_6px_12px)]" />
      )}
      {children}
      {n > 0 && (
        <span className={`absolute left-1.5 top-1.5 grid size-5 place-items-center rounded-full text-[10px] font-bold shadow-md ring-2 ring-white transition-transform ${on ? "scale-125 bg-[#c85a1e] text-white" : "bg-white text-stone-800"}`}>
          {n}
        </span>
      )}
    </button>
  );
}

const Lines = ({ n = 3, c = "#d6d3d1", w = ["90%", "75%", "60%"] }: { n?: number; c?: string; w?: string[] }) => (
  <div className="space-y-1">
    {Array.from({ length: n }).map((_, i) => (
      <div key={i} className="h-1 rounded-full" style={{ background: c, width: w[i % w.length] }} />
    ))}
  </div>
);

function Dish({ src, className = "", round }: { src?: string; className?: string; round?: boolean }) {
  return (
    <div className={`relative overflow-hidden bg-stone-100 ${round ? "rounded-full" : "rounded"} ${className}`}>
      {src && <Image src={src} alt="" fill sizes="80px" className="object-cover" />}
    </div>
  );
}

export function ThemeMap({ d, active, onHover }: { d: MapData; active: string | null; onHover: (k: string | null) => void }) {
  const h = { d, active, onHover };
  const dish = (i: number) => d.dishes[i % Math.max(1, d.dishes.length)];

  if (d.theme === "smash-bold") {
    return (
      <div className="space-y-2 bg-[#eef1f0] p-2 text-[#111315]">
        <div className="flex items-center justify-between px-1 text-[7px] font-extrabold uppercase tracking-[0.25em]">
          {d.name}
          <span className="rounded-full bg-[#111315] px-1.5 py-0.5 text-[5px] text-white">ORDER</span>
        </div>
        <div className="relative grid grid-cols-2 items-center rounded-xl bg-[radial-gradient(ellipse_at_60%_45%,#f4f6f5,#dadedc)] p-2">
          <p className="-rotate-3 text-center text-[17px] leading-none" style={{ fontFamily: "var(--font-balloon), system-ui" }}>{d.words.sub}</p>
          <Hot k="smash_mascot" {...h} className="aspect-[1200/896] w-full rounded-md" />
          <Hot k="smash_location" {...h} className="absolute bottom-1.5 right-1.5 h-7 w-11 rounded border border-white">
            <span className="absolute inset-0 grid place-items-center bg-black/40 text-[5px] font-black text-white">#001</span>
          </Hot>
        </div>
        <p className="text-center text-[12px] font-extrabold uppercase tracking-tight">Lineup.</p>
        <div className="grid grid-cols-3 gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded bg-white p-0.5 shadow-sm">
              <Dish src={dish(i)} className="aspect-[5/4]" />
              <div className="mt-0.5 h-1 w-3/4 rounded bg-[#111315]" />
            </div>
          ))}
        </div>
        {["home_feature_1", "home_feature_2"].map((k, i) => (
          <div key={k} className={`flex items-center gap-2 ${i ? "flex-row-reverse" : ""}`}>
            <Hot k={k} {...h} className="h-12 w-3/5 rounded-lg" />
            <div className="flex-1 text-center">
              <p className="text-[10px] font-bold uppercase leading-none" style={{ fontFamily: "var(--font-caveat), cursive" }}>Story</p>
              <div className="mx-auto mt-1 flex w-fit gap-0.5"><span className="h-1.5 w-4 rounded-full bg-[#111315]" /><span className="h-1.5 w-4 rounded-full bg-[#111315]" /></div>
            </div>
          </div>
        ))}
        <p className="text-center text-[9px] font-extrabold uppercase">Gallery wall</p>
        <div className="space-y-1 overflow-hidden">
          {[0, 1].map((r) => (
            <div key={r} className="flex gap-1" style={{ marginLeft: r ? -12 : 0 }}>
              {(d.gallery.length ? d.gallery : ["", "", "", ""]).slice(r * 3, r * 3 + 5).concat(d.gallery.slice(0, 2)).slice(0, 5).map((g, k) => (
                <Dish key={k} src={g || undefined} className={`aspect-[4/5] w-9 shrink-0 ${k % 2 ? "rotate-2" : "-rotate-2"}`} />
              ))}
            </div>
          ))}
        </div>
        <div className="rounded bg-[#111315] p-1.5"><Lines n={2} c="#3f3f46" /></div>
        <div className="-rotate-1 bg-[#111315] py-0.5 text-center text-[5px] font-bold uppercase text-white">★ your tagline ★ your tagline ★</div>
      </div>
    );
  }

  if (d.theme === "diner-classic") {
    return (
      <div className="bg-[#f9f4ed] text-[#3b2517]">
        <div className="flex items-center justify-between bg-[#3b2517] px-2 py-1.5">
          <span className="-rotate-3 text-[10px] text-[#fcb931]" style={{ fontFamily: "var(--font-script), cursive" }}>{d.name}</span>
          <span className="rounded-sm bg-[#fcb931] px-1.5 py-0.5 text-[5px] font-black shadow-[1.5px_1.5px_0_#f9f4ed]">order now</span>
        </div>
        <div className="relative bg-[#fcb931] px-2 pb-4 pt-2 text-center">
          <p className="-rotate-6 text-[26px] leading-none text-[#f9f4ed] drop-shadow-sm" style={{ fontFamily: "var(--font-script), cursive" }}>{d.words.heroWord}</p>
          <div className="-mt-1 flex justify-center">
            {d.dishes.length > 0
              ? [0, 1, 2].map((i) => <Dish key={i} src={dish(i)} className="size-12 mix-blend-multiply" />)
              : <Hot k="diner_hero" {...h} className="h-12 w-28 rounded" />}
          </div>
          <div className="absolute inset-x-0 -bottom-2 flex justify-around">
            {[3, 2, 4, 2, 3, 5].map((hh, i) => <span key={i} className="w-2 rounded-b-full bg-[#fcb931]" style={{ height: hh * 3 }} />)}
          </div>
        </div>
        <div className="space-y-1.5 px-2 pb-2 pt-4">
          <p className="text-center text-[13px]" style={{ fontFamily: "var(--font-script), cursive" }}>· · · Menu · · ·</p>
          <div className="grid grid-cols-2 gap-2">
            {[0, 1].map((i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="relative size-10">
                  <span className="absolute left-0 top-0 size-9 rounded-full bg-[#3b2517]" />
                  <Dish src={dish(i + 1)} round className="absolute bottom-0 right-0 size-9 ring-1 ring-white" />
                </div>
                <div className="mt-1 h-1 w-10 rounded bg-[#3b2517]" />
              </div>
            ))}
          </div>
          <div className="rounded-sm bg-[#fcb931] p-1.5"><Lines n={2} c="#3b2517aa" /></div>
          <p className="text-center text-[12px]" style={{ fontFamily: "var(--font-script), cursive" }}>Our Story</p>
          <div className="flex justify-center gap-4">
            {["home_feature_1", "home_feature_2"].map((k) => (
              <div key={k} className="relative size-12">
                <span className="absolute left-0 top-0 size-10 rounded-full bg-[#3b2517]" />
                <Hot k={k} {...h} round className="absolute bottom-0 right-0 size-10" />
              </div>
            ))}
          </div>
          <div className="rounded bg-[#3b2517] py-1.5 text-center text-[9px] text-[#fcb931]" style={{ fontFamily: "var(--font-script), cursive" }}>Come say hi!</div>
        </div>
      </div>
    );
  }

  if (d.theme === "refined-elegant") {
    return (
      <div className="bg-white text-[#0f0606]">
        <Hot k="elegant_hero" {...h} className="block h-36 w-full">
          <span className="absolute inset-0 bg-black/45" />
          <span className="absolute inset-x-0 top-1.5 flex justify-between px-2 text-[5px] font-semibold uppercase tracking-[0.2em] text-white">
            {d.name}<span>menu · story</span>
          </span>
          <span className="absolute inset-x-2 top-1/2 -translate-y-1/2 text-center text-[13px] leading-tight text-white" style={{ fontFamily: "var(--font-stencil), sans-serif" }}>{d.words.headline}</span>
          <span className="absolute bottom-1.5 left-1/2 h-2.5 w-16 -translate-x-1/2 rounded-full bg-[#ffd469]" />
        </Hot>
        <div className="grid grid-cols-2 gap-2 p-2">
          <Hot k="elegant_intro" {...h} className="aspect-[4/5] w-full" />
          <div className="space-y-1.5 pt-1">
            <div className="h-1.5 w-4/5 rounded bg-[#0f0606]" />
            <Lines n={4} c="#d4d4d4" />
          </div>
        </div>
        <div className="space-y-1 px-3 pb-2">
          <p className="text-center text-[10px]" style={{ fontFamily: "var(--font-stencil), sans-serif" }}>THE MENU</p>
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-1 border-b border-black/10 pb-0.5">
              <div className="h-1 w-10 rounded bg-[#0f0606]" />
              <div className="flex-1 border-b border-dotted border-black/30" />
              <div className="h-1 w-3 rounded bg-[#0f0606]" />
            </div>
          ))}
        </div>
        <Hot k="elegant_visit" {...h} className="block h-16 w-full">
          <span className="absolute inset-0 bg-black/50" />
          <span className="absolute inset-0 grid place-items-center text-[10px] text-white" style={{ fontFamily: "var(--font-stencil), sans-serif" }}>VISIT US</span>
        </Hot>
        <div className="px-4 py-2"><Lines n={2} c="#a3a3a3" w={["100%", "70%"]} /></div>
        <Hot k="elegant_story" {...h} className="block h-20 w-full">
          <span className="absolute inset-0 bg-black/50" />
          <span className="absolute inset-0 grid place-items-center text-[10px] text-white" style={{ fontFamily: "var(--font-stencil), sans-serif" }}>OUR STORY</span>
        </Hot>
      </div>
    );
  }

  // classic
  return (
    <div className="space-y-2 bg-white p-2 text-stone-800">
      <div className="flex items-center justify-between px-1">
        <span className="size-3 rounded-full" style={{ background: d.brand }} />
        <span className="flex gap-1">{[0, 1, 2].map((i) => <span key={i} className="h-1 w-4 rounded bg-stone-300" />)}</span>
        <span className="h-2 w-7 rounded" style={{ background: d.brand }} />
      </div>
      <div className="grid grid-cols-2 items-center gap-2 rounded-lg bg-stone-100 p-2">
        <div className="space-y-1">
          <div className="h-1.5 w-full rounded" style={{ background: d.brand }} />
          <Lines n={2} />
        </div>
        <div className="relative">
          <Hot k="home_hero" {...h} className="aspect-[4/5] w-full rounded-md" />
          <div className="absolute -bottom-2 -left-3 flex gap-1">
            <Hot k="home_hero_2" {...h} className="size-7 rounded border-2 border-white" />
            <Hot k="home_hero_3" {...h} className="size-7 rounded border-2 border-white" />
          </div>
        </div>
      </div>
      <div className="flex gap-1 pt-1">{[0, 1, 2, 3].map((i) => <Dish key={i} src={dish(i)} className="aspect-square flex-1" />)}</div>
      {["home_feature_1", "home_feature_2"].map((k, i) => (
        <div key={k} className={`flex gap-2 rounded-md border border-stone-200 p-1 ${i ? "flex-row-reverse" : ""}`}>
          <Hot k={k} {...h} className="h-10 w-2/5 rounded" />
          <div className="flex-1 pt-1"><Lines n={2} /></div>
        </div>
      ))}
      <Hot k="home_order" {...h} className="block h-12 w-full rounded-md">
        <span className="absolute inset-0 bg-black/35" />
      </Hot>
    </div>
  );
}
