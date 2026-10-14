import { SITE_CONFIG } from "@/lib/siteConfig";
import { resolveThemeSlug, type ThemeSlug } from "@/lib/themes/registry";
import FadeIn from "@/components/FadeIn";
import { UtensilsCrossed, Store, Gift, MapPin } from "lucide-react";

// The CORE PITCH block — the fifth section in the contract and the one that
// makes the template "ours": the four pillars that sell the Starvega product,
// regardless of restaurant. It is token-driven (so it re-skins with the theme)
// and its wording adapts to each theme's voice. Rendered for the themed skins;
// classic-starvega keeps its existing native sections (which already carry this
// message), so nothing changes for existing sites.

type PillarKey = "catering" | "direct" | "loyalty" | "local";

const PILLARS: { key: PillarKey; title: string; Icon: typeof Store }[] = [
  { key: "catering", title: "Catering", Icon: UtensilsCrossed },
  { key: "direct", title: "Commission-free ordering", Icon: Store },
  { key: "loyalty", title: "Loyalty & regulars", Icon: Gift },
  { key: "local", title: "Found on Google", Icon: MapPin },
];

const city = SITE_CONFIG.city;

// Per-theme voice. Titles stay constant (the pillars never change); only the
// framing copy shifts to match the theme's personality.
const COPY: Record<ThemeSlug, { eyebrow: string; heading: string; body: Record<PillarKey, string> }> = {
  "classic-starvega": {
    eyebrow: "Why order with us",
    heading: "Everything your restaurant needs, in one site",
    body: {
      catering: "Book catering for events big and small, right from the site.",
      direct: "Order straight from us — no third-party delivery commissions.",
      loyalty: "Rewards that bring regulars back again and again.",
      local: `Built to show up when people search near ${city}.`,
    },
  },
  "pop-bento": {
    eyebrow: "Why order with us",
    heading: "Fresh food, ordered your way",
    body: {
      catering: "Big group? Book catering in a couple of taps.",
      direct: "Order right here. No delivery-app markup, ever.",
      loyalty: "Earn rewards every time you order.",
      local: `The spot people find when they search ${city}.`,
    },
  },
  "smash-bold": {
    eyebrow: "The whole package",
    heading: "Order direct. Skip the fees. Come back for more.",
    body: {
      catering: "Feeding a crew? Lock in catering in a couple taps.",
      direct: "Straight from us to you — none of that delivery-app markup.",
      loyalty: "Rack up rewards every order. Regulars eat better.",
      local: `First name people find when they search ${city}.`,
    },
  },
  "diner-classic": {
    eyebrow: "Made for regulars",
    heading: "A warm welcome, every single order",
    body: {
      catering: "Hosting a get-together? We'll cater it, no fuss.",
      direct: "Order right here — you keep more, we skip the middleman fees.",
      loyalty: "Earn perks for coming back, just like the old days.",
      local: `Easy to find when folks look for a bite near ${city}.`,
    },
  },
  "refined-elegant": {
    eyebrow: "The experience",
    heading: "Considered dining, effortlessly ordered",
    body: {
      catering: "Refined catering for occasions that deserve it.",
      direct: "Reserve and order directly — commission-free, always.",
      loyalty: "A loyalty program that rewards the familiar faces.",
      local: `Discoverable to every guest searching in ${city}.`,
    },
  },
};

export function CorePitch({ theme: themeProp }: { theme?: ThemeSlug } = {}) {
  const theme = themeProp ?? resolveThemeSlug();
  const copy = COPY[theme];
  // Smash wears its brutal look: thick ink outlines + hard offset shadow.
  const bold = theme === "smash-bold";

  return (
    <FadeIn>
      <section className="w-full max-w-[85rem] px-4 py-10 md:py-16">
        <div className="mb-8 text-center">
          <p className="font-accent mb-2 text-sm font-semibold uppercase tracking-wide text-primary">
            {copy.eyebrow}
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">{copy.heading}</h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map(({ key, title, Icon }, i) => (
            <div
              key={key}
              className={
                bold
                  ? "group relative flex flex-col gap-4 overflow-hidden rounded-2xl border-[2.5px] border-foreground bg-card p-6 shadow-[6px_6px_0_hsl(var(--foreground))] transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[9px_9px_0_hsl(var(--foreground))]"
                  : "group relative flex flex-col gap-4 overflow-hidden rounded-[var(--radius)] border border-border bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_18px_40px_-20px_rgba(0,0,0,0.35)]"
              }
            >
              {/* accent bar that grows on hover */}
              {!bold && <span aria-hidden className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100" />}
              <div className="flex items-start justify-between">
                <span
                  className={`grid size-12 place-items-center transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 ${bold ? "rounded-xl border-2 border-foreground bg-brand text-brand-foreground" : "rounded-[var(--radius)] bg-primary text-primary-foreground shadow-sm"}`}
                >
                  <Icon className="size-6" strokeWidth={2} />
                </span>
                <span
                  aria-hidden
                  className={`select-none font-black leading-none tabular-nums ${bold ? "text-4xl text-foreground/15" : "text-4xl text-transparent [-webkit-text-stroke:1.5px_hsl(var(--primary)/0.45)]"}`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className={`text-card-foreground ${bold ? "text-xl font-black uppercase leading-tight tracking-tight" : "text-lg font-semibold"}`}>{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{copy.body[key]}</p>
            </div>
          ))}
        </div>
      </section>
    </FadeIn>
  );
}
