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

export function CorePitch() {
  const theme = resolveThemeSlug();
  const copy = COPY[theme];

  return (
    <FadeIn>
      <section className="w-full max-w-[85rem] px-4 py-10 md:py-16">
        <div className="mb-8 text-center">
          <p className="font-accent mb-2 text-sm font-semibold uppercase tracking-wide text-primary">
            {copy.eyebrow}
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">{copy.heading}</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map(({ key, title, Icon }) => (
            <div
              key={key}
              className="flex flex-col items-start gap-3 rounded-[var(--radius)] border border-border bg-card p-6 shadow-sm transition-transform duration-200 hover:-translate-y-1"
            >
              <span className="grid size-12 place-items-center rounded-[var(--radius)] bg-primary/15 text-primary">
                <Icon className="size-6" strokeWidth={1.75} />
              </span>
              <h3 className="text-lg font-semibold text-card-foreground">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{copy.body[key]}</p>
            </div>
          ))}
        </div>
      </section>
    </FadeIn>
  );
}
