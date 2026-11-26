"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Loader2, Scale, ShoppingBag, Sparkles, Store, Truck } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/app/providers/CartProvider";
import type { Animal, MarketCut } from "@/lib/market";

// The Butcher counter. Raw cuts priced by the pound: pick a weight and how you
// want it cut, a butcher-scale readout shows the exact price, add to the same
// cart as the restaurant menu. Ready-made boxes sit on top.
// Colours: the restaurant's --brand, on a warm butcher-paper page.

const BRAND = "var(--brand, #c2410c)";
const INK = "#16120f";
const PAPER = "#f7f1e8";
const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export function MarketClient({ cuts, name, halal, preview }: { cuts: MarketCut[]; name: string; halal: boolean; preview: boolean }) {
  const reduce = useReducedMotion();
  const byWeight = cuts.filter((c) => c.weight);
  const boxes = cuts.filter((c) => !c.weight);
  const animals = useMemo(() => {
    const seen = new Set<Animal>();
    byWeight.forEach((c) => seen.add(c.animal));
    return ["All", ...seen] as ("All" | Animal)[];
  }, [byWeight]);
  const [filter, setFilter] = useState<"All" | Animal>("All");
  const shown = filter === "All" ? byWeight : byWeight.filter((c) => c.animal === filter);

  return (
    <div className="w-full pb-24 pt-24 md:pt-28" style={{ background: PAPER, color: INK }}>
      {/* Hero: dark counter with an ember glow in the brand colour */}
      <section className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="relative overflow-hidden rounded-[28px] px-6 py-10 text-white md:px-12 md:py-14" style={{ background: INK }}>
          <div aria-hidden className="pointer-events-none absolute -bottom-40 left-1/2 h-80 w-[120%] -translate-x-1/2 rounded-[100%] opacity-60 blur-3xl" style={{ background: BRAND }} />
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "repeating-linear-gradient(135deg, #fff 0 1px, transparent 1px 14px)" }} />
          <div className="relative max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: BRAND }}>
              {name} · The butcher counter
            </p>
            <motion.h1
              className="mt-4 font-display text-[clamp(2.4rem,6vw,4.4rem)] font-semibold leading-[1.02] tracking-[-0.02em]"
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Fresh cuts,
              <br />
              by the pound.
            </motion.h1>
            <p className="mt-4 max-w-[46ch] text-base text-white/75 md:text-lg">
              Pick your cut, choose how much, tell us how to cut it. We prepare it fresh and it&apos;s ready when you are.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-sm">
              {halal && <Chip icon={<Sparkles className="h-3.5 w-3.5" />}>Halal</Chip>}
              <Chip icon={<Scale className="h-3.5 w-3.5" />}>Cut to your weight</Chip>
              <Chip icon={<Store className="h-3.5 w-3.5" />}>Pickup</Chip>
              <Chip icon={<Truck className="h-3.5 w-3.5" />}>Delivery</Chip>
            </div>
          </div>
        </div>

        {preview && (
          <p className="mt-4 rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
            Preview prices. Your real price list goes here before launch.
          </p>
        )}
      </section>

      {/* Ready-made boxes */}
      {boxes.length > 0 && (
        <section className="mx-auto mt-12 max-w-6xl px-4 md:px-6">
          <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">Ready-made boxes</h2>
          <p className="mt-1 text-sm text-black/60">Packed and ready. One tap.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {boxes.map((b) => (
              <BoxCard key={b.id} box={b} />
            ))}
          </div>
        </section>
      )}

      {/* Cuts by the pound */}
      <section className="mx-auto mt-12 max-w-6xl px-4 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">Cuts by the pound</h2>
            <p className="mt-1 text-sm text-black/60">Prices are per pound. The scale shows exactly what you pay.</p>
          </div>
          {animals.length > 2 && (
            <div className="flex flex-wrap gap-1.5 rounded-full bg-black/[0.06] p-1">
              {animals.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setFilter(a)}
                  className="relative rounded-full px-4 py-2 text-sm font-semibold transition-colors"
                  style={{ color: filter === a ? "#fff" : INK }}
                >
                  {filter === a && <motion.span layoutId="market-filter" className="absolute inset-0 rounded-full" style={{ background: INK }} transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
                  <span className="relative">{a}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <motion.div layout className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {shown.map((c) => (
              <motion.div key={c.id} layout initial={reduce ? false : { opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.25 }}>
                <CutCard cut={c} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        <p className="mt-8 text-center text-xs text-black/50">We cut as close to your weight as we can. Need a special cut or a bigger order? Call us.</p>
      </section>
    </div>
  );
}

function Chip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 font-medium text-white/90 ring-1 ring-inset ring-white/15">
      {icon}
      {children}
    </span>
  );
}

// A round butcher's stamp with the animal on it.
function Stamp({ animal }: { animal: Animal }) {
  return (
    <span className="grid h-16 w-16 shrink-0 -rotate-6 place-items-center rounded-full border-2 border-dashed text-[9.5px] font-black uppercase tracking-[0.06em]" style={{ borderColor: BRAND, color: BRAND }}>
      {animal}
    </span>
  );
}

function useAdd() {
  const { mutate } = useCart();
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  async function add(productId: string, sides: Record<string, string>, label: string) {
    setState("busy");
    try {
      const res = await fetch("/api/cart/add", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, quantity: 1, sides }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) throw new Error(data.message || "Couldn't add it");
      await mutate();
      toast.success(`${label} added to your order`);
      setState("done");
      setTimeout(() => setState("idle"), 1600);
    } catch (e) {
      toast.error((e as Error).message);
      setState("idle");
    }
  }
  return { state, add };
}

function AddButton({ state, onClick, children }: { state: "idle" | "busy" | "done"; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={state === "busy"}
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-70"
      style={{ background: state === "done" ? "#15803d" : BRAND }}
    >
      {state === "busy" ? <Loader2 className="h-4 w-4 animate-spin" /> : state === "done" ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
      {state === "done" ? "Added" : children}
    </button>
  );
}

function CutCard({ cut }: { cut: MarketCut }) {
  const weights = cut.weight!.options;
  const [w, setW] = useState(() => weights.find((o) => o.lb === 2)?.id ?? weights[Math.min(1, weights.length - 1)]?.id ?? weights[0]?.id);
  const [s, setS] = useState(() => cut.style?.options[0]?.id ?? null);
  const { state, add } = useAdd();
  const wOpt = weights.find((o) => o.id === w) ?? weights[0];
  const sOpt = cut.style?.options.find((o) => o.id === s) ?? null;
  const total = cut.pricePerLbCents + (wOpt?.priceInCents ?? 0) + (sOpt?.priceInCents ?? 0);
  const lb = wOpt?.lb ?? 1;

  return (
    <article className="flex h-full flex-col rounded-3xl bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.04),0_12px_30px_-18px_rgba(22,18,15,0.35)] ring-1 ring-black/[0.06]">
      <div className="flex items-start gap-3">
        {cut.image ? (
          <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-black/5">
            <Image src={cut.image} alt={cut.name} fill sizes="56px" className="object-cover" />
          </span>
        ) : (
          <Stamp animal={cut.animal} />
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-semibold leading-tight">{cut.name}</h3>
          <p className="mt-0.5 text-sm font-semibold" style={{ color: BRAND }}>
            {usd(cut.pricePerLbCents)} <span className="font-medium text-black/50">/ lb</span>
          </p>
        </div>
      </div>
      {cut.description && <p className="mt-3 text-sm leading-relaxed text-black/60">{cut.description}</p>}

      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">How much</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {weights.map((o) => (
          <Pill key={o.id} on={o.id === w} onClick={() => setW(o.id)}>
            {o.label}
          </Pill>
        ))}
      </div>

      {cut.style && cut.style.options.length > 1 && (
        <>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">How to cut it</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {cut.style.options.map((o) => (
              <Pill key={o.id} on={o.id === s} onClick={() => setS(o.id)} quiet>
                {o.label}
              </Pill>
            ))}
          </div>
        </>
      )}

      <div className="mt-auto">
        {/* the butcher-scale readout */}
        <div className="mt-5 flex items-center justify-between rounded-2xl px-4 py-3 font-mono" style={{ background: "#0f1310", color: "#9cf5a6", boxShadow: "inset 0 2px 10px rgba(0,0,0,0.6)" }}>
          <span className="flex items-baseline gap-1.5 text-lg tabular-nums">
            <Roll value={lb.toFixed(2)} />
            <span className="text-xs opacity-70">LB</span>
          </span>
          <span className="text-xl font-semibold tabular-nums">
            <Roll value={usd(total)} />
          </span>
        </div>
        {cut.extraRequired ? (
          <Link href="/Menu" className="mt-4 flex w-full items-center justify-center rounded-2xl py-3.5 text-[15px] font-semibold text-white" style={{ background: BRAND }}>
            Choose options on the menu
          </Link>
        ) : (
          <AddButton
            state={state}
            onClick={() =>
              add(
                cut.id,
                { [cut.weight!.groupId]: wOpt.id, ...(cut.style && sOpt ? { [cut.style.groupId]: sOpt.id } : {}) },
                `${wOpt.label} ${cut.name}`,
              )
            }
          >
            Add {wOpt.label} · {usd(total)}
          </AddButton>
        )}
      </div>
    </article>
  );
}

function BoxCard({ box }: { box: MarketCut }) {
  const { state, add } = useAdd();
  return (
    <article className="relative flex flex-col overflow-hidden rounded-3xl p-6 text-white" style={{ background: INK }}>
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-40 blur-2xl" style={{ background: BRAND }} />
      <span className="relative w-fit rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]" style={{ background: BRAND }}>
        Box
      </span>
      <h3 className="relative mt-3 font-display text-2xl font-semibold leading-tight">{box.name}</h3>
      {box.description && <p className="relative mt-2 text-sm leading-relaxed text-white/70">{box.description}</p>}
      <div className="relative mt-auto flex items-end justify-between gap-4 pt-5">
        <p className="font-display text-3xl font-semibold">{usd(box.pricePerLbCents)}</p>
        {box.extraRequired ? (
          <Link href="/Menu" className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold" style={{ color: INK }}>
            Choose options
          </Link>
        ) : (
          <button
            type="button"
            disabled={state === "busy"}
            onClick={() => add(box.id, {}, box.name)}
            className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold transition-transform active:scale-95"
            style={{ color: state === "done" ? "#15803d" : INK }}
          >
            {state === "busy" ? <Loader2 className="h-4 w-4 animate-spin" /> : state === "done" ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
            {state === "done" ? "Added" : "Add box"}
          </button>
        )}
      </div>
    </article>
  );
}

function Pill({ on, onClick, quiet, children }: { on: boolean; onClick: () => void; quiet?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className="rounded-full px-3.5 py-2 text-sm font-semibold ring-1 ring-inset transition-all active:scale-95"
      style={
        on
          ? { background: quiet ? INK : BRAND, color: "#fff", boxShadow: "0 6px 14px -8px rgba(0,0,0,0.5)", borderColor: "transparent" }
          : { background: "#fff", color: INK, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.12)" }
      }
    >
      {children}
    </button>
  );
}

// Digits roll when the value changes, like a scale settling.
function Roll({ value }: { value: string }) {
  const reduce = useReducedMotion();
  return (
    <span className="relative inline-flex overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={reduce ? false : { y: "70%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { y: "-70%", opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
