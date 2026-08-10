"use client";
// Admin intro loader. A small, centered line-art dish assembles from its parts,
// flashes a shine burst outward when complete, then flips like a coin (3D) to
// reveal the logo, with a shimmering wordmark underneath. Loops until the page
// finishes loading, then fades out. Pure CSS, no libraries.
//
// The dish is chosen by SITE_CONFIG.loaderStyle so one template serves every
// client: "burger" (fast food), "coffee" (café), or "pizza" (pizzeria). Missing
// / unknown values fall back to "burger" so template-sync is always safe.
//
// It plays ONCE PER BROWSER SESSION (sessionStorage) — refreshing or moving
// between admin pages in the same session won't replay it.

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { SITE_CONFIG } from "@/lib/siteConfig";

type Phase = "assemble" | "hold" | "flip" | "holdLogo" | "fadeOut";
type Variant = "burger" | "coffee" | "pizza";

// Cumulative offsets (ms) from the start of a loop.
const T = {
  hold: 1050, // assembled + shine burst
  flip: 1750, // coin flip → logo
  holdLogo: 2400, // logo held
  end: 3900,
};

const SESSION_KEY = "vega:introPlayed";
const NAME = SITE_CONFIG.name;

function resolveVariant(override?: Variant): Variant {
  const raw = override ?? (SITE_CONFIG as { loaderStyle?: string }).loaderStyle;
  return raw === "coffee" || raw === "pizza" || raw === "burger" ? raw : "burger";
}

const ACCENTS: Record<Variant, { fill: string; shine: string }> = {
  burger: { fill: "#FFB800", shine: "#FFB800" },
  coffee: { fill: "#4c8c5a", shine: "#7bb08a" },
  pizza: { fill: "#d94b2b", shine: "#e8834f" },
};

// Shine lines radiating OUTWARD from around the dish (start near its edge and
// shoot outward past the viewBox — the SVG uses overflow:visible).
const SHINE = [
  { x1: 105, y1: 34, x2: 119, y2: 22, stagger: 0 },
  { x1: 15, y1: 34, x2: 1, y2: 22, stagger: 60 },
  { x1: 109, y1: 50, x2: 123, y2: 50, stagger: 30 },
  { x1: 11, y1: 50, x2: -3, y2: 50, stagger: 30 },
  { x1: 105, y1: 66, x2: 119, y2: 78, stagger: 90 },
  { x1: 15, y1: 66, x2: 1, y2: 78, stagger: 90 },
];

const outline = {
  stroke: "#121212",
  strokeWidth: 2,
  fill: "none" as const,
  strokeLinejoin: "round" as const,
  strokeLinecap: "round" as const,
};
const svgLayer: React.CSSProperties = { transformBox: "fill-box", transformOrigin: "center" };

const layerAnim = (phase: Phase, delay: number) =>
  phase === "assemble"
    ? `layerIn 0.36s cubic-bezier(0.34,1.56,0.64,1) ${delay}ms both`
    : "none";
const popAnim = (phase: Phase, delay: number) =>
  phase === "assemble" ? `seedPop 0.15s ease ${delay}ms both` : "none";

// ── Per-variant front art ─────────────────────────────────────────────────────
function FrontArt({ variant, phase }: { variant: Variant; phase: Phase }) {
  const accent = ACCENTS[variant];
  const shine = (
    <g>
      {SHINE.map((l, i) => (
        <line
          key={i}
          x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
          stroke={accent.shine}
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeDasharray={20}
          strokeDashoffset={20}
          style={{ opacity: 0, animation: phase === "hold" ? `shineOut 0.5s ease ${l.stagger}ms forwards` : "none" }}
        />
      ))}
    </g>
  );

  if (variant === "coffee") {
    return (
      <svg width="70" viewBox="0 0 120 100" fill="none" style={{ overflow: "visible" }}>
        {shine}
        {/* Steam */}
        {["M 52,40 Q 48,33 52,27 Q 56,20 52,13", "M 60,41 Q 56,33 60,26 Q 64,18 60,10", "M 68,40 Q 64,34 68,28 Q 72,21 68,15"].map((d, i) => (
          <path key={i} d={d} stroke="#121212" strokeWidth={1.5} fill="none" strokeLinecap="round"
            style={{ opacity: 0.45, animation: `steam 2.1s ease-in-out ${500 + i * 260}ms infinite` }} />
        ))}
        {/* Saucer */}
        <ellipse cx={60} cy={85} rx={27} ry={3.6} {...outline} style={{ ...svgLayer, animation: layerAnim(phase, 0) }} />
        {/* Cup body */}
        <path d="M 42,44 L 78,44 L 74,74 Q 73,79 68,79 L 52,79 Q 47,79 46,74 Z"
          {...outline} style={{ ...svgLayer, animation: layerAnim(phase, 100) }} />
        {/* Handle */}
        <path d="M 78,50 Q 90,50 90,59 Q 90,68 78,67" {...outline} style={{ ...svgLayer, animation: layerAnim(phase, 180) }} />
        {/* Rim opening */}
        <ellipse cx={60} cy={44} rx={18} ry={3.8} {...outline} style={{ ...svgLayer, animation: layerAnim(phase, 240) }} />
        {/* Matcha surface — the single accent */}
        <ellipse cx={60} cy={44} rx={15.5} ry={3} fill={accent.fill} stroke="#121212" strokeWidth={1.4}
          style={{ ...svgLayer, animation: layerAnim(phase, 320) }} />
        {/* Latte-art leaf */}
        <g stroke="#121212" strokeWidth={0.9} strokeLinecap="round" style={{ ...svgLayer, animation: popAnim(phase, 520) }}>
          <line x1={60} y1={41.6} x2={60} y2={46.4} />
          <line x1={60} y1={42.6} x2={57.2} y2={43.8} />
          <line x1={60} y1={42.6} x2={62.8} y2={43.8} />
          <line x1={60} y1={44} x2={57.6} y2={45} />
          <line x1={60} y1={44} x2={62.4} y2={45} />
        </g>
      </svg>
    );
  }

  if (variant === "pizza") {
    // The whole pie draws its crust, tops itself, then does a playful spin.
    const spin = phase === "hold" ? "pizzaSpin 0.8s cubic-bezier(0.45,0,0.25,1) both" : "none";
    return (
      <svg width="72" viewBox="0 0 120 100" fill="none" style={{ overflow: "visible" }}>
        {shine}
        <g style={{ transformBox: "fill-box", transformOrigin: "center", animation: spin }}>
          {/* Sauce / cheese base — the accent */}
          <circle cx={60} cy={50} r={28} fill={accent.fill}
            style={{ ...svgLayer, animation: phase === "assemble" ? "seedPop 0.42s cubic-bezier(0.34,1.56,0.64,1) 120ms both" : "none" }} />
          {/* Inner cheese ring highlight */}
          <circle cx={60} cy={50} r={23} fill="none" stroke="#fff2d6" strokeWidth={2} opacity={0.55}
            style={{ ...svgLayer, animation: phase === "assemble" ? "seedPop 0.42s ease 240ms both" : "none" }} />
          {/* Crust outline — draws on */}
          <circle cx={60} cy={50} r={32} fill="none" stroke="#121212" strokeWidth={3.2}
            strokeDasharray={210}
            style={{ ...svgLayer, animation: phase === "assemble" ? "pizzaDraw 0.6s ease 40ms both" : "none" }} />
          {/* Pepperoni */}
          {[
            { cx: 60, cy: 34, d: 360 },
            { cx: 74, cy: 45, d: 410 },
            { cx: 70, cy: 62, d: 460 },
            { cx: 54, cy: 65, d: 510 },
            { cx: 45, cy: 52, d: 560 },
            { cx: 52, cy: 40, d: 610 },
          ].map((p, i) => (
            <circle key={i} cx={p.cx} cy={p.cy} r={4} fill="#b5301a" stroke="#7d1f12" strokeWidth={0.8}
              style={{ ...svgLayer, animation: popAnim(phase, p.d) }} />
          ))}
          {/* Basil leaves */}
          {[
            { cx: 66, cy: 53, d: 440 },
            { cx: 50, cy: 57, d: 500 },
            { cx: 64, cy: 42, d: 560 },
          ].map((b, i) => (
            <ellipse key={`b${i}`} cx={b.cx} cy={b.cy} rx={2.6} ry={1.5} fill="#3f7d4e"
              style={{ ...svgLayer, animation: popAnim(phase, b.d) }} />
          ))}
        </g>
      </svg>
    );
  }

  // Burger (default)
  return (
    <svg width="70" viewBox="0 0 120 100" fill="none" style={{ overflow: "visible" }}>
      {shine}
      <g>
        {/* Bottom bun */}
        <path d="M 26,71 Q 24,71 24,74 Q 24,82 60,82 Q 96,82 96,74 Q 96,71 94,71 Z"
          {...outline} style={{ ...svgLayer, animation: layerAnim(phase, 0) }} />
        {/* Patty */}
        <path d="M 22,60 Q 60,55 98,60 Q 100,62 98,67 Q 60,72 22,67 Q 20,62 22,60 Z"
          {...outline} style={{ ...svgLayer, animation: layerAnim(phase, 100) }} />
        {/* Cheese with drips — the accent */}
        <path d="M 18,53 L 102,53 Q 103,55 101,57 L 96,57 L 91,63 L 86,57 L 71,57 L 67,62 L 62,57 L 46,57 L 42,63 L 37,57 L 19,57 Q 17,55 18,53 Z"
          fill={ACCENTS.burger.fill} stroke="#121212" strokeWidth={2} strokeLinejoin="round" style={{ ...svgLayer, animation: layerAnim(phase, 200) }} />
        {/* Lettuce */}
        <path d="M 15,49 Q 60,44 105,49 Q 107,51 104,53 Q 98,58 93,52 Q 87,58 82,52 Q 76,58 71,52 Q 65,58 60,52 Q 54,58 49,52 Q 43,58 38,52 Q 32,58 27,52 Q 21,58 16,52 Q 13,51 15,49 Z"
          {...outline} style={{ ...svgLayer, animation: layerAnim(phase, 300) }} />
        {/* Top bun */}
        <path d="M 22,47 Q 22,24 60,23 Q 98,24 98,47 Q 98,48 96,48 L 24,48 Q 22,48 22,47 Z"
          {...outline} style={{ ...svgLayer, animation: layerAnim(phase, 400) }} />
        {/* Sesame seeds */}
        {[
          { cx: 48, cy: 36, r: 1.7 },
          { cx: 60, cy: 32, r: 1.8 },
          { cx: 72, cy: 36, r: 1.7 },
          { cx: 54, cy: 41, r: 1.5 },
          { cx: 66, cy: 41, r: 1.5 },
        ].map((s, i) => (
          <ellipse key={i} cx={s.cx} cy={s.cy} rx={s.r} ry={s.r * 0.62} fill="#121212"
            style={{ ...svgLayer, animation: popAnim(phase, 520) }} />
        ))}
      </g>
    </svg>
  );
}

export default function LoadingScreen({
  keepLooping = false,
  transparent = false,
  variant,
}: {
  keepLooping?: boolean;
  // When true the loader has no white backdrop and ignores pointer events, so
  // it floats centered over whatever is behind it (e.g. a page skeleton).
  transparent?: boolean;
  // Force a specific dish (for previews); otherwise read from SITE_CONFIG.
  variant?: Variant;
}) {
  const dish = resolveVariant(variant);

  const [play, setPlay] = useState(false); // start the animation cycle?
  const [phase, setPhase] = useState<Phase>("assemble");
  const [mounted, setMounted] = useState(true);
  const [loopCount, setLoopCount] = useState(0);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const exitRef = useRef(false);
  const decidedOnce = useRef(false);

  // The overlay is rendered from the very first paint (mounted=true on the
  // server too), so the site never flashes behind it. Here we decide, once per
  // browser session, whether to actually run the animation — or, if it already
  // played this session (production only), hide it immediately. The decidedOnce
  // ref guards against React StrictMode's double-invoke in dev.
  useEffect(() => {
    if (decidedOnce.current) return;
    decidedOnce.current = true;

    // In dev, always play so the animation is easy to see while iterating; the
    // once-per-session gate only applies to the real (production) site.
    const isProd = process.env.NODE_ENV === "production";
    if (!keepLooping && isProd) {
      let already = false;
      try {
        already = !!sessionStorage.getItem(SESSION_KEY);
        if (!already) sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        already = false;
      }
      if (already) {
        setMounted(false); // already shown this session — don't play again
        return;
      }
    }
    setPlay(true);
  }, [keepLooping]);

  useEffect(() => {
    if (!play) return;

    const push = (fn: () => void, ms: number) => {
      timers.current.push(setTimeout(fn, ms));
    };

    const cycle = () => {
      setPhase("assemble");
      push(() => setPhase("hold"), T.hold);
      push(() => setPhase("flip"), T.flip);
      push(() => setPhase("holdLogo"), T.holdLogo);
      push(() => {
        if (exitRef.current) {
          setPhase("fadeOut");
          push(() => setMounted(false), 500);
        } else {
          setLoopCount((c) => c + 1);
          cycle();
        }
      }, T.end);
    };

    const requestExit = () => {
      exitRef.current = true;
    };

    if (!keepLooping) {
      if (document.readyState === "complete") requestExit();
      else window.addEventListener("load", requestExit);
    }

    cycle();

    return () => {
      window.removeEventListener("load", requestExit);
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [play, keepLooping]);

  if (!mounted) return null;

  const flipped = phase === "flip" || phase === "holdLogo" || phase === "fadeOut";

  const face: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
  };

  return (
    <>
      <style>{`
        @keyframes layerIn {
          0%   { opacity: 0; transform: translateY(-42px) scale(0.4); }
          70%  { opacity: 1; }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes seedPop { from { opacity: 0; transform: scale(0); } to { opacity: 1; transform: scale(1); } }
        @keyframes pizzaDraw { from { stroke-dashoffset: 210; } to { stroke-dashoffset: 0; } }
        @keyframes pizzaSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes shineOut { 0% { stroke-dashoffset: 20; opacity: 0.2; } 45% { stroke-dashoffset: 0; opacity: 1; } 100% { stroke-dashoffset: -20; opacity: 0; } }
        @keyframes steam { 0% { opacity: 0; transform: translateY(4px); } 40% { opacity: 0.55; } 100% { opacity: 0; transform: translateY(-8px); } }
        @keyframes coinFlip {
          0%   { transform: rotateY(0deg) scale(1); }
          50%  { transform: rotateY(90deg) scale(1.16); }
          100% { transform: rotateY(180deg) scale(1); }
        }
        @keyframes shimmer { 0% { background-position: 140% 0; } 100% { background-position: -140% 0; } }
        @keyframes screenFadeOut { from { opacity: 1; } to { opacity: 0; } }
      `}</style>

      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          backgroundColor: transparent ? "transparent" : "#ffffff",
          pointerEvents: transparent ? "none" : undefined,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "13px",
          fontFamily: "inherit",
          animation: phase === "fadeOut" ? "screenFadeOut 0.5s ease forwards" : undefined,
        }}
      >
        {/* Soft white halo so the loader stays legible over a page skeleton */}
        {transparent && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 240,
              height: 240,
              transform: "translate(-50%, -58%)",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,255,255,0.96) 34%, rgba(255,255,255,0) 72%)",
            }}
          />
        )}
        {/* 3D coin-flip stage: dish on the front, logo on the back */}
        <div style={{ perspective: "560px", width: 88, height: 82, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div
            key={`card-${loopCount}`}
            style={{
              position: "relative",
              width: 74,
              height: 74,
              transformStyle: "preserve-3d",
              animation: flipped ? "coinFlip 0.62s cubic-bezier(0.5,0,0.3,1) forwards" : undefined,
            }}
          >
            {/* FRONT — line-art dish */}
            <div style={face}>
              <FrontArt variant={dish} phase={phase} />
            </div>

            {/* BACK — logo, revealed by the flip */}
            <div style={{ ...face, transform: "rotateY(180deg)" }}>
              <Image
                src="/logo.png"
                alt={NAME}
                width={52}
                height={52}
                priority
                className="select-none rounded-full"
                style={{ width: 52, height: 52, objectFit: "cover" }}
              />
            </div>
          </div>
        </div>

        {/* Shimmering wordmark */}
        <div
          style={{
            fontSize: "0.6rem",
            fontWeight: 700,
            letterSpacing: "0.26em",
            textTransform: "uppercase",
            paddingLeft: "0.26em",
            backgroundImage: "linear-gradient(90deg, #4d4d4d 0%, #4d4d4d 40%, #000000 50%, #4d4d4d 60%, #4d4d4d 100%)",
            backgroundSize: "220% 100%",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            WebkitTextFillColor: "transparent",
            animation: "shimmer 2.2s linear infinite",
          }}
        >
          {NAME}
        </div>
      </div>
    </>
  );
}
