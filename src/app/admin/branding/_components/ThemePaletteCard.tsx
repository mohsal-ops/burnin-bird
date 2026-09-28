"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateThemePalette } from "../_actions/brandingActions";
import { THEME_PALETTES, isHex6, onColor, type Palette, type PaletteRole } from "@/lib/themes/palette";
import type { ThemeSlug } from "@/lib/themes/registry";

// "Design colours" — the active design's own palette (Diner: golden/chocolate/
// cream, Elegant: gold/ink/paper, Smash: ink/hero panel). A live miniature of
// that design's hero repaints as you pick, curated combos give one-click looks,
// and the brand colour can be pulled in as the accent.

const COMBOS: Partial<Record<ThemeSlug, { name: string; p: Palette }[]>> = {
  "diner-classic": [
    { name: "Grilled cheese", p: { accent: "#FCB931", ink: "#3B2517", paper: "#F9F4ED" } },
    { name: "Ketchup", p: { accent: "#E4412B", ink: "#2A1712", paper: "#FFF4E8" } },
    { name: "Pistachio", p: { accent: "#9DC45F", ink: "#23331A", paper: "#F6F7EC" } },
    { name: "Bubblegum", p: { accent: "#F59BB8", ink: "#3A1D2B", paper: "#FFF3F6" } },
    { name: "Blue plate", p: { accent: "#5AA9E6", ink: "#14263D", paper: "#F2F7FC" } },
  ],
  "refined-elegant": [
    { name: "Soft gold", p: { accent: "#FFD469", ink: "#0F0606", paper: "#FFFFFF" } },
    { name: "Champagne", p: { accent: "#E9D6B0", ink: "#1A1714", paper: "#FBF8F3" } },
    { name: "Bordeaux", p: { accent: "#C9A26B", ink: "#2A0B12", paper: "#FFFFFF" } },
    { name: "Olive grove", p: { accent: "#D8C77A", ink: "#16190F", paper: "#FAFAF5" } },
    { name: "Midnight", p: { accent: "#B9C7E8", ink: "#0B1020", paper: "#FFFFFF" } },
  ],
  "smash-bold": [
    { name: "Concrete", p: { ink: "#111315", panel: "#EEF1F0" } },
    { name: "Butcher paper", p: { ink: "#1B1410", panel: "#F1E7DA" } },
    { name: "Mint", p: { ink: "#0F1A17", panel: "#E2F1EA" } },
    { name: "Blush", p: { ink: "#1C1215", panel: "#F6E6E6" } },
  ],
};

function Mini({ slug, p, brand, name }: { slug: ThemeSlug; p: Palette; brand: string; name: string }) {
  const accent = p.accent ?? brand;
  const ink = p.ink ?? "#111";
  const paper = p.paper ?? "#fff";
  if (slug === "diner-classic") {
    return (
      <div className="overflow-hidden rounded-xl border border-stone-200" style={{ background: paper }}>
        <div className="flex h-7 items-center justify-between px-3" style={{ background: ink }}>
          <span className="text-[13px] leading-none" style={{ fontFamily: "var(--font-script), cursive", color: accent }}>{name}</span>
          <span className="rounded-[3px] px-2 py-0.5 text-[8px] font-extrabold" style={{ background: accent, color: onColor(accent, ink), boxShadow: `2px 2px 0 ${paper}` }}>order now</span>
        </div>
        <div className="relative flex h-28 flex-col items-center justify-center" style={{ background: accent }}>
          <span className="-rotate-6 text-4xl leading-none" style={{ fontFamily: "var(--font-script), cursive", color: paper, textShadow: `0 3px 0 ${ink}22` }}>Yummm!</span>
          <div className="mt-2 flex gap-2">
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-7 rounded-full" style={{ background: `radial-gradient(circle at 35% 35%, #fff8 0 18%, ${ink}cc 19% 100%)` }} />
            ))}
          </div>
          <div className="absolute inset-x-0 bottom-0 translate-y-full">
            {[6, 22, 41, 63, 84].map((x, i) => (
              <span key={x} className="absolute top-0 rounded-b-full" style={{ left: `${x}%`, width: 10, height: [18, 10, 24, 12, 16][i], background: accent }} />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 pb-3 pt-7">
          <span className="h-1 flex-1" style={{ backgroundImage: `radial-gradient(circle, ${ink} 1px, transparent 1.4px)`, backgroundSize: "6px 4px" }} />
          <span className="text-lg leading-none" style={{ fontFamily: "var(--font-script), cursive", color: ink }}>Menu</span>
          <span className="h-1 flex-1" style={{ backgroundImage: `radial-gradient(circle, ${ink} 1px, transparent 1.4px)`, backgroundSize: "6px 4px" }} />
        </div>
      </div>
    );
  }
  if (slug === "refined-elegant") {
    return (
      <div className="overflow-hidden rounded-xl border border-stone-200" style={{ background: paper }}>
        <div className="relative flex h-32 flex-col items-center justify-center gap-2" style={{ background: `radial-gradient(ellipse at 50% 30%, ${ink}aa, ${ink})` }}>
          <span className="absolute left-3 top-2 text-[8px] font-semibold tracking-[0.25em] text-white/90">{name.toUpperCase()}</span>
          <span className="text-center text-xl font-bold uppercase leading-none tracking-wide text-white" style={{ fontFamily: "var(--font-stencil), sans-serif" }}>Doors<br />are open</span>
          <span className="rounded-full px-3 py-1 text-[8px] font-semibold uppercase tracking-[0.12em]" style={{ background: accent, color: onColor(accent, ink) }}>Order online</span>
        </div>
        <div className="space-y-1.5 px-4 py-3">
          {["Burrata", "Tagliatelle"].map((d) => (
            <div key={d} className="flex items-baseline gap-2 text-[9px] font-semibold uppercase tracking-[0.14em]" style={{ color: ink }}>
              {d}
              <span className="flex-1 border-b border-dotted" style={{ borderColor: `${ink}44` }} />
              <span style={{ color: accent === "#FFFFFF" ? ink : accent, filter: "brightness(0.8)" }}>$18</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  // smash-bold
  const panel = p.panel ?? "#EEF1F0";
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-2">
      <div className="relative flex h-36 items-center justify-between overflow-hidden rounded-lg px-4" style={{ background: `radial-gradient(ellipse at 60% 45%, ${panel}, color-mix(in srgb, ${panel} 88%, #000))` }}>
        <div>
          <p className="text-[9px] font-bold" style={{ color: ink, fontFamily: "var(--font-caveat), cursive" }}>since forever</p>
          <p className="text-2xl font-extrabold uppercase leading-[0.9] tracking-tight" style={{ color: ink }}>{name.split(" ")[0]}<br />smash</p>
        </div>
        <span className="grid size-16 animate-[spin_12s_linear_infinite] place-items-center rounded-full text-[8px] font-black uppercase" style={{ background: ink, color: panel }}>★ order ★</span>
        <span className="absolute bottom-2 right-3 rounded-md px-2 py-1 text-[9px] font-black uppercase" style={{ background: brand, color: onColor(brand, "#000000") }}>brand</span>
      </div>
    </div>
  );
}

export default function ThemePaletteCard({
  slug,
  label,
  initial,
  brand,
  restaurant,
}: {
  slug: ThemeSlug;
  label: string;
  initial: Palette;
  brand: string;
  restaurant: string;
}) {
  const slots = THEME_PALETTES[slug] ?? [];
  const [p, setP] = useState<Palette>(initial);
  const [saving, start] = useTransition();
  const set = (role: PaletteRole, v: string) => setP((cur) => ({ ...cur, [role]: v }));
  const dirty = slots.some((s) => (p[s.role] ?? "").toLowerCase() !== (initial[s.role] ?? "").toLowerCase());

  const save = (next: Palette, msg = "Design colours saved") =>
    start(async () => {
      const bad = slots.find((s) => next[s.role] && !isHex6(next[s.role]));
      if (bad) return void toast.error(`“${bad.label}” needs a 6-digit hex like #FCB931`);
      const res = await updateThemePalette(slug, next as Record<string, string>);
      if (res.ok) toast.success(msg);
      else toast.error(res.error ?? "Failed to save");
    });

  const reset = () => {
    const d: Palette = {};
    slots.forEach((s) => (d[s.role] = s.default));
    setP(d);
    save({}, "Back to the original colours");
  };

  return (
    <div className="space-y-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-stone-800">Design colours</h2>
          <p className="text-sm text-stone-500">
            The colours of your <span className="font-medium text-stone-700">{label}</span> design. The preview repaints as you pick.
          </p>
        </div>
        <button type="button" onClick={reset} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 transition hover:bg-stone-50 disabled:opacity-50">
          <RotateCcw size={13} /> Original colours
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="md:sticky md:top-4 md:self-start">
          <Mini slug={slug} p={p} brand={brand} name={restaurant} />
        </div>

        <div className="space-y-4">
          {slots.map((s) => (
            <div key={s.role} className="flex items-center gap-3">
              <label className="relative size-11 shrink-0 cursor-pointer overflow-hidden rounded-xl ring-1 ring-stone-200 transition hover:scale-105" style={{ background: p[s.role] }}>
                <input type="color" value={isHex6(p[s.role]) ? p[s.role] : s.default} onChange={(e) => set(s.role, e.target.value.toUpperCase())} className="absolute inset-0 cursor-pointer opacity-0" aria-label={`Pick ${s.label}`} />
              </label>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-stone-800">{s.label}</span>
                  {s.role === "accent" && (
                    <button type="button" onClick={() => set("accent", brand.toUpperCase())} className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600 hover:bg-stone-200" title="Use your brand colour">
                      <Sparkles size={10} /> brand colour
                    </button>
                  )}
                </div>
                <p className="truncate text-xs text-stone-400">{s.hint}</p>
              </div>
              <input value={p[s.role] ?? ""} onChange={(e) => set(s.role, e.target.value.trim())} aria-label={`${s.label} hex`} className="w-24 rounded-lg border border-stone-200 px-2 py-1.5 text-xs uppercase outline-none focus:ring-2 focus:ring-stone-300" />
            </div>
          ))}

          {COMBOS[slug] && (
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-stone-400">Quick looks</p>
              <div className="flex flex-wrap gap-2">
                {COMBOS[slug]!.map((c) => (
                  <button key={c.name} type="button" onClick={() => setP((cur) => ({ ...cur, ...c.p }))} className="group flex items-center gap-2 rounded-full border border-stone-200 py-1 pl-1 pr-3 text-xs text-stone-600 transition hover:border-stone-400">
                    <span className="flex -space-x-1.5">
                      {slots.map((s) => (
                        <span key={s.role} className="size-5 rounded-full ring-2 ring-white" style={{ background: c.p[s.role] ?? s.default }} />
                      ))}
                    </span>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button variant="mainButton" disabled={saving || !dirty} onClick={() => save(p)}>
            {saving ? "Saving..." : dirty ? "Save design colours" : "Saved"}
          </Button>
        </div>
      </div>
    </div>
  );
}
