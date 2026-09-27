"use client";

import { useMemo, useRef, useState, useTransition, type ChangeEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Check, ExternalLink, ImagePlus, Sparkles, Upload, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setSiteImagePreset, updateSiteImage, updateThemeWords } from "@/app/admin/images/_actions/imageActions";
import { MASCOT_PRESETS, THEME_MEDIA, type MediaSlot, type ThemeWord } from "@/lib/themes/mediaSlots";
import type { ThemeSlug } from "@/lib/themes/registry";
import { ThemeMap } from "./ThemeMap";
import { MASCOTS, fitCq } from "@/app/(customerFacing)/_components/themes/SmashHero";

// Theme-aware Media studio. Shows ONLY the photo spots the site's current
// design really uses, numbered, next to a live miniature of the homepage in
// that design. Theme extras live here too: the Smash & Bold 3D-mascot picker
// and each design's signature words, previewed live in the design's own type.

type Row = { key: string; url: string; label: string };
type Dish = { id: string; name: string; image: string | null };

const THEME_LABEL: Record<ThemeSlug, string> = {
  "classic-starvega": "Classic",
  "smash-bold": "Smash & Bold",
  "diner-classic": "Diner Classic",
  "refined-elegant": "Refined",
};
const THEME_SWATCH: Record<ThemeSlug, [string, string]> = {
  "classic-starvega": ["#ffffff", "#f97316"],
  "smash-bold": ["#eef1f0", "#111315"],
  "diner-classic": ["#fcb931", "#3b2517"],
  "refined-elegant": ["#0f0606", "#ffd469"],
};

function useUpload(key: string, label: string, onSaved: (url: string) => void) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);
  const pick = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };
  const cancel = () => {
    setFile(null);
    setPreview(null);
    if (input.current) input.current.value = "";
  };
  const save = () => {
    if (!file) return;
    const fd = new FormData();
    fd.set("image", file);
    start(async () => {
      const res = await updateSiteImage(key, fd);
      if (res.ok && res.url) {
        toast.success(`${label} updated`);
        onSaved(res.url);
        cancel();
      } else toast.error(res.error ?? "Couldn't save the image");
    });
  };
  return { preview, file, pending, input, pick, cancel, save };
}

function SlotCard({ slot, n, url, fallbackUrl, fallbackLabel, active, onHover, onSaved }: {
  slot: MediaSlot; n: number; url: string | null; fallbackUrl: string | null; fallbackLabel?: string;
  active: boolean; onHover: (k: string | null) => void; onSaved: (url: string) => void;
}) {
  const u = useUpload(slot.key, slot.label, onSaved);
  const shown = u.preview ?? url ?? fallbackUrl;
  const usingFallback = !u.preview && !url && !!fallbackUrl;
  return (
    <div
      id={`slot-${slot.key}`}
      onMouseEnter={() => onHover(slot.key)}
      onMouseLeave={() => onHover(null)}
      className={`scroll-mt-24 overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 ${active ? "border-[#c85a1e] shadow-[0_12px_30px_-12px_rgba(200,90,30,0.45)]" : "border-stone-200"}`}
    >
      <div className="grid gap-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="relative aspect-[16/10] bg-stone-100 sm:aspect-auto sm:min-h-[180px]">
          {shown ? (
            <Image src={shown} alt={slot.label} fill sizes="(max-width: 640px) 100vw, 360px" className="object-cover" unoptimized={!!u.preview} />
          ) : (
            <div className="grid h-full place-items-center text-xs text-stone-400">No photo yet</div>
          )}
          <span className={`absolute left-3 top-3 grid size-8 place-items-center rounded-full text-sm font-bold shadow ring-2 ring-white transition-transform ${active ? "scale-110 bg-[#c85a1e] text-white" : "bg-white text-stone-800"}`}>{n}</span>
          {u.preview && <span className="absolute right-3 top-3 rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-semibold text-white shadow">Unsaved</span>}
          {usingFallback && (
            <span className="absolute inset-x-3 bottom-3 rounded-lg bg-black/65 px-2.5 py-1.5 text-[11px] leading-snug text-white backdrop-blur">
              Showing your <b>{fallbackLabel ?? "default"}</b> photo until you pick one here.
            </span>
          )}
        </div>
        <div className="flex flex-col gap-3 p-4">
          <div>
            <p className="font-semibold text-stone-800">{slot.label}</p>
            <p className="mt-1 text-xs leading-relaxed text-stone-500">{slot.where}</p>
          </div>
          {slot.tip && (
            <p className="flex gap-2 rounded-lg bg-stone-50 p-2.5 text-xs leading-snug text-stone-600">
              <Sparkles size={14} className="mt-0.5 shrink-0 text-[#c85a1e]" />
              {slot.tip}
            </p>
          )}
          <input ref={u.input} type="file" accept="image/*" className="hidden" onChange={u.pick} />
          <div className="mt-auto flex flex-wrap gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => u.input.current?.click()}>
              <ImagePlus size={14} /> {u.file ? "Choose another" : url ? "Change photo" : "Add photo"}
            </Button>
            {u.file && (
              <>
                <Button variant="mainButton" size="sm" disabled={u.pending} onClick={u.save}>{u.pending ? "Saving..." : "Save"}</Button>
                <Button variant="ghost" size="sm" disabled={u.pending} onClick={u.cancel}>Cancel</Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MascotCard({ slot, n, value, autoSrc, sub, brand, active, onHover, onSaved }: {
  slot: MediaSlot; n: number; value: string | null; autoSrc: string; sub: string; brand: string; active: boolean;
  onHover: (k: string | null) => void; onSaved: (url: string) => void;
}) {
  const [pending, start] = useTransition();
  const u = useUpload(slot.key, "Mascot", onSaved);
  const current = value ?? "auto";
  const isCustom = current !== "auto" && !MASCOT_PRESETS.some((p) => p.src === current);
  const shown = u.preview ?? (current === "auto" ? autoSrc : current);
  const choose = (url: string) =>
    start(async () => {
      const res = await setSiteImagePreset(slot.key, url);
      if (res.ok) {
        toast.success("Mascot updated");
        onSaved(url);
      } else toast.error(res.error ?? "Couldn't save");
    });

  return (
    <div
      id={`slot-${slot.key}`}
      onMouseEnter={() => onHover(slot.key)}
      onMouseLeave={() => onHover(null)}
      className={`scroll-mt-24 overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 ${active ? "border-[#c85a1e] shadow-[0_12px_30px_-12px_rgba(200,90,30,0.45)]" : "border-stone-200"}`}
    >
      <div className="relative bg-[radial-gradient(ellipse_at_60%_45%,#f4f6f5,#d6dad8)]">
        <div className="relative mx-auto aspect-[1200/896] max-w-md">
          <Image key={shown} src={shown} alt="Mascot" fill sizes="448px" className="animate-[mascotIn_0.6s_cubic-bezier(0.34,1.56,0.64,1)] object-contain" unoptimized={!!u.preview} />
          {/* your brand printed on the box + the brand card, exactly like the live hero */}
          {(() => {
            const preset = Object.values(MASCOTS).find((m) => m.src === shown);
            if (!preset || u.preview) return null;
            return (
              <>
                {preset.face && (
                  <span key={shown + "f"} className="absolute -translate-x-1/2 -translate-y-1/2 animate-[mascotIn_0.7s_ease_0.15s_both] text-center text-[#111315]" style={{ left: preset.face.left, top: preset.face.top, width: preset.face.width, containerType: "inline-size" }}>
                    <span className="inline-block -rotate-3 whitespace-nowrap leading-none" style={{ fontFamily: "var(--font-balloon), system-ui", fontSize: fitCq(sub, "1.7rem") }}>{sub}</span>
                  </span>
                )}
                <span key={shown + "c"} className="absolute bottom-[8%] left-[38%] grid aspect-[1.6] w-[26%] -rotate-6 animate-[mascotIn_0.7s_cubic-bezier(0.34,1.56,0.64,1)_0.3s_both] place-items-center rounded-md text-white shadow-lg" style={{ background: brand }}>
                  <span className="w-[88%] text-center" style={{ containerType: "inline-size" }}>
                    <span className="whitespace-nowrap" style={{ fontFamily: "var(--font-balloon), system-ui", fontSize: fitCq(sub, "1.3rem") }}>{sub}</span>
                  </span>
                </span>
              </>
            );
          })()}
        </div>
        <span className={`absolute left-3 top-3 grid size-8 place-items-center rounded-full text-sm font-bold shadow ring-2 ring-white ${active ? "bg-[#c85a1e] text-white" : "bg-white text-stone-800"}`}>{n}</span>
        <span className="absolute right-3 top-3 rounded-full bg-[#111315] px-2.5 py-1 text-[11px] font-semibold text-white">
          {u.preview ? "Unsaved upload" : current === "auto" ? "Auto · matches your food" : isCustom ? "Your own mascot" : "Chosen"}
        </span>
      </div>
      <style>{`@keyframes mascotIn{from{opacity:0;transform:translateY(14px) scale(.94)}to{opacity:1;transform:none}}`}</style>
      <div className="space-y-3 p-4">
        <div>
          <p className="font-semibold text-stone-800">{slot.label}</p>
          <p className="mt-1 text-xs leading-relaxed text-stone-500">{slot.where}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <button
            type="button"
            disabled={pending}
            onClick={() => choose("auto")}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-2 text-center transition ${current === "auto" ? "border-[#c85a1e] bg-[#c85a1e]/5" : "border-stone-200 hover:border-stone-400"}`}
          >
            <Wand2 size={18} className="text-[#c85a1e]" />
            <span className="text-[11px] font-semibold text-stone-700">Auto</span>
            <span className="text-[10px] leading-tight text-stone-400">fits your menu</span>
          </button>
          {MASCOT_PRESETS.map((p) => {
            const on = current === p.src;
            return (
              <button
                key={p.id}
                type="button"
                disabled={pending}
                onClick={() => choose(p.src)}
                className={`group relative overflow-hidden rounded-xl border bg-[#eef1f0] transition ${on ? "border-[#c85a1e] ring-2 ring-[#c85a1e]/30" : "border-stone-200 hover:border-stone-400"}`}
              >
                <div className="relative aspect-[1200/896]">
                  <Image src={p.src} alt={p.label} fill sizes="120px" className="object-contain transition-transform duration-300 group-hover:scale-110" />
                </div>
                <p className="bg-white px-1 py-1 text-[10px] font-semibold text-stone-700">{p.label}</p>
                {on && <Check size={14} className="absolute right-1.5 top-1.5 rounded-full bg-[#c85a1e] p-0.5 text-white" />}
              </button>
            );
          })}
        </div>
        {slot.tip && <p className="text-xs leading-snug text-stone-500">{slot.tip}</p>}
        <input ref={u.input} type="file" accept="image/*" className="hidden" onChange={u.pick} />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" type="button" onClick={() => u.input.current?.click()}>
            <Upload size={14} /> Upload my own
          </Button>
          {u.file && (
            <>
              <Button variant="mainButton" size="sm" disabled={u.pending} onClick={u.save}>{u.pending ? "Saving..." : "Save"}</Button>
              <Button variant="ghost" size="sm" disabled={u.pending} onClick={u.cancel}>Cancel</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Live preview of each signature word in the design's own look.
function WordPreview({ theme, w, value, bg }: { theme: ThemeSlug; w: ThemeWord; value: string; bg: string | null }) {
  const text = w.upper ? value.toUpperCase() : value;
  if (theme === "diner-classic") {
    return (
      <div className="relative grid h-32 place-items-center overflow-hidden rounded-xl bg-[#fcb931]">
        <span className="-rotate-6 px-4 text-center text-5xl leading-none text-[#f9f4ed] drop-shadow-[0_4px_0_rgba(59,37,23,0.15)]" style={{ fontFamily: w.font }}>{text || "Yuuum!"}</span>
        <div className="absolute inset-x-0 bottom-0 flex justify-around">{[5, 3, 7, 4, 6].map((h, i) => <span key={i} className="w-4 rounded-b-full bg-[#f9f4ed]" style={{ height: h * 2 }} />)}</div>
      </div>
    );
  }
  if (theme === "refined-elegant") {
    return (
      <div className="relative grid h-32 place-items-center overflow-hidden rounded-xl bg-[#0f0606]">
        {bg && <Image src={bg} alt="" fill sizes="480px" className="object-cover opacity-50" />}
        <span className="relative px-4 text-center text-3xl leading-tight text-white" style={{ fontFamily: w.font }}>{text || "NEIGHBORHOOD KITCHEN"}</span>
      </div>
    );
  }
  return (
    <div className="grid h-32 place-items-center rounded-xl bg-[radial-gradient(ellipse_at_60%_45%,#f4f6f5,#d6dad8)]">
      <span className="-rotate-3 text-6xl leading-none text-[#111315]" style={{ fontFamily: w.font }}>{text || "BRAND"}</span>
    </div>
  );
}

function WordsCard({ theme, words, initial, bg }: { theme: ThemeSlug; words: ThemeWord[]; initial: Record<string, string>; bg: string | null }) {
  const [vals, setVals] = useState<Record<string, string>>(initial);
  const [pending, start] = useTransition();
  const dirty = words.some((w) => (vals[w.key] ?? "") !== (initial[w.key] ?? ""));
  return (
    <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      {words.map((w) => (
        <div key={w.key} className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-semibold text-stone-800">{w.label}</p>
            <span className="text-[11px] text-stone-400">{(vals[w.key] ?? "").length}/{w.max}</span>
          </div>
          <p className="text-xs leading-relaxed text-stone-500">{w.hint}</p>
          <WordPreview theme={theme} w={w} value={vals[w.key] ?? ""} bg={bg} />
          <input
            value={vals[w.key] ?? ""}
            maxLength={w.max}
            placeholder="Leave empty for the automatic one"
            onChange={(e) => setVals((v) => ({ ...v, [w.key]: e.target.value }))}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#c85a1e] focus:ring-2 focus:ring-[#c85a1e]/20"
          />
        </div>
      ))}
      <Button
        variant="mainButton"
        size="sm"
        disabled={!dirty || pending}
        onClick={() =>
          start(async () => {
            const res = await updateThemeWords(vals);
            if (res.ok) toast.success("Saved — it's live on your homepage");
            else toast.error(res.error ?? "Couldn't save");
          })
        }
      >
        {pending ? "Saving..." : "Save words"}
      </Button>
    </div>
  );
}

export default function ThemeMediaStudio({
  theme, rows, dishes, words, name, brand, autoMascot, defaults, gallery = [],
}: {
  theme: ThemeSlug; rows: Row[]; dishes: Dish[]; words: Record<string, string>; name: string; brand: string; gallery?: string[];
  autoMascot: string; defaults: { sub: string; heroWord: string; headline: string };
}) {
  const spec = THEME_MEDIA[theme];
  const [urls, setUrls] = useState<Record<string, string>>(() => Object.fromEntries(rows.map((r) => [r.key, r.url])));
  const [active, setActive] = useState<string | null>(null);
  const labelOf = useMemo(() => Object.fromEntries(rows.map((r) => [r.key, r.label])), [rows]);
  const num = (k: string) => spec.slots.findIndex((s) => s.key === k) + 1;
  const effective = (k: string) => {
    if (k === "smash_mascot") {
      const v = urls[k];
      return !v || v === "auto" ? autoMascot : v;
    }
    const s = spec.slots.find((x) => x.key === k);
    return urls[k] || (s?.fallback ? urls[s.fallback] : undefined) || null;
  };
  const [sw1, sw2] = THEME_SWATCH[theme];

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)]">
      {/* live map */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-2 border-b border-stone-100 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className="flex size-5 overflow-hidden rounded-full ring-1 ring-black/10">
                <span className="w-1/2" style={{ background: sw1 }} />
                <span className="w-1/2" style={{ background: sw2 }} />
              </span>
              <p className="text-sm font-semibold text-stone-800">{THEME_LABEL[theme]} design</p>
            </div>
            <a href="/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-[#c85a1e] hover:underline">
              Live site <ExternalLink size={12} />
            </a>
          </div>
          <div className="max-h-[70vh] overflow-y-auto">
            <ThemeMap
              d={{
                theme,
                name: name.toUpperCase(),
                img: effective,
                num,
                dishes: dishes.map((x) => x.image).filter(Boolean) as string[],
                words: {
                  sub: (words.theme_subbrand || defaults.sub).toUpperCase(),
                  heroWord: words.theme_heroword || defaults.heroWord,
                  headline: (words.theme_headline || defaults.headline).toUpperCase(),
                },
                brand,
                gallery,
              }}
              active={active}
              onHover={setActive}
            />
          </div>
          <p className="border-t border-stone-100 px-3 py-2 text-[11px] leading-snug text-stone-500">
            Your homepage in miniature. Numbers match the photo cards — hover or tap one to find it.
          </p>
        </div>
      </aside>

      {/* slots */}
      <div className="space-y-4">
        {spec.slots.map((s) =>
          s.kind === "mascot" ? (
            <MascotCard key={s.key} slot={s} n={num(s.key)} value={urls[s.key] ?? null} autoSrc={autoMascot} sub={(words.theme_subbrand || defaults.sub).toUpperCase()} brand={brand} active={active === s.key} onHover={setActive} onSaved={(url) => setUrls((u) => ({ ...u, [s.key]: url }))} />
          ) : (
            <SlotCard
              key={s.key}
              slot={s}
              n={num(s.key)}
              url={urls[s.key] || null}
              fallbackUrl={s.fallback ? urls[s.fallback] || null : null}
              fallbackLabel={s.fallback ? labelOf[s.fallback] : undefined}
              active={active === s.key}
              onHover={setActive}
              onSaved={(url) => setUrls((u) => ({ ...u, [s.key]: url }))}
            />
          ),
        )}

        {spec.dishesNote && (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4">
            <p className="font-semibold text-stone-800">Dish photos</p>
            <p className="mt-1 text-xs leading-relaxed text-stone-500">{spec.dishesNote}</p>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {dishes.length === 0 && <p className="text-xs text-stone-400">No featured dishes yet.</p>}
              {dishes.map((x) => (
                <div key={x.id} className="w-24 shrink-0">
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-white ring-1 ring-stone-200">
                    {x.image ? <Image src={x.image} alt={x.name} fill sizes="96px" className="object-cover" /> : <span className="grid h-full place-items-center text-[10px] text-stone-400">no photo</span>}
                  </div>
                  <p className="mt-1 truncate text-[11px] text-stone-600">{x.name}</p>
                </div>
              ))}
            </div>
            <Link href="/admin/menuItems" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#c85a1e] hover:underline">
              Change dish photos in Menu items <ExternalLink size={12} />
            </Link>
          </div>
        )}

        {spec.words.length > 0 && (
          <div className="space-y-2 pt-2">
            <p className="px-1 text-xs font-semibold uppercase tracking-wide text-stone-400">Signature words</p>
            <WordsCard theme={theme} words={spec.words} initial={words} bg={effective("elegant_hero")} />
          </div>
        )}
      </div>
    </div>
  );
}
