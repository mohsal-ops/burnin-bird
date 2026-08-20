"use client";
// Intro loader. A small line-art dish assembles from its parts, bursts a shine
// outward, then gently floats up and down while a saffron wordmark shimmers
// beneath it. Loops until the page finishes loading, then fades out. Pure CSS,
// no libraries.
//
// The dish is chosen by SITE_CONFIG.loaderStyle so one template serves every
// client: "burger" (fast food), "coffee" (a matcha / latte cup), or "pizza".
// Unknown values fall back to "burger" so template-sync is always safe.
//
// Plays ONCE PER BROWSER SESSION (sessionStorage) - refreshing or moving
// between pages in the same session won't replay it (production only; in dev it
// always plays so it's easy to iterate).

import { useState, useEffect, useRef } from "react";
import { SITE_CONFIG } from "@/lib/siteConfig";

type Phase = "assemble" | "hold" | "fadeOut";
type Variant = "burger" | "coffee" | "pizza" | "bowl";

const SESSION_KEY = "vega:introPlayed";
const NAME = SITE_CONFIG.name;
const TAGLINE = (SITE_CONFIG as { tagline?: string }).tagline || "";
// Brand-tinted shimmer for the wordmark.
const BRAND = (SITE_CONFIG as { primaryColor?: string }).primaryColor || "#eab308";
const BRAND_DEEP = (SITE_CONFIG as { accentColor?: string }).accentColor || "#b8860b";

function resolveVariant(override?: Variant): Variant {
  const raw = override ?? (SITE_CONFIG as { loaderStyle?: string }).loaderStyle;
  return raw === "coffee" || raw === "pizza" || raw === "burger" || raw === "bowl" ? raw : "burger";
}

const ACCENTS: Record<Variant, { fill: string; shine: string }> = {
  burger: { fill: "#FFB800", shine: "#FFB800" },
  coffee: { fill: "#4c8c5a", shine: "#7bb08a" },
  pizza: { fill: "#d94b2b", shine: "#e8834f" },
  bowl: { fill: "#f0dcae", shine: "#e9c78a" },
};

// Shine lines radiating OUTWARD from around the dish (SVG uses overflow:visible).
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
          style={{ opacity: 0, animation: phase === "hold" ? `shineOut 0.6s ease ${l.stagger}ms forwards` : "none" }}
        />
      ))}
    </g>
  );

  if (variant === "coffee") {
    return (
      <svg width="88" viewBox="0 0 120 100" fill="none" style={{ overflow: "visible" }}>
        {shine}
        {/* Steam */}
        {["M 52,40 Q 48,33 52,27 Q 56,20 52,13", "M 60,41 Q 56,33 60,26 Q 64,18 60,10", "M 68,40 Q 64,34 68,28 Q 72,21 68,15"].map((d, i) => (
          <path key={i} d={d} stroke="#121212" strokeWidth={1.5} fill="none" strokeLinecap="round"
            style={{ opacity: 0.45, animation: `steam 2.1s ease-in-out ${500 + i * 260}ms infinite` }} />
        ))}
        <path d="M 42,44 L 78,44 L 74,74 Q 73,79 68,79 L 52,79 Q 47,79 46,74 Z"
          {...outline} style={{ ...svgLayer, animation: layerAnim(phase, 100) }} />
        <path d="M 78,50 Q 90,50 90,59 Q 90,68 78,67" {...outline} style={{ ...svgLayer, animation: layerAnim(phase, 180) }} />
        <ellipse cx={60} cy={44} rx={18} ry={3.8} {...outline} style={{ ...svgLayer, animation: layerAnim(phase, 240) }} />
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

  if (variant === "bowl") {
    return (
      <svg width="92" viewBox="0 0 120 100" fill="none" style={{ overflow: "visible" }}>
        {shine}
        {/* Steam rising off the rice */}
        {["M 52,49 Q 48,42 52,36 Q 56,29 52,22", "M 60,50 Q 56,42 60,35 Q 64,27 60,19", "M 68,49 Q 64,43 68,37 Q 72,30 68,24"].map((d, i) => (
          <path key={i} d={d} stroke="#121212" strokeWidth={1.5} fill="none" strokeLinecap="round"
            style={{ opacity: 0.45, animation: `steam 2.1s ease-in-out ${500 + i * 260}ms infinite` }} />
        ))}
        {/* Foot */}
        <ellipse cx={60} cy={84} rx={11} ry={2.6} {...outline} style={{ ...svgLayer, animation: layerAnim(phase, 0) }} />
        {/* Bowl body */}
        <path d="M 33,60 Q 60,89 87,60" {...outline} style={{ ...svgLayer, animation: layerAnim(phase, 100) }} />
        {/* Rim */}
        <ellipse cx={60} cy={60} rx={27} ry={5} {...outline} style={{ ...svgLayer, animation: layerAnim(phase, 180) }} />
        {/* Rice mound */}
        <path d="M 37,59 Q 40,50 47,53 Q 51,44 59,49 Q 65,43 71,49 Q 78,49 82,55 Q 85,56 83,59 Z"
          fill={accent.fill} stroke="#121212" strokeWidth={1.6} strokeLinejoin="round"
          style={{ ...svgLayer, animation: layerAnim(phase, 240) }} />
        {/* Garnish bits */}
        <g style={{ ...svgLayer, animation: popAnim(phase, 520) }}>
          <ellipse cx={52} cy={51} rx={2.4} ry={1.4} fill="#4c8c5a" />
          <ellipse cx={64} cy={49} rx={2} ry={1.8} fill="#d94b2b" />
          <ellipse cx={58} cy={53} rx={1.8} ry={1.8} fill="#e0a63c" />
          <ellipse cx={72} cy={53} rx={2.1} ry={1.3} fill="#4c8c5a" />
        </g>
      </svg>
    );
  }

  if (variant === "pizza") {
    return (
      <svg width="90" viewBox="0 0 120 100" fill="none" style={{ overflow: "visible" }}>
        {shine}
        <g style={{ transformBox: "fill-box", transformOrigin: "center" }}>
          <circle cx={60} cy={50} r={28} fill={accent.fill}
            style={{ ...svgLayer, animation: phase === "assemble" ? "seedPop 0.42s cubic-bezier(0.34,1.56,0.64,1) 120ms both" : "none" }} />
          <circle cx={60} cy={50} r={23} fill="none" stroke="#fff2d6" strokeWidth={2} opacity={0.55}
            style={{ ...svgLayer, animation: phase === "assemble" ? "seedPop 0.42s ease 240ms both" : "none" }} />
          <circle cx={60} cy={50} r={32} fill="none" stroke="#121212" strokeWidth={3.2}
            strokeDasharray={210}
            style={{ ...svgLayer, animation: phase === "assemble" ? "pizzaDraw 0.6s ease 40ms both" : "none" }} />
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
    <svg width="88" viewBox="0 0 120 100" fill="none" style={{ overflow: "visible" }}>
      {shine}
      <g>
        <path d="M 26,71 Q 24,71 24,74 Q 24,82 60,82 Q 96,82 96,74 Q 96,71 94,71 Z"
          {...outline} style={{ ...svgLayer, animation: layerAnim(phase, 0) }} />
        <path d="M 22,60 Q 60,55 98,60 Q 100,62 98,67 Q 60,72 22,67 Q 20,62 22,60 Z"
          {...outline} style={{ ...svgLayer, animation: layerAnim(phase, 100) }} />
        <path d="M 18,53 L 102,53 Q 103,55 101,57 L 96,57 L 91,63 L 86,57 L 71,57 L 67,62 L 62,57 L 46,57 L 42,63 L 37,57 L 19,57 Q 17,55 18,53 Z"
          fill={ACCENTS.burger.fill} stroke="#121212" strokeWidth={2} strokeLinejoin="round" style={{ ...svgLayer, animation: layerAnim(phase, 200) }} />
        <path d="M 15,49 Q 60,44 105,49 Q 107,51 104,53 Q 98,58 93,52 Q 87,58 82,52 Q 76,58 71,52 Q 65,58 60,52 Q 54,58 49,52 Q 43,58 38,52 Q 32,58 27,52 Q 21,58 16,52 Q 13,51 15,49 Z"
          {...outline} style={{ ...svgLayer, animation: layerAnim(phase, 300) }} />
        <path d="M 22,47 Q 22,24 60,23 Q 98,24 98,47 Q 98,48 96,48 L 24,48 Q 22,48 22,47 Z"
          {...outline} style={{ ...svgLayer, animation: layerAnim(phase, 400) }} />
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
  transparent?: boolean;
  variant?: Variant;
}) {
  const dish = resolveVariant(variant);

  const [play, setPlay] = useState(false);
  const [phase, setPhase] = useState<Phase>("assemble");
  const [mounted, setMounted] = useState(true);
  const reduce = useRef(false);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const decidedOnce = useRef(false);

  // Decide once per session whether to play (production gate). Rendering the
  // overlay by default keeps the page from flashing behind it.
  useEffect(() => {
    if (decidedOnce.current) return;
    decidedOnce.current = true;
    reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
        setMounted(false);
        return;
      }
    }
    setPlay(true);
  }, [keepLooping]);

  // assemble → hold (shine) → gentle float. The intro is allowed to leave only
  // once it has BOTH played its full minimum cycle AND the page has loaded - so
  // a fast load never cuts the animation short.
  useEffect(() => {
    if (!play) return;
    const push = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));

    // Full choreography: assemble (~1s) → shine (~0.6s) → a beat of float.
    const MIN_SHOW_MS = 2600;

    push(() => setPhase("hold"), 1000);

    let exited = false;
    const leave = () => {
      if (exited || keepLooping) return;
      exited = true;
      setPhase("fadeOut");
      push(() => setMounted(false), 520);
    };

    let loaded = document.readyState === "complete";
    let minDone = false;
    const maybeLeave = () => {
      if (loaded && minDone) leave();
    };

    const onLoad = () => {
      loaded = true;
      maybeLeave();
    };
    if (!keepLooping && !loaded) window.addEventListener("load", onLoad);

    push(() => {
      minDone = true;
      maybeLeave();
    }, MIN_SHOW_MS);

    // Safety net: never hang past this even if `load` never fires.
    const cap = setTimeout(leave, 8000);

    return () => {
      clearTimeout(cap);
      window.removeEventListener("load", onLoad);
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [play, keepLooping]);

  if (!mounted) return null;

  const floating = !reduce.current;

  return (
    <>
      <style>{`
        @keyframes layerIn { 0%{opacity:0;transform:translateY(-42px) scale(0.4)} 70%{opacity:1} 100%{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes seedPop { from{opacity:0;transform:scale(0)} to{opacity:1;transform:scale(1)} }
        @keyframes pizzaDraw { from{stroke-dashoffset:210} to{stroke-dashoffset:0} }
        @keyframes shineOut { 0%{stroke-dashoffset:20;opacity:0.2} 45%{stroke-dashoffset:0;opacity:1} 100%{stroke-dashoffset:-20;opacity:0} }
        @keyframes steam { 0%{opacity:0;transform:translateY(4px)} 40%{opacity:0.55} 100%{opacity:0;transform:translateY(-8px)} }
        @keyframes floatBob { 0%,100%{transform:translateY(4px)} 50%{transform:translateY(-6px)} }
        @keyframes wordShimmer { 0%{background-position:150% 0} 100%{background-position:-150% 0} }
        @keyframes screenFadeOut { from{opacity:1} to{opacity:0} }
        @keyframes cardIn { from{opacity:0;transform:scale(0.9)} to{opacity:1;transform:scale(1)} }
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
          gap: "18px",
          fontFamily: "inherit",
          animation: phase === "fadeOut" ? "screenFadeOut 0.5s ease forwards" : undefined,
        }}
      >
        {/* Soft brand halo behind the dish */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 300,
            height: 300,
            transform: "translate(-50%, -62%)",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${BRAND}22 0%, ${BRAND}00 66%)`,
            pointerEvents: "none",
          }}
        />

        {/* Dish - assembles, then gently floats up and down */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 120,
            height: 96,
            animation: floating && phase !== "assemble" ? "floatBob 3s ease-in-out infinite" : undefined,
            filter: `drop-shadow(0 8px 16px ${BRAND}33)`,
          }}
        >
          <FrontArt variant={dish} phase={phase} />
        </div>

        {/* Noticeable, shimmering brand wordmark */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, animation: "cardIn 0.6s ease 0.3s both" }}>
          <div
            style={{
              fontSize: "clamp(1.05rem, 4.4vw, 1.5rem)",
              fontWeight: 800,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              paddingLeft: "0.14em",
              textAlign: "center",
              backgroundImage: `linear-gradient(100deg, ${BRAND_DEEP} 0%, ${BRAND_DEEP} 38%, #fff2c4 50%, ${BRAND} 62%, ${BRAND_DEEP} 100%)`,
              backgroundSize: "240% 100%",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              WebkitTextFillColor: "transparent",
              animation: floating ? "wordShimmer 2.6s linear infinite" : undefined,
            }}
          >
            {NAME}
          </div>
          {TAGLINE && (
            <div
              style={{
                fontSize: "0.66rem",
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#9a8f80",
                textAlign: "center",
              }}
            >
              {TAGLINE}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
