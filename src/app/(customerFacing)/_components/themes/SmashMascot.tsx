// Cuisine-adaptive mascot for the smash-bold hero — the playful "character with
// sunglasses" energy of Ender's ENDY box, but built so it morphs to the
// business type (a burger box won't do for a coffee shop). All flat SVG in the
// theme's palette (card body, foreground outline, primary accents), so it pops
// on the light hero and still works in dark mode. Same character chrome
// (sunglasses, arms doing a rock sign, sneakers) — only the BODY shape changes.

type Variant = "burger" | "coffee" | "pizza" | "chicken" | "bowl" | "box";

// Map the site's loaderStyle / cuisine to a mascot body.
export function mascotVariant(loaderStyle?: string, cuisines?: string[]): Variant {
  const s = (loaderStyle || "").toLowerCase();
  if (s === "coffee") return "coffee";
  if (s === "pizza") return "pizza";
  if (s === "bowl") return "bowl";
  if (s === "grill" || s === "burger") {
    const c = (cuisines || []).join(" ").toLowerCase();
    if (/chicken|wing|tender/.test(c)) return "chicken";
    return "burger";
  }
  const c = (cuisines || []).join(" ").toLowerCase();
  if (/coffee|caf|espresso|matcha/.test(c)) return "coffee";
  if (/pizza|slice/.test(c)) return "pizza";
  if (/chicken|wing|tender|nashville/.test(c)) return "chicken";
  if (/bowl|poke|rice|salad/.test(c)) return "bowl";
  if (/burger|smash|grill|bbq/.test(c)) return "burger";
  return "box";
}

// Shared face: chunky sunglasses + a little grin.
function Face({ y = 96 }: { y?: number }) {
  return (
    <g>
      <rect x="66" y={y} width="30" height="20" rx="6" className="fill-foreground" />
      <rect x="104" y={y} width="30" height="20" rx="6" className="fill-foreground" />
      <rect x="94" y={y + 6} width="12" height="5" className="fill-foreground" />
      <path d={`M84 ${y + 34} q16 12 32 0`} className="stroke-foreground" strokeWidth="4" strokeLinecap="round" fill="none" />
    </g>
  );
}

// Shared arms (right one throws a rock-on / peace sign) + sneakered legs.
function Limbs() {
  return (
    <g className="stroke-foreground" strokeWidth="6" strokeLinecap="round" fill="none">
      {/* left arm down */}
      <path d="M60 150 q-26 6 -30 34" />
      {/* right arm up */}
      <path d="M140 150 q30 -6 34 -40" />
      {/* legs */}
      <path d="M84 196 v34" />
      <path d="M116 196 v34" />
      {/* sneakers */}
      <path d="M84 230 q-16 2 -18 12 q18 4 24 -2" className="fill-primary" strokeWidth="4" />
      <path d="M116 230 q16 2 18 12 q-18 4 -24 -2" className="fill-primary" strokeWidth="4" />
      {/* rock-on hand */}
      <circle cx="176" cy="106" r="9" className="fill-card" strokeWidth="4" />
    </g>
  );
}

function Body({ variant, brand }: { variant: Variant; brand: string }) {
  const label = (
    <text x="100" y="182" textAnchor="middle" className="fill-foreground" style={{ fontFamily: "var(--font-caveat), cursive", fontSize: 18, fontWeight: 700 }}>
      {brand.slice(0, 10)}
    </text>
  );
  switch (variant) {
    case "coffee":
      return (
        <g>
          {/* cup */}
          <path d="M62 84 h76 l-8 116 a10 10 0 0 1 -10 9 H80 a10 10 0 0 1 -10 -9 Z" className="fill-card stroke-foreground" strokeWidth="6" />
          <rect x="58" y="72" width="84" height="16" rx="8" className="fill-primary stroke-foreground" strokeWidth="6" />
          {/* sleeve */}
          <rect x="64" y="126" width="72" height="30" className="fill-primary/30 stroke-foreground" strokeWidth="4" />
          {label}
        </g>
      );
    case "pizza":
      return (
        <g>
          {/* slice pointing down */}
          <path d="M50 70 H150 L100 210 Z" className="fill-card stroke-foreground" strokeWidth="6" strokeLinejoin="round" />
          <path d="M50 70 H150 v14 H50 Z" className="fill-primary stroke-foreground" strokeWidth="4" />
          <circle cx="86" cy="112" r="7" className="fill-primary" />
          <circle cx="116" cy="120" r="7" className="fill-primary" />
          <circle cx="100" cy="152" r="6" className="fill-primary" />
          {label}
        </g>
      );
    case "chicken":
      return (
        <g>
          {/* bucket */}
          <path d="M60 92 h80 l-10 108 a10 10 0 0 1 -10 9 H80 a10 10 0 0 1 -10 -9 Z" className="fill-card stroke-foreground" strokeWidth="6" />
          <rect x="54" y="80" width="92" height="16" rx="8" className="fill-primary stroke-foreground" strokeWidth="6" />
          {/* drumsticks poking out */}
          <path d="M84 78 q-6 -22 8 -30 q10 8 4 30" className="fill-card stroke-foreground" strokeWidth="4" />
          <path d="M112 78 q6 -22 -8 -30 q-10 8 -4 30" className="fill-card stroke-foreground" strokeWidth="4" />
          {label}
        </g>
      );
    case "bowl":
      return (
        <g>
          <path d="M56 118 h88 a44 44 0 0 1 -88 0 Z" className="fill-card stroke-foreground" strokeWidth="6" />
          <ellipse cx="100" cy="118" rx="44" ry="12" className="fill-primary stroke-foreground" strokeWidth="6" />
          <circle cx="82" cy="112" r="7" className="fill-primary" />
          <circle cx="118" cy="112" r="7" className="fill-primary" />
          {label}
        </g>
      );
    case "burger":
      return (
        <g>
          {/* bun top */}
          <path d="M56 96 q44 -40 88 0 Z" className="fill-primary stroke-foreground" strokeWidth="6" />
          {/* fillings */}
          <rect x="56" y="96" width="88" height="12" className="fill-foreground" />
          <path d="M52 116 q48 18 96 0" className="fill-card stroke-foreground" strokeWidth="4" />
          <rect x="56" y="128" width="88" height="14" className="fill-primary" />
          {/* bun bottom */}
          <path d="M58 150 h84 a10 10 0 0 1 -6 20 H64 a10 10 0 0 1 -6 -20 Z" className="fill-primary stroke-foreground" strokeWidth="6" />
          {label}
        </g>
      );
    default: // takeout box (the neutral "cajita")
      return (
        <g>
          <path d="M64 96 h72 l-6 104 a10 10 0 0 1 -10 9 H80 a10 10 0 0 1 -10 -9 Z" className="fill-card stroke-foreground" strokeWidth="6" />
          <path d="M64 96 l36 -18 l36 18 l-36 14 Z" className="fill-primary stroke-foreground" strokeWidth="4" />
          {label}
        </g>
      );
  }
}

export function SmashMascot({ variant, brand, className }: { variant: Variant; brand: string; className?: string }) {
  return (
    <svg viewBox="0 0 200 250" className={className} role="img" aria-label={`${brand} mascot`}>
      <Body variant={variant} brand={brand} />
      <Face y={variant === "bowl" ? 88 : 100} />
      <Limbs />
    </svg>
  );
}

// The tiny walking snack that struts across the top of the hero (Ender's little
// walking ENDY figure). Same body cue, minimal, with striding legs.
export function WalkingSnack({ variant, className }: { variant: Variant; className?: string }) {
  return (
    <svg viewBox="0 0 60 70" className={className} aria-hidden>
      <g className="fill-foreground">
        {variant === "coffee" ? (
          <path d="M18 14 h24 l-3 34 a4 4 0 0 1 -4 4 H25 a4 4 0 0 1 -4 -4 Z" />
        ) : variant === "pizza" ? (
          <path d="M14 12 H46 L30 52 Z" />
        ) : (
          <path d="M18 16 h24 l-3 32 a4 4 0 0 1 -4 4 H25 a4 4 0 0 1 -4 -4 Z" />
        )}
      </g>
      <g className="stroke-foreground" strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M22 54 l-6 12" />
        <path d="M38 54 l6 12" />
        <path d="M16 30 l-8 8" />
      </g>
      <rect x="22" y="24" width="7" height="5" rx="2" className="fill-card" />
      <rect x="31" y="24" width="7" height="5" rx="2" className="fill-card" />
    </svg>
  );
}
