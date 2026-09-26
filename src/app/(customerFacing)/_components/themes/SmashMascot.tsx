// Cuisine-adaptive mascot for the smash-bold hero — modeled on Ender's "Cajita
// ENDY": a branded TAKEOUT-BOX character with chunky sunglasses, a rock-on hand,
// and sneakers. A takeout box reads for ANY cuisine, so it's the default; cafés
// get a cup. Flat SVG in the theme palette (white body + near-black outline via
// an outline-then-fill stroke trick, so limbs read as white tubes with a black
// edge like the reference). The business name sits on the chest.

type Variant = "box" | "cup";

export function mascotVariant(loaderStyle?: string, cuisines?: string[]): Variant {
  const s = (loaderStyle || "").toLowerCase();
  const c = (cuisines || []).join(" ").toLowerCase();
  if (s === "coffee" || /coffee|caf|espresso|matcha|latte|tea/.test(c)) return "cup";
  return "box";
}

// A white limb (arm/leg): thick near-black outline underneath, thinner white on
// top → reads as a rounded white tube with a black edge.
function Limb({ d }: { d: string }) {
  return (
    <>
      <path d={d} className="stroke-foreground" strokeWidth="18" strokeLinecap="round" fill="none" />
      <path d={d} className="stroke-card" strokeWidth="11" strokeLinecap="round" fill="none" />
    </>
  );
}

function Sneaker({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-6 -8 q-22 2 -24 16 q2 8 22 8 h30 q6 -2 6 -10 v-14 z" className="fill-card stroke-foreground" strokeWidth="5" strokeLinejoin="round" />
      <path d="M-30 15 h58" className="stroke-primary" strokeWidth="6" strokeLinecap="round" />
      <circle cx="8" cy="-2" r="3" className="fill-foreground" />
    </g>
  );
}

// Face + arms + legs, shared by both bodies. cx = body centre x.
function Character({ cx, glassY, brand }: { cx: number; glassY: number; brand: string }) {
  return (
    <g>
      {/* arms */}
      <Limb d={`M${cx - 54} ${glassY + 20} C ${cx - 92} ${glassY + 34}, ${cx - 100} ${glassY + 70}, ${cx - 96} ${glassY + 96}`} />
      <Limb d={`M${cx + 54} ${glassY + 14} C ${cx + 96} ${glassY - 2}, ${cx + 104} ${glassY - 44}, ${cx + 100} ${glassY - 74}`} />
      {/* left fist */}
      <circle cx={cx - 96} cy={glassY + 100} r="13" className="fill-card stroke-foreground" strokeWidth="5" />
      {/* right rock-on hand */}
      <g>
        <circle cx={cx + 100} cy={glassY - 76} r="13" className="fill-card stroke-foreground" strokeWidth="5" />
        <rect x={cx + 88} y={glassY - 108} width="8" height="22" rx="4" className="fill-card stroke-foreground" strokeWidth="4" />
        <rect x={cx + 104} y={glassY - 108} width="8" height="22" rx="4" className="fill-card stroke-foreground" strokeWidth="4" />
      </g>
      {/* legs */}
      <Limb d={`M${cx - 20} ${glassY + 118} V ${glassY + 158}`} />
      <Limb d={`M${cx + 20} ${glassY + 118} V ${glassY + 158}`} />
      <Sneaker x={cx - 20} y={glassY + 166} />
      <Sneaker x={cx + 20} y={glassY + 166} />
      {/* sunglasses */}
      <rect x={cx - 44} y={glassY} width="42" height="28" rx="9" className="fill-foreground" />
      <rect x={cx + 2} y={glassY} width="42" height="28" rx="9" className="fill-foreground" />
      <rect x={cx - 6} y={glassY + 8} width="12" height="7" className="fill-foreground" />
      <circle cx={cx - 32} cy={glassY + 9} r="4" className="fill-card opacity-70" />
      <circle cx={cx + 14} cy={glassY + 9} r="4" className="fill-card opacity-70" />
      {/* nose + grin */}
      <path d={`M${cx - 5} ${glassY + 30} q5 11 10 0`} className="fill-card stroke-foreground" strokeWidth="3" />
      <path d={`M${cx - 15} ${glassY + 44} q15 11 30 0`} className="stroke-foreground" strokeWidth="4" strokeLinecap="round" fill="none" />
      {/* brand on chest */}
      <text x={cx} y={glassY + 66} textAnchor="middle" className="fill-muted-foreground" style={{ fontFamily: "var(--font-caveat), cursive", fontSize: 15, fontWeight: 700, letterSpacing: 1 }}>
        {brand.slice(0, 12)}
      </text>
    </g>
  );
}

export function SmashMascot({ variant, brand, className }: { variant: Variant; brand: string; className?: string }) {
  const cx = 120;
  if (variant === "cup") {
    return (
      <svg viewBox="0 0 240 320" className={className} role="img" aria-label={`${brand} mascot`}>
        {/* cup body */}
        <path d="M74 96 h92 l-10 132 a12 12 0 0 1 -12 11 H96 a12 12 0 0 1 -12 -11 Z" className="fill-card stroke-foreground" strokeWidth="6" />
        <rect x="68" y="82" width="104" height="18" rx="9" className="fill-primary stroke-foreground" strokeWidth="6" />
        <path d="M120 82 q-6 -22 0 -34" className="stroke-foreground" strokeWidth="6" fill="none" strokeLinecap="round" />
        <Character cx={cx} glassY={140} brand={brand} />
      </svg>
    );
  }
  // takeout box (default)
  return (
    <svg viewBox="0 0 240 320" className={className} role="img" aria-label={`${brand} mascot`}>
      {/* box + folded handle */}
      <path d="M104 96 q-4 -34 16 -34 q20 0 16 34" className="fill-card stroke-foreground" strokeWidth="6" />
      <rect x="66" y="92" width="108" height="120" rx="16" className="fill-card stroke-foreground" strokeWidth="6" />
      <path d="M66 118 h108" className="stroke-foreground" strokeWidth="4" />
      <Character cx={cx} glassY={128} brand={brand} />
    </svg>
  );
}

// Little black walking-box silhouette that struts across the top (Ender's tiny
// walking ENDY). Solid near-black with cut-out white sunglasses, one arm up in a
// rock-on, mid-stride legs.
export function WalkingSnack({ className }: { variant?: Variant; className?: string }) {
  return (
    <svg viewBox="0 0 80 96" className={className} aria-hidden>
      <g className="fill-foreground">
        {/* handle + body */}
        <path d="M34 28 q-2 -12 6 -12 q8 0 6 12" fill="none" className="stroke-foreground" strokeWidth="4" />
        <rect x="22" y="26" width="36" height="40" rx="7" />
        {/* raised rock-on arm */}
        <path d="M56 40 q16 -4 16 -22" fill="none" className="stroke-foreground" strokeWidth="6" strokeLinecap="round" />
        {/* down arm */}
        <path d="M24 44 q-12 4 -12 18" fill="none" className="stroke-foreground" strokeWidth="6" strokeLinecap="round" />
        {/* striding legs */}
        <path d="M32 66 l-8 18" fill="none" className="stroke-foreground" strokeWidth="6" strokeLinecap="round" />
        <path d="M48 66 l10 16" fill="none" className="stroke-foreground" strokeWidth="6" strokeLinecap="round" />
      </g>
      {/* white sunglasses cut-outs */}
      <rect x="27" y="38" width="11" height="7" rx="2" className="fill-card" />
      <rect x="41" y="38" width="11" height="7" rx="2" className="fill-card" />
    </svg>
  );
}
