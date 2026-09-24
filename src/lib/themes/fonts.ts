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
//             Courier New -> Courier Prime (free)
//   Fiorella: FiorellaFace(bespoke) -> Marcellus, proxima-nova(paid) -> Jost,
//             futura-pt(paid) -> Jost
import { Poppins, Caveat, Montserrat, Courier_Prime, Marcellus, Jost } from "next/font/google";

// smash-bold (Ender): tight, bold, uppercase display + a hand-drawn accent.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});
const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-caveat",
  display: "swap",
});

// diner-classic (Fame): friendly grotesk + a monospace "receipt" accent.
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});
const courierPrime = Courier_Prime({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-courier-prime",
  display: "swap",
});

// refined-elegant (Fiorella): wide elegant display + a clean geometric body.
const marcellus = Marcellus({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-marcellus",
  display: "swap",
});
const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-jost",
  display: "swap",
});

// Space-joined className with every theme font's CSS variable, attached to
// <html> in the root layout so all four themes' fonts resolve no matter which
// data-theme is active. classic-starvega uses the system sans stack and needs
// no webfont, so it is intentionally absent here.
export const themeFontVariables = [
  poppins.variable,
  caveat.variable,
  montserrat.variable,
  courierPrime.variable,
  marcellus.variable,
  jost.variable,
].join(" ");
