"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Loader2, ShoppingBag, X } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/app/providers/CartProvider";
import type { Animal, MarketCut } from "@/lib/market";

// The Butcher counter, drawn from a real butcher shop instead of a web template:
// a white-tile wall, an enamel shop sign (bilingual), today's prices on a black
// felt letterboard, an analog hanging scale whose needle swings to your weight,
// and a printed deli scale label you add to the cart. Boxes are butcher-paper
// parcels tied with twine. Colour = the restaurant's own --brand.

const BRAND = "var(--brand, #c8102e)";
const AR: Record<string, string> = { Lamb: "ضأن", Goat: "ماعز", Beef: "بقر", Veal: "عجل", Chicken: "دجاج", Turkey: "ديك رومي", Fish: "سمك", More: "مختارات" };
const usd = (c: number) => `$${(c / 100).toFixed(2)}`;
const money = (c: number) => (c / 100).toFixed(2);

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Aref+Ruqaa:wght@700&family=IBM+Plex+Mono:wght@500;700&family=Oswald:wght@500;600&display=swap');`;
const F = {
  slab: "'Alfa Slab One', Georgia, serif",
  arabic: "'Aref Ruqaa', 'Times New Roman', serif",
  board: "Oswald, 'Arial Narrow', sans-serif",
  mono: "'IBM Plex Mono', ui-monospace, monospace",
};
// white subway tiles, offset like real ones
const TILE_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='48'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='%23ffffff'/><stop offset='1' stop-color='%23eef1ef'/></linearGradient></defs><rect width='96' height='48' fill='%23dfe4e1'/><rect x='1' y='1' width='94' height='22' rx='2' fill='url(%23g)'/><rect x='-47' y='25' width='94' height='22' rx='2' fill='url(%23g)'/><rect x='49' y='25' width='94' height='22' rx='2' fill='url(%23g)'/></svg>`;
const TILES = {
  backgroundColor: "#eef1ef",
  backgroundImage: `url("data:image/svg+xml;utf8,${TILE_SVG}")`,
  backgroundSize: "96px 48px",
};

export function MarketClient({ cuts, name, halal, preview }: { cuts: MarketCut[]; name: string; halal: boolean; preview: boolean }) {
  const byWeight = cuts.filter((c) => c.weight);
  const boxes = cuts.filter((c) => !c.weight);
  const animals = useMemo(() => [...new Set(byWeight.map((c) => c.animal))] as Animal[], [byWeight]);
  const [animal, setAnimal] = useState<Animal | "All">("All");
  const list = animal === "All" ? byWeight : byWeight.filter((c) => c.animal === animal);
  const [picked, setPicked] = useState<string | null>(byWeight[0]?.id ?? null);
  const [sheet, setSheet] = useState(false); // phones: the scale opens as a sheet
  const cut = byWeight.find((c) => c.id === picked) ?? null;

  const choose = (id: string) => {
    setPicked(id);
    if (typeof window !== "undefined" && window.innerWidth < 1024) setSheet(true);
  };

  return (
    <div className="w-full pb-28 pt-24 md:pt-28" style={{ ...TILES, color: "#141414" }}>
      <style>{FONTS}</style>

      {/* Enamel shop sign */}
      <section className="mx-auto max-w-6xl px-4 md:px-6">
        <EnamelSign name={name} />
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {[halal && "Halal", "Cut to your weight", "Pickup", "Delivery"].filter(Boolean).map((t) => (
            <span key={t as string} className="rounded-[6px] border border-[#cfd5d2] bg-white px-3 py-1.5 text-[13px] font-semibold shadow-[0_2px_0_#cfd5d2]">
              {t}
            </span>
          ))}
        </div>
        {preview && (
          <div className="relative mx-auto mt-6 max-w-md -rotate-1 bg-[#fff6c9] px-5 py-3 text-center text-sm font-semibold text-[#5a4a00] shadow-[0_10px_20px_-12px_rgba(0,0,0,0.4)]">
            <span aria-hidden className="absolute -top-2.5 left-1/2 h-5 w-24 -translate-x-1/2 rotate-2 bg-[#e8e2c8]/80" />
            Preview prices. Your real price list goes here before launch.
          </div>
        )}
      </section>

      {/* Butcher-paper parcels */}
      {boxes.length > 0 && (
        <section className="mx-auto mt-12 max-w-6xl px-4 md:px-6">
          <SectionTitle en="Ready-made parcels" ar="طرود جاهزة" />
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {boxes.map((b, i) => (
              <Parcel key={b.id} box={b} tilt={i % 2 ? 1.2 : -1.2} />
            ))}
          </div>
        </section>
      )}

      {/* Letterboard + scale */}
      <section className="mx-auto mt-14 max-w-6xl px-4 md:px-6">
        <SectionTitle en="Today's cuts" ar="قطع اليوم" />
        <div className="mt-5 grid items-start gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Letterboard animals={animals} animal={animal} setAnimal={setAnimal} list={list} picked={picked} choose={choose} />
          <div className="sticky top-28 hidden lg:block">{cut && <ScaleStation cut={cut} key={cut.id} />}</div>
        </div>
        <p className="mt-6 text-center text-xs font-medium text-black/50">We cut as close to your weight as we can. Special cut or a big order? Call us.</p>
      </section>

      {/* Phones: the scale slides up when you tap a cut */}
      <AnimatePresence>
        {sheet && cut && (
          <motion.div className="fixed inset-0 z-[90] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button aria-label="Close" className="absolute inset-0 bg-black/45" onClick={() => setSheet(false)} />
            <motion.div
              className="absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-[26px] px-4 pb-8 pt-3"
              style={TILES}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
            >
              <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-black/20" />
              <button onClick={() => setSheet(false)} aria-label="Close" className="absolute right-4 top-3 grid h-9 w-9 place-items-center rounded-full bg-white shadow">
                <X className="h-4 w-4" />
              </button>
              <ScaleStation cut={cut} key={cut.id} onAdded={() => setTimeout(() => setSheet(false), 900)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SectionTitle({ en, ar }: { en: string; ar: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b-2 border-black/80 pb-2">
      <h2 className="text-2xl uppercase tracking-wide md:text-3xl" style={{ fontFamily: F.slab }}>
        {en}
      </h2>
      <span className="text-2xl md:text-3xl" style={{ fontFamily: F.arabic, color: BRAND }} dir="rtl">
        {ar}
      </span>
    </div>
  );
}

// A red enamel plate with rivets, a white inner rule and the name in two scripts.
function EnamelSign({ name }: { name: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="relative mx-auto max-w-3xl"
      initial={reduce ? false : { rotate: -3, y: -24, opacity: 0 }}
      animate={{ rotate: -0.6, y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 90, damping: 9 }}
      style={{ transformOrigin: "50% -40px" }}
    >
      {/* the two chains it hangs from */}
      <span aria-hidden className="absolute -top-10 left-[18%] h-10 w-[3px]" style={{ background: "repeating-linear-gradient(#777 0 5px, #bbb 5px 8px)" }} />
      <span aria-hidden className="absolute -top-10 right-[18%] h-10 w-[3px]" style={{ background: "repeating-linear-gradient(#777 0 5px, #bbb 5px 8px)" }} />
      <div
        className="relative overflow-hidden rounded-[22px] px-6 py-8 text-center text-white md:px-12 md:py-11"
        style={{ background: BRAND, boxShadow: "0 22px 40px -18px rgba(0,0,0,0.55), inset 0 2px 0 rgba(255,255,255,0.25), inset 0 -6px 0 rgba(0,0,0,0.18)" }}
      >
        {/* enamel sheen */}
        <span aria-hidden className="pointer-events-none absolute -left-1/4 top-0 h-full w-1/2 -skew-x-12 bg-white/10" />
        <div className="pointer-events-none absolute inset-3 rounded-[14px] border-2 border-white/85" />
        {[["left-5 top-5"], ["right-5 top-5"], ["left-5 bottom-5"], ["right-5 bottom-5"]].map(([p]) => (
          <span key={p} aria-hidden className={`absolute ${p} h-3 w-3 rounded-full bg-gradient-to-br from-white via-[#ddd] to-[#888] shadow-inner`} />
        ))}
        <p className="relative text-[11px] font-semibold uppercase tracking-[0.4em] text-white/85">{name}</p>
        <h1 className="relative mt-2 text-[clamp(2.6rem,9vw,5.6rem)] uppercase leading-[0.95]" style={{ fontFamily: F.slab, textShadow: "0 3px 0 rgba(0,0,0,0.22)" }}>
          Meat Market
        </h1>
        <p className="relative mt-1 text-[clamp(1.8rem,5vw,3rem)] leading-tight" style={{ fontFamily: F.arabic }} dir="rtl">
          سوق اللحم
        </p>
        <p className="relative mx-auto mt-3 max-w-md text-sm font-medium text-white/85 md:text-base">Cut fresh. Sold by the pound. Ready when you are.</p>
      </div>
    </motion.div>
  );
}

// Black felt letterboard with white plastic letters: today's prices.
function Letterboard({ animals, animal, setAnimal, list, picked, choose }: {
  animals: Animal[]; animal: Animal | "All"; setAnimal: (a: Animal | "All") => void; list: MarketCut[]; picked: string | null; choose: (id: string) => void;
}) {
  return (
    <div
      className="rounded-[18px] border-[10px] p-4 md:p-6"
      style={{
        borderColor: "#5b3a22",
        background: "repeating-linear-gradient(#161616 0 13px, #0b0b0b 13px 15px)",
        boxShadow: "0 24px 40px -22px rgba(0,0,0,0.7), inset 0 0 40px rgba(0,0,0,0.6)",
      }}
    >
      <div className="flex flex-wrap gap-2">
        {(["All", ...animals] as (Animal | "All")[]).map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAnimal(a)}
            className="rounded-[4px] px-3 py-1.5 text-sm uppercase tracking-[0.14em] transition-colors"
            style={{ fontFamily: F.board, color: animal === a ? "#111" : "#f2f2ee", background: animal === a ? "#f2f2ee" : "transparent", boxShadow: animal === a ? "none" : "inset 0 0 0 1px rgba(255,255,255,0.25)" }}
          >
            {a}
            {a !== "All" && <span className="ml-1.5 normal-case" style={{ fontFamily: F.arabic }}>{AR[a]}</span>}
          </button>
        ))}
      </div>
      <p className="mt-5 text-xs uppercase tracking-[0.3em] text-white/45" style={{ fontFamily: F.board }}>
        Price per lb · tap a cut to weigh it
      </p>
      <ul className="mt-2">
        <AnimatePresence initial={false}>
          {list.map((c) => {
            const on = c.id === picked;
            return (
              <motion.li key={c.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <button
                  type="button"
                  onClick={() => choose(c.id)}
                  className="group flex w-full items-baseline gap-2 py-2.5 text-left"
                  style={{ fontFamily: F.board, color: on ? "#ffd84a" : "#f2f2ee", textShadow: "0 1px 0 rgba(0,0,0,0.9), 0 0 1px rgba(255,255,255,0.4)" }}
                >
                  <span className="w-4 shrink-0 text-lg">{on ? "▸" : ""}</span>
                  <span className="text-[17px] uppercase tracking-[0.08em] md:text-xl">{c.name}</span>
                  <span aria-hidden className="mx-1 flex-1 translate-y-[-4px] border-b-2 border-dotted border-white/25 group-hover:border-white/50" />
                  <span className="text-[17px] tabular-nums tracking-[0.06em] md:text-xl">{money(c.pricePerLbCents)}</span>
                </button>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}

function useAdd() {
  const { mutate } = useCart();
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  async function add(productId: string, sides: Record<string, string>, label: string, after?: () => void) {
    setState("busy");
    try {
      const res = await fetch("/api/cart/add", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, quantity: 1, sides }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) throw new Error(data.message || "Couldn't add it");
      await mutate();
      toast.success(`${label} added to your order`);
      setState("done");
      after?.();
      setTimeout(() => setState("idle"), 1600);
    } catch (e) {
      toast.error((e as Error).message);
      setState("idle");
    }
  }
  return { state, add };
}

// The weighing station: analog scale, weight + cut choices, the printed label.
function ScaleStation({ cut, onAdded }: { cut: MarketCut; onAdded?: () => void }) {
  const weights = cut.weight!.options;
  const [w, setW] = useState(() => weights.find((o) => o.lb === 2)?.id ?? weights[0]?.id);
  const [s, setS] = useState(() => cut.style?.options[0]?.id ?? null);
  const { state, add } = useAdd();
  const wOpt = weights.find((o) => o.id === w) ?? weights[0];
  const sOpt = cut.style?.options.find((o) => o.id === s) ?? null;
  const total = cut.pricePerLbCents + (wOpt?.priceInCents ?? 0) + (sOpt?.priceInCents ?? 0);
  const lb = wOpt?.lb ?? 1;
  const max = Math.max(5, ...weights.map((o) => o.lb ?? 0));

  return (
    <div className="rounded-[22px] border border-[#cfd5d2] bg-white/80 p-5 shadow-[0_20px_40px_-24px_rgba(0,0,0,0.45)] backdrop-blur-sm md:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-xl uppercase leading-tight md:text-2xl" style={{ fontFamily: F.slab }}>
          {cut.name}
        </h3>
        <span className="text-xl" style={{ fontFamily: F.arabic, color: BRAND }} dir="rtl">
          {AR[cut.animal]}
        </span>
      </div>
      {cut.description && <p className="mt-1 text-sm text-black/60">{cut.description}</p>}

      <Dial lb={lb} max={max} />

      <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.2em] text-black/45">Weight</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {weights.map((o) => (
          <Weight key={o.id} on={o.id === w} onClick={() => setW(o.id)} label={o.label} />
        ))}
      </div>
      {cut.style && cut.style.options.length > 1 && (
        <>
          <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-black/45">How to cut it</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {cut.style.options.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setS(o.id)}
                aria-pressed={o.id === s}
                className="rounded-full border-2 px-3.5 py-1.5 text-sm font-semibold transition-colors"
                style={o.id === s ? { borderColor: "#141414", background: "#141414", color: "#fff" } : { borderColor: "#cfd5d2", background: "#fff" }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}

      <ScaleLabel name={cut.name} animal={cut.animal} lb={lb} perLb={cut.pricePerLbCents} total={total} style={sOpt?.label ?? null} />

      {cut.extraRequired ? (
        <Link href="/Menu" className="mt-4 flex w-full items-center justify-center rounded-2xl py-4 text-[15px] font-bold text-white" style={{ background: BRAND }}>
          Choose options on the menu
        </Link>
      ) : (
        <button
          type="button"
          disabled={state === "busy"}
          onClick={() => add(cut.id, { [cut.weight!.groupId]: wOpt.id, ...(cut.style && sOpt ? { [cut.style.groupId]: sOpt.id } : {}) }, `${wOpt.label} ${cut.name}`, onAdded)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[15px] font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-70"
          style={{ background: state === "done" ? "#15803d" : BRAND, boxShadow: "0 6px 0 rgba(0,0,0,0.2)" }}
        >
          {state === "busy" ? <Loader2 className="h-4 w-4 animate-spin" /> : state === "done" ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
          {state === "done" ? "Added to your order" : `Add this label · ${usd(total)}`}
        </button>
      )}
    </div>
  );
}

// Brass-weight style chip.
function Weight({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className="relative rounded-t-[14px] rounded-b-[6px] px-3.5 pb-1.5 pt-2 text-sm font-bold transition-transform active:scale-95"
      style={
        on
          ? { background: "linear-gradient(#f3d27a, #b8862f)", color: "#2a1d05", boxShadow: "0 3px 0 #7a5718, inset 0 1px 0 rgba(255,255,255,0.6)" }
          : { background: "linear-gradient(#f4f4f2, #d9dbd8)", color: "#333", boxShadow: "0 3px 0 #b5b8b4, inset 0 1px 0 #fff" }
      }
    >
      <span aria-hidden className="absolute -top-1.5 left-1/2 h-2 w-4 -translate-x-1/2 rounded-t-full border-2 border-b-0" style={{ borderColor: on ? "#b8862f" : "#c4c7c3" }} />
      {label}
    </button>
  );
}

// Analog hanging scale: the needle swings to the weight with a little bounce.
function Dial({ lb, max }: { lb: number; max: number }) {
  const reduce = useReducedMotion();
  const angle = -120 + (Math.min(lb, max) / max) * 240;
  const needle = useNeedle(angle, !!reduce);
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const ticks = [];
  for (let i = 0; i <= max * 4; i++) {
    const a = ((-120 + (i / (max * 4)) * 240) * Math.PI) / 180;
    const major = i % 4 === 0;
    const r1 = major ? 70 : 76;
    ticks.push(
      <line key={i} x1={r2(100 + Math.sin(a) * r1)} y1={r2(100 - Math.cos(a) * r1)} x2={r2(100 + Math.sin(a) * 84)} y2={r2(100 - Math.cos(a) * 84)} stroke="#1b1b1b" strokeWidth={major ? 2.4 : 1} strokeLinecap="round" />,
    );
    if (major) {
      ticks.push(
        <text key={`t${i}`} x={r2(100 + Math.sin(a) * 58)} y={r2(104 - Math.cos(a) * 58)} textAnchor="middle" fontSize="12" fontWeight="700" fill="#1b1b1b" style={{ fontFamily: F.board }}>
          {i / 4}
        </text>,
      );
    }
  }
  return (
    <div className="relative mx-auto mt-4 w-[230px]">
      {/* hook */}
      <svg viewBox="0 0 40 30" className="mx-auto -mb-1 h-7 w-10" aria-hidden>
        <path d="M20 0 V12 a8 8 0 1 0 8 8" fill="none" stroke="#8a8f8c" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <svg viewBox="0 0 200 200" className="w-full drop-shadow-[0_14px_18px_rgba(0,0,0,0.25)]" role="img" aria-label={`Scale showing ${lb} pounds`}>
        <defs>
          <radialGradient id="face" cx="50%" cy="40%" r="65%">
            <stop offset="0" stopColor="#fffdf6" />
            <stop offset="1" stopColor="#ece6d6" />
          </radialGradient>
          <linearGradient id="rim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e9ecea" />
            <stop offset="1" stopColor="#8d9290" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="98" fill="url(#rim)" />
        <circle cx="100" cy="100" r="90" fill="url(#face)" stroke="#b9b3a2" strokeWidth="1" />
        {ticks}
        <text x="100" y="140" textAnchor="middle" fontSize="11" fontWeight="700" letterSpacing="3" fill={BRAND} style={{ fontFamily: F.board }}>
          LB
        </text>
        <g transform={`rotate(${needle.toFixed(2)} 100 100)`}>
          <path d="M100 100 L97 92 L100 24 L103 92 Z" fill={BRAND} />
          <rect x="98.5" y="100" width="3" height="16" rx="1.5" fill={BRAND} />
        </g>
        <circle cx="100" cy="100" r="7" fill="#1b1b1b" />
        <circle cx="100" cy="100" r="2.5" fill="#d4d4d4" />
      </svg>
    </div>
  );
}

// A real scale needle: a damped spring, so it overshoots and settles like a
// hanging butcher scale. Drives an SVG rotate(angle 100 100) directly.
function useNeedle(target: number, reduce: boolean) {
  const [angle, setAngle] = useState(target);
  const pos = useRef(target);
  const vel = useRef(0);
  useEffect(() => {
    if (reduce) {
      pos.current = target;
      vel.current = 0;
      setAngle(target);
      return;
    }
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;
      const force = -170 * (pos.current - target) - 9 * vel.current; // stiffness, damping
      vel.current += force * dt;
      pos.current += vel.current * dt;
      setAngle(pos.current);
      if (Math.abs(pos.current - target) > 0.05 || Math.abs(vel.current) > 0.05) raf = requestAnimationFrame(step);
      else setAngle((pos.current = target));
    };
    raf = requestAnimationFrame(step);
    // If animation frames are paused (background tab, battery saver), the
    // needle still lands on the right weight.
    const snap = setTimeout(() => {
      cancelAnimationFrame(raf);
      pos.current = target;
      vel.current = 0;
      setAngle(target);
    }, 1400);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(snap);
    };
  }, [target, reduce]);
  return angle;
}

// A thermal deli scale label: what you're buying, printed.
function ScaleLabel({ name, animal, lb, perLb, total, style }: { name: string; animal: Animal; lb: number; perLb: number; total: number; style: string | null }) {
  const [today, setToday] = useState("");
  useEffect(() => setToday(new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" })), []);
  const reduce = useReducedMotion();
  const key = `${lb}-${style}-${total}`;
  return (
    <div className="relative mt-5">
      {/* the printer slot */}
      <div className="mx-auto h-2.5 w-[88%] rounded-full bg-[#1b1b1b] shadow-[inset_0_2px_3px_rgba(255,255,255,0.15)]" />
      <div className="mx-auto w-[82%] overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={key}
            initial={reduce ? false : { y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.2, 0.8, 0.3, 1] }}
            className="bg-white px-4 pb-3 pt-3 text-[#1b1b1b] shadow-[0_10px_18px_-10px_rgba(0,0,0,0.5)]"
            style={{ fontFamily: F.mono, clipPath: "polygon(0 0,100% 0,100% calc(100% - 6px),95% 100%,90% calc(100% - 6px),85% 100%,80% calc(100% - 6px),75% 100%,70% calc(100% - 6px),65% 100%,60% calc(100% - 6px),55% 100%,50% calc(100% - 6px),45% 100%,40% calc(100% - 6px),35% 100%,30% calc(100% - 6px),25% 100%,20% calc(100% - 6px),15% 100%,10% calc(100% - 6px),5% 100%,0 calc(100% - 6px))" }}
          >
            <div className="flex items-center justify-between text-[10px] font-bold tracking-[0.18em]">
              <span>PACKED FRESH</span>
              <span>{today}</span>
            </div>
            <div className="mt-1.5 flex items-baseline justify-between gap-2 border-t border-dashed border-black/40 pt-1.5">
              <span className="text-[13px] font-bold uppercase leading-tight">{name}</span>
              <span className="text-base" style={{ fontFamily: F.arabic }} dir="rtl">
                {AR[animal]}
              </span>
            </div>
            {style && <p className="text-[11px] font-medium uppercase">{style}</p>}
            <div className="mt-2 grid grid-cols-3 gap-1 border-y border-dashed border-black/40 py-1.5 text-[10px] font-bold">
              <span>
                NET WT
                <br />
                <span className="text-[13px]">{lb.toFixed(2)} LB</span>
              </span>
              <span>
                $ / LB
                <br />
                <span className="text-[13px]">{money(perLb)}</span>
              </span>
              <span className="text-right">
                TOTAL
                <br />
                <span className="text-[17px]">{usd(total)}</span>
              </span>
            </div>
            {/* barcode */}
            <div aria-hidden className="mx-auto mt-2 h-8 w-[80%]" style={{ background: "repeating-linear-gradient(90deg,#1b1b1b 0 2px,transparent 2px 4px,#1b1b1b 4px 5px,transparent 5px 8px,#1b1b1b 8px 11px,transparent 11px 12px)" }} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// Ready-made boxes, wrapped in butcher paper and tied with twine.
function Parcel({ box, tilt }: { box: MarketCut; tilt: number }) {
  const { state, add } = useAdd();
  return (
    <article
      className="relative overflow-hidden rounded-[10px] p-6 pt-7"
      style={{
        transform: `rotate(${tilt}deg)`,
        background: "linear-gradient(135deg, #d9b98c 0%, #cfa978 45%, #d8b688 100%)",
        boxShadow: "0 18px 28px -18px rgba(70,40,10,0.7), inset 0 0 0 1px rgba(90,60,20,0.2)",
      }}
    >
      {/* paper fibres + twine */}
      <span aria-hidden className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: "repeating-linear-gradient(-20deg, rgba(255,255,255,0.18) 0 1px, transparent 1px 6px)" }} />
      <span aria-hidden className="absolute inset-y-0 left-[68%] w-[5px]" style={{ background: "repeating-linear-gradient(#f3ead8 0 4px, #c9b48e 4px 7px)" }} />
      <span aria-hidden className="absolute inset-x-0 top-[38%] h-[5px]" style={{ background: "repeating-linear-gradient(90deg,#f3ead8 0 4px, #c9b48e 4px 7px)" }} />
      <span aria-hidden className="absolute left-[68%] top-[38%] h-6 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-[5px] border-[#efe4cc]" />
      <div className="relative max-w-[78%] rounded-[6px] bg-[#f6efe0] px-4 py-3 shadow-[0_6px_12px_-8px_rgba(60,35,10,0.6)]" style={{ transform: `rotate(${-tilt * 0.8}deg)` }}>
        <span className="inline-block -rotate-3 rounded-full border-2 border-dashed px-3 py-0.5 text-[11px] font-black uppercase tracking-[0.2em]" style={{ borderColor: BRAND, color: BRAND }}>
          Parcel
        </span>
        <h3 className="mt-2 text-2xl uppercase leading-tight text-[#2a1a08]" style={{ fontFamily: F.slab }}>
          {box.name}
        </h3>
        {box.description && <p className="mt-2 text-sm leading-relaxed text-[#3b2a14]">{box.description}</p>}
      </div>
      <div className="relative mt-5 flex items-end justify-between gap-3">
        <p className="rounded-[6px] bg-[#f6efe0] px-3 py-1 text-3xl text-[#2a1a08] shadow-[0_6px_12px_-8px_rgba(60,35,10,0.6)]" style={{ fontFamily: F.slab }}>
          {usd(box.pricePerLbCents)}
        </p>
        {box.extraRequired ? (
          <Link href="/Menu" className="rounded-xl bg-[#2a1a08] px-5 py-3 text-sm font-bold text-[#f3ead8]">
            Choose options
          </Link>
        ) : (
          <button
            type="button"
            disabled={state === "busy"}
            onClick={() => add(box.id, {}, box.name)}
            className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-[#f3ead8] transition-transform active:scale-95"
            style={{ background: state === "done" ? "#15803d" : "#2a1a08" }}
          >
            {state === "busy" ? <Loader2 className="h-4 w-4 animate-spin" /> : state === "done" ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
            {state === "done" ? "Added" : "Add parcel"}
          </button>
        )}
      </div>
    </article>
  );
}
