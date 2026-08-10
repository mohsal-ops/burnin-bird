"use client";
// Branded "opening screen" loader. The restaurant's logo is the hero: it fades
// and scales into view, then gently floats while tiny brand-colored particles
// drift around it. When the page is ready it lifts up and fades out. No spinner,
// no continuous rotation. Driven by SITE_CONFIG so one template serves every
// client, with graceful fallbacks so a clone missing a field still works.
//
// Keeps the existing shell behavior: plays once per browser session (prod),
// every load in dev, renders from the first paint (server too) so the page never
// flashes behind it, and is StrictMode-safe.

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { SITE_CONFIG } from "@/lib/siteConfig";

const SESSION_KEY = "vega:introPlayed";

// Optional loader fields are read defensively so the config architecture stays
// intact — a clone that doesn't set them still gets a good default.
const cfg = SITE_CONFIG as {
  name: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  loaderBackground?: string;
  loaderLogo?: string;
  loaderMessage?: string;
};

const NAME = cfg.name;
const PRIMARY = cfg.primaryColor || "#c85a1e";
const SECONDARY = cfg.secondaryColor || PRIMARY;
const ACCENT = cfg.accentColor || cfg.secondaryColor || PRIMARY;
const BG = cfg.loaderBackground || "#ffffff";
const LOGO = cfg.loaderLogo || "/logo.png";
const MESSAGE = cfg.loaderMessage || "";

// Tiny decorative particles around the brand mark. Each drifts and fades on its
// own timer so the motion reads as organic, not mechanical.
const PARTICLES: { x: number; y: number; s: number; delay: number; dur: number; c: string }[] = [
  { x: -80, y: -32, s: 6, delay: 0.0, dur: 2.6, c: PRIMARY },
  { x: 84, y: -18, s: 5, delay: 0.5, dur: 3.0, c: ACCENT },
  { x: -62, y: 46, s: 5, delay: 0.9, dur: 2.8, c: SECONDARY },
  { x: 72, y: 50, s: 7, delay: 0.2, dur: 3.2, c: PRIMARY },
  { x: 2, y: -74, s: 4, delay: 1.1, dur: 2.4, c: ACCENT },
  { x: -98, y: 6, s: 4, delay: 0.7, dur: 3.1, c: SECONDARY },
  { x: 100, y: 26, s: 5, delay: 0.35, dur: 2.7, c: PRIMARY },
  { x: 22, y: 74, s: 4, delay: 1.0, dur: 2.9, c: ACCENT },
];

export default function LoadingScreen({
  keepLooping = false,
  transparent = false,
}: {
  keepLooping?: boolean;
  // Floats over whatever is behind it with no backdrop (e.g. the /loading-test
  // preview). The layouts use the solid variant.
  transparent?: boolean;
}) {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(true);
  const [play, setPlay] = useState(false);
  const [exiting, setExiting] = useState(false);
  const decidedOnce = useRef(false);

  // Decide once per session whether to play. Rendering the overlay by default
  // (mounted=true, on the server too) keeps the page from flashing behind it;
  // if it already played this session (prod only) we just hide it. The ref
  // guards React StrictMode's double-invoke in dev.
  useEffect(() => {
    if (decidedOnce.current) return;
    decidedOnce.current = true;

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

  // Exit once the page has finished loading. A safety cap guarantees we never
  // get stuck, and we hold the entrance for a beat on already-loaded pages so it
  // never just flickers.
  useEffect(() => {
    if (!play || keepLooping) return;
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        setExiting(true);
      }
    };
    const cap = setTimeout(finish, 6000);
    if (document.readyState === "complete") {
      const hold = setTimeout(finish, 1100);
      return () => {
        clearTimeout(cap);
        clearTimeout(hold);
      };
    }
    window.addEventListener("load", finish);
    return () => {
      clearTimeout(cap);
      window.removeEventListener("load", finish);
    };
  }, [play, keepLooping]);

  if (!mounted) return null;

  const logoInitial = reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 };

  return (
    <AnimatePresence onExitComplete={() => setMounted(false)}>
      {!exiting && (
        <motion.div
          key="brand-loader"
          role="status"
          aria-label={`Loading ${NAME}`}
          initial={false}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.42, ease: "easeInOut" }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
            background: transparent ? "transparent" : BG,
            pointerEvents: transparent ? "none" : "auto",
            fontFamily: "inherit",
          }}
        >
          {/* Soft glow behind the mark */}
          {!reduce && (
            <motion.div
              aria-hidden
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 0.55, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{
                position: "absolute",
                width: 280,
                height: 280,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${PRIMARY}22 0%, ${PRIMARY}00 68%)`,
                filter: "blur(4px)",
              }}
            />
          )}

          {/* Floating group: particles + logo */}
          <motion.div
            animate={reduce ? { y: 0 } : { y: [0, -6, 0] }}
            transition={
              reduce
                ? { duration: 0 }
                : { duration: 2.6, ease: "easeInOut", repeat: Infinity }
            }
            exit={{ y: -14, opacity: 0, transition: { duration: 0.35, ease: "easeInOut" } }}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {!reduce &&
              PARTICLES.map((p, i) => (
                <motion.span
                  key={i}
                  aria-hidden
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.85, 0], y: [0, -6, 0], scale: [0.7, 1, 0.7] }}
                  transition={{
                    duration: p.dur,
                    delay: p.delay,
                    ease: "easeInOut",
                    repeat: Infinity,
                  }}
                  style={{
                    position: "absolute",
                    left: `calc(50% + ${p.x}px)`,
                    top: `calc(50% + ${p.y}px)`,
                    width: p.s,
                    height: p.s,
                    marginLeft: -p.s / 2,
                    marginTop: -p.s / 2,
                    borderRadius: "50%",
                    background: p.c,
                  }}
                />
              ))}

            <motion.div
              initial={logoInitial}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: reduce ? 0.3 : 0.55, ease: [0.22, 1, 0.36, 1] }}
              style={{ position: "relative", zIndex: 2 }}
            >
              <Image
                src={LOGO}
                alt={NAME}
                width={96}
                height={96}
                priority
                className="select-none rounded-full"
                style={{ width: 96, height: 96, objectFit: "cover" }}
              />
            </motion.div>
          </motion.div>

          {/* Brand name (falls back to being the hero if no logo renders) */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0.3 : 0.6, delay: reduce ? 0 : 0.25, ease: "easeOut" }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
          >
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                paddingLeft: "0.28em",
                color: ACCENT,
              }}
            >
              {NAME}
            </span>
            {MESSAGE && (
              <span style={{ fontSize: "0.66rem", letterSpacing: "0.05em", color: `${ACCENT}99` }}>
                {MESSAGE}
              </span>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
