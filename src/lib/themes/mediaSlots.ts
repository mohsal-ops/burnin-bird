// Which photos each design actually uses on the homepage — the single source
// for the theme-aware Media page (map + slot cards) and for the homepage
// content loader. Client-safe (no DB imports).
//
// A slot is a SiteImage row keyed by `key`. Theme-only slots don't get seeded:
// until the owner sets one, the homepage falls back to `fallback` (another
// SiteImage key) so a freshly switched design never shows an empty frame.
import type { ThemeSlug } from "./registry";

export type MediaSlot = {
  key: string;
  label: string;
  where: string;
  fallback?: string; // SiteImage key used until this slot is set
  tip?: string;
  kind?: "photo" | "mascot";
};

export type ThemeWord = { key: string; label: string; hint: string; max: number; font: string; upper?: boolean };

export const THEME_MEDIA: Record<ThemeSlug, { slots: MediaSlot[]; words: ThemeWord[]; dishesNote?: string }> = {
  "classic-starvega": {
    slots: [
      { key: "home_hero", label: "Hero · slide 1", where: "The big rotating banner at the top of your homepage." },
      { key: "home_hero_2", label: "Hero · slide 2", where: "Second slide of the top banner." },
      { key: "home_hero_3", label: "Hero · slide 3", where: "Third slide of the top banner." },
      { key: "home_order", label: "Order-direct banner", where: "The full-width 'Order directly' banner further down." },
      { key: "home_feature_1", label: "Feature 1", where: "First feature row — photo on the left." },
      { key: "home_feature_2", label: "Feature 2", where: "Second feature row — photo on the right." },
    ],
    words: [],
  },
  "smash-bold": {
    slots: [
      {
        key: "smash_mascot",
        label: "3D mascot",
        where: "The star of the launch slide: a 3D character standing next to your branded box, with your name printed on it.",
        kind: "mascot",
        tip: "Pick the character that matches your food, or upload your own render (plain light-grey background, character on the left, box on the right).",
      },
      {
        key: "smash_location",
        label: "Location slide",
        where: "Slide 3 of the top panel: a darkened photo behind '#001' and your city in huge letters.",
        fallback: "home_hero_2",
        tip: "A wide shot of your storefront or dining room works best — it's darkened, so busy photos are fine.",
      },
      { key: "home_feature_1", label: "Story block 1", where: "Leads the first big rounded photo carousel, beside your first feature's hand-lettered title. Your first two gallery photos rotate in after it.", tip: "Wide, bright, appetising — it fills a big rounded frame." },
      { key: "home_feature_2", label: "Story block 2", where: "Leads the second story carousel (mirrored side). Gallery photos 3–4 rotate in after it." },
    ],
    words: [
      { key: "theme_subbrand", label: "Sub-brand word", hint: "The huge bubbly word in the hero, on the box and on every lineup card (like Ender's ENDY). Short is best.", max: 10, font: "var(--font-balloon), system-ui", upper: true },
    ],
    dishesNote: "The launch slide's three product cards and the endless sliding card row use your featured menu items' photos. Your Gallery tab fills the two-row photo wall further down.",
  },
  "diner-classic": {
    slots: [
      {
        key: "diner_hero",
        label: "Hero backup photo",
        where: "Only shown if you have no featured dishes with photos — otherwise the golden hero floats your first three featured dishes.",
        fallback: "home_hero",
      },
      { key: "home_feature_1", label: "Our Story plate 1", where: "Left plate in the 'Our Story' section (cropped to a circle)." },
      { key: "home_feature_2", label: "Our Story plate 2", where: "Right plate in the 'Our Story' section (cropped to a circle)." },
    ],
    words: [
      { key: "theme_heroword", label: "Hero word", hint: "The giant cream script word on the golden hero (like Fame's 'Cheeeese!'). Stretch a vowel and add '!'.", max: 14, font: "var(--font-script), cursive" },
    ],
    dishesNote: "The golden hero floats your first three featured dishes, and every menu section shows its dishes on chocolate plates. Photos on a plain WHITE background melt straight into the gold.",
  },
  "refined-elegant": {
    slots: [
      { key: "elegant_hero", label: "Full-screen hero", where: "The full-screen photo behind your headline — the first thing guests see.", fallback: "home_hero", tip: "Moody, wide, landscape. It gets a dark overlay and a slow zoom." },
      { key: "elegant_intro", label: "Intro portrait", where: "The tall photo beside 'Our doors are open…'.", fallback: "home_hero_2", tip: "Portrait / vertical crops best (4:5)." },
      { key: "elegant_visit", label: "Visit-us band", where: "The full-width parallax band behind 'VISIT US' and the outlined buttons.", fallback: "home_hero_3" },
      { key: "elegant_story", label: "Our-story band", where: "The full-height parallax band behind 'OUR STORY' and your long-form text.", fallback: "home_feature_1" },
    ],
    words: [
      { key: "theme_headline", label: "Stencil headline", hint: "The big stencil words over the hero photo (like 'NEIGHBORHOOD ITALIAN'). Two or three words.", max: 28, font: "var(--font-stencil), sans-serif", upper: true },
    ],
    dishesNote: "'The menu' list shows your featured items — hovering a dish floats its photo next to the cursor.",
  },
};

// Every word key any theme uses (for the save action's allow-list).
export const THEME_WORD_KEYS = Object.values(THEME_MEDIA).flatMap((t) => t.words.map((w) => w.key));

export const MASCOT_PRESETS = [
  { id: "box", src: "/mascots/box.webp", label: "Takeout bag", fits: "Burgers, chicken, grill" },
  { id: "cup", src: "/mascots/cup.webp", label: "Coffee cup", fits: "Cafés, tea, desserts" },
  { id: "pizza", src: "/mascots/pizza.webp", label: "Pizza box", fits: "Pizzerias" },
  { id: "bowl", src: "/mascots/bowl.webp", label: "Bowl", fits: "Bowls, poke, ramen" },
] as const;

// Auto mascot for Smash & Bold from the loader style / cuisines.
export type MascotVariant = "box" | "cup" | "pizza" | "bowl";
export function mascotFor(loaderStyle?: string, cuisines?: readonly string[]): MascotVariant {
  const s = (loaderStyle || "").toLowerCase();
  const c = (cuisines || []).join(" ").toLowerCase();
  if (s === "coffee" || /coffee|caf|espresso|matcha|latte|tea|bakery/.test(c)) return "cup";
  if (s === "pizza" || /pizz/.test(c)) return "pizza";
  if (s === "bowl" || /bowl|poke|ramen|salad|noodle|pho|rice/.test(c)) return "bowl";
  return "box"; // burgers, chicken, grill, anything handheld → takeout bag + meal box
}

// Diner Classic's default hero word: "Cheese" → "Cheeeese!", "Hot Chicken" → "Chiiicken!"
export function stretchWord(phrase: string): string {
  const w = phrase.trim().split(/\s+/).pop() || phrase;
  const word = w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  const m = word.match(/[aeiouy]+/i);
  if (!m || m.index === undefined || m.index === 0) return `${word}!`;
  const v = m[0];
  return `${word.slice(0, m.index)}${v[v.length - 1].repeat(Math.max(3, v.length + 2))}${word.slice(m.index + v.length)}!`;
}
