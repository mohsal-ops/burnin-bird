// Fonts for the design-theme registry. Every theme's fonts are loaded here via
// next/font (self-hosted, no layout shift, no external requests) and exposed as
// CSS variables. All variable classes get attached to <html> once in the root
// layout; each theme's CSS block in themes.css then points --ff-display /
// --ff-body / --ff-accent at whichever of these the theme uses.
//
// NOTE on the reference sites (Phase 0): several used PAID/bespoke fonts that
// are not licensable for a commercial multi-tenant product, so each is mapped to
// the closest freely-licensable Google font, noted per theme in themes.css:
//   Ender:    Poppins (free, matches) + GoodDog(paid) -> Caveat
//   Fame:     Montserrat (free, matches) + aktiv-grotesk(paid) -> Montserrat,
//             Courier New -> Courier Prime (free), script -> Lobster
//   Fiorella: FiorellaFace(bespoke) -> Saira Stencil One (bespoke homepage) / Marcellus, proxima-nova(paid) -> Jost,
//             futura-pt(paid) -> Jost
import { Poppins, Caveat, Montserrat, Courier_Prime, Marcellus, Jost, Chewy, Lobster, Saira_Stencil_One, Permanent_Marker, Antonio, Bricolage_Grotesque, DM_Sans } from "next/font/google";

// smash-bold (Ender): tight, bold, uppercase display + a hand-drawn accent +
// a puffy balloon face for the big "waved" brand word (Ender's bespoke ENDY
// lettering → Chewy, the closest free bubbly display).
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
  preload: false,
});
const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-caveat",
  display: "swap",
  preload: false,
});
const chewy = Chewy({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-balloon",
  display: "swap",
  preload: false,
});

// diner-classic (Fame): friendly grotesk + a monospace "receipt" accent.
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-montserrat",
  display: "swap",
  preload: false,
});
const courierPrime = Courier_Prime({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-courier-prime",
  display: "swap",
  preload: false,
});

// Ender's tall condensed wordmark ("ENDER" in the navbar) → Antonio.
const condensed = Antonio({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-condensed",
  display: "swap",
  preload: false,
});

// Ender's upright hand-lettered block titles ("ENDER CAFÉ") → Permanent Marker.
const marker = Permanent_Marker({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-marker",
  display: "swap",
  preload: false,
});

// Fame's retro sign-painter script ("Cheeeese!", "Appetizer") → Lobster.
const lobster = Lobster({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-script",
  display: "swap",
  preload: false,
});

// Fiorella's bespoke geometric stencil display ("NEIGHBORHOOD ITALIAN") →
// Saira Stencil One, the closest free heavy geometric stencil.
const sairaStencil = Saira_Stencil_One({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-stencil",
  display: "swap",
  preload: false,
});

// refined-elegant (Fiorella): wide elegant display + a clean geometric body.
const marcellus = Marcellus({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-marcellus",
  display: "swap",
  preload: false,
});
const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-jost",
  display: "swap",
  preload: false,
});

// pop-bento: a chunky, characterful grotesk for the big words + a friendly sans.
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-bricolage",
  display: "swap",
  preload: false,
});
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-dmsans",
  display: "swap",
  preload: false,
});

// preload: false on every font above: only the active design's fonts are
// downloaded (when its CSS uses them), not all four themes' on every site.
//
// Space-joined className with every theme font's CSS variable, attached to
// <html> in the root layout so all four themes' fonts resolve no matter which
// data-theme is active. classic-starvega uses the system sans stack and needs
// no webfont, so it is intentionally absent here.
export const themeFontVariables = [
  poppins.variable,
  caveat.variable,
  chewy.variable,
  montserrat.variable,
  courierPrime.variable,
  lobster.variable,
  marker.variable,
  condensed.variable,
  sairaStencil.variable,
  marcellus.variable,
  jost.variable,
  bricolage.variable,
  dmSans.variable,
].join(" ");
