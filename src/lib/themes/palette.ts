// Per-theme colour palettes the OWNER can edit (admin → Branding → "Design
// colours"). Each bespoke theme names its own roles (Diner = golden / chocolate /
// cream, Elegant = gold / ink, Smash = ink / hero panel); the defaults are the
// reference palettes, and a site only differs once the owner saves a change.
//
// Storage: one SiteSetting `theme_palette` = JSON { [themeSlug]: { role: hex } },
// so switching designs keeps each design's colours. The root layout injects the
// ACTIVE theme's palette as `--tp-*` CSS vars, which the bespoke homes/navs read
// instead of hard-coded hex. Customised colours also re-tint that theme's shared
// tokens (--primary, --background…) so the menu/other pages follow along.
import type { ThemeSlug } from "./registry";

export type PaletteRole = "accent" | "ink" | "paper" | "panel";

export type PaletteSlot = {
  role: PaletteRole;
  label: string; // owner-facing name
  hint: string; // where it shows up
  default: string;
};

export const THEME_PALETTES: Partial<Record<ThemeSlug, PaletteSlot[]>> = {
  "diner-classic": [
    { role: "accent", label: "Golden", hint: "Hero, buttons, melting drips, reviews band", default: "#FCB931" },
    { role: "ink", label: "Chocolate", hint: "Top bar, headings, receipt banners, plates", default: "#3B2517" },
    { role: "paper", label: "Cream", hint: "Page background, button text", default: "#F9F4ED" },
  ],
  "refined-elegant": [
    { role: "accent", label: "Gold", hint: "Order pill, active link, stars, hovers", default: "#FFD469" },
    { role: "ink", label: "Ink", hint: "Hero, top bar, dark photo bands", default: "#0F0606" },
    { role: "paper", label: "Paper", hint: "Page background behind the menu & reviews", default: "#FFFFFF" },
  ],
  "smash-bold": [
    { role: "ink", label: "Ink", hint: "Headlines, badges, the location slide", default: "#111315" },
    { role: "panel", label: "Hero panel", hint: "The big rounded hero card", default: "#EEF1F0" },
  ],
};

export type Palette = Partial<Record<PaletteRole, string>>;

const HEX = /^#[0-9a-fA-F]{6}$/;
export const isHex6 = (v: unknown): v is string => typeof v === "string" && HEX.test(v);

export function defaultPalette(slug: ThemeSlug): Palette {
  const out: Palette = {};
  for (const s of THEME_PALETTES[slug] ?? []) out[s.role] = s.default;
  return out;
}

/** Saved palette for `slug` merged over its defaults (unknown/invalid values dropped). */
export function resolvePalette(slug: ThemeSlug, saved: unknown): { palette: Palette; custom: boolean } {
  const palette = defaultPalette(slug);
  let custom = false;
  const mine = saved && typeof saved === "object" ? (saved as Record<string, unknown>)[slug] : null;
  if (mine && typeof mine === "object") {
    for (const s of THEME_PALETTES[slug] ?? []) {
      const v = (mine as Record<string, unknown>)[s.role];
      if (isHex6(v) && v.toLowerCase() !== s.default.toLowerCase()) {
        palette[s.role] = v;
        custom = true;
      }
    }
  }
  return { palette, custom };
}

// ── colour maths (tiny, dependency-free) ────────────────────────────────────
function rgb(hex: string) {
  const h = hex.slice(1);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
}
function lum(hex: string) {
  const [r, g, b] = rgb(hex).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a: string, b: string) {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}
/** Prefer the theme's own pairing colour; fall back to black/white if it can't be read. */
export function onColor(bg: string, preferred: string) {
  if (contrast(bg, preferred) >= 3.2) return preferred;
  return contrast(bg, "#000000") >= contrast(bg, "#ffffff") ? "#111111" : "#ffffff";
}
/** "#FCB931" → "40 97% 59%" (the HSL-triple format the theme tokens use). */
export function hslTriple(hex: string) {
  const [r, g, b] = rgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/** Blend two hex colours (t = share of b). */
export function mixHex(a: string, b: string, t: number) {
  const [x, y] = [rgb(a), rgb(b)];
  return "#" + x.map((c, k) => Math.round((c + (y[k] - c) * t) * 255).toString(16).padStart(2, "0")).join("");
}

/** The CSS injected by the root layout for the active theme. Only hex values we validated reach it. */
export function paletteCss(slug: ThemeSlug, palette: Palette, custom: boolean): string {
  const slots = THEME_PALETTES[slug];
  if (!slots) return "";
  const accent = palette.accent;
  const paper = palette.paper ?? "#ffffff";
  // A dark page background flips every text colour to light — owners pick
  // black backgrounds (Astoria BBQ) and dark-grey-on-black text was unreadable.
  const paperDark = lum(paper) < 0.18;
  // The ink is the designs' heading/text colour ON the paper (Diner's chocolate
  // on cream). If the owner picks one that vanishes on the page (white on white,
  // Koreatgo), swap in a readable one: a deep shade of their brand colour, else
  // near-black / near-white.
  const rawInk = palette.ink ?? "#111111";
  const deepAccent = accent ? mixHex(accent, paperDark ? "#ffffff" : "#000000", 0.62) : "";
  const ink =
    contrast(rawInk, paper) >= 3
      ? rawInk
      : deepAccent && contrast(deepAccent, paper) >= 4.5
        ? deepAccent
        : paperDark
          ? "#F4F4F5"
          : "#1A1A1A";
  // Body text: the ink when it actually reads on the page, else neutral.
  const text = contrast(ink, paper) >= 4.5 ? ink : paperDark ? "#F4F4F5" : "#141414";
  const vars: string[] = [
    `--tp-ink:${ink}`,
    `--tp-paper:${paper}`,
    `--tp-on-ink:${onColor(ink, paper)}`,
    `--tp-text:${text}`,
    `--tp-muted:${paperDark ? "rgba(255,255,255,0.72)" : "#737373"}`,
    `--tp-line:${paperDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.1)"}`,
    `--tp-line-strong:${paperDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.25)"}`,
  ];
  if (accent)
    vars.push(
      `--tp-accent:${accent}`,
      `--tp-on-accent:${onColor(accent, ink)}`,
      // hover tint: deeper on light pages, brighter on dark ones
      `--tp-accent-deep:${paperDark ? mixHex(accent, "#ffffff", 0.2) : mixHex(accent, "#000000", 0.38)}`,
    );
  if (palette.panel) vars.push(`--tp-panel:${palette.panel}`);
  let css = `:root{${vars.join(";")}}`;

  // Re-tint the shared tokens (menu, cart, other pages) — light mode only, and
  // only once the owner changed something, so default sites stay byte-identical.
  if (custom) {
    const t: string[] = [];
    if (accent) t.push(`--primary:${hslTriple(accent)}`, `--ring:${hslTriple(accent)}`, `--primary-foreground:${hslTriple(onColor(accent, ink))}`);
    if (palette.ink && slug !== "smash-bold") {
      t.push(`--secondary:${hslTriple(ink)}`, `--dark:${hslTriple(ink)}`);
      // Body text / nav + footer links only follow the ink when it's a genuine
      // text colour (near-black, reads like ink on white). A bright pick like
      // sky-blue is a decoration colour — it must never repaint every link.
      if (!paperDark && contrast(ink, "#ffffff") >= 9) {
        t.push(`--foreground:${hslTriple(ink)}`, `--card-foreground:${hslTriple(ink)}`);
      }
    }
    if (palette.paper) {
      t.push(`--background:${hslTriple(paper)}`, `--secondary-foreground:${hslTriple(paper)}`, `--dark-foreground:${hslTriple(paper)}`);
      if (paperDark) {
        // A full dark surface set, so cards/menus/popovers/borders all read.
        const card = mixHex(paper, "#ffffff", 0.07);
        const muted = mixHex(paper, "#ffffff", 0.11);
        const line = mixHex(paper, "#ffffff", 0.18);
        t.push(
          `--foreground:0 0% 96%`,
          `--card:${hslTriple(card)}`,
          `--card-foreground:0 0% 96%`,
          `--popover:${hslTriple(card)}`,
          `--popover-foreground:0 0% 96%`,
          `--muted:${hslTriple(muted)}`,
          `--muted-foreground:0 0% 72%`,
          `--accent:${hslTriple(muted)}`,
          `--accent-foreground:0 0% 96%`,
          `--border:${hslTriple(line)}`,
          `--input:${hslTriple(line)}`,
          `--secondary-foreground:0 0% 96%`,
          `--dark-foreground:0 0% 96%`,
        );
      }
    }
    if (t.length) css += `html[data-theme="${slug}"]:not(.dark){${t.join(";")}}`;
  }
  return css;
}
