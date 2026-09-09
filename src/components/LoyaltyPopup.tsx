"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import LogoDriftBackground from "@/app/(customerFacing)/_components/LogoDriftBackground";
import LoyaltySignupForm from "@/app/(customerFacing)/rewards/_components/LoyaltySignupForm";

// Two-step rewards popup: a teaser whose headline IS the incentive, then the
// same card morphs into the shared LoyaltySignupForm, then a short celebration.
// Reuses LogoDriftBackground so it belongs to the site, not a generic plugin.
// Renders nothing unless the loyalty add-on is on; suppressed on /rewards
// (redundant) and checkout (don't compete with a payment). Shows once ~12s
// after load, then a localStorage flag keeps it from nagging.

const STORAGE_KEY = "sj_loyalty_popup_v2";
const DELAY_MS = 12000;
const DAY = 86_400_000;

type Suppression = { until: number; count: number; completed?: boolean };

function readSuppression(): Suppression | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Suppression) : null;
  } catch {
    return null;
  }
}
function writeSuppression(s: Suppression) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* private mode / blocked storage - worst case it shows again next visit */
  }
}

// Restrained success garnish - a handful of emoji fanning out and fading in
// well under a second. Not a confetti cannon.
function Burst({ reduce }: { reduce: boolean | null }) {
  if (reduce) return null;
  const bits = ["🔥", "🍗", "✨", "⭐", "🎉", "🤤"];
  const n = 12;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
      {Array.from({ length: n }).map((_, i) => {
        const angle = (i / n) * Math.PI * 2;
        const dist = 80 + (i % 3) * 26;
        return (
          <motion.span
            key={i}
            className="absolute text-xl"
            initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
            animate={{ opacity: 0, scale: 1.25, x: Math.cos(angle) * dist, y: Math.sin(angle) * dist }}
            transition={{ duration: 0.7, delay: (i % 4) * 0.03, ease: "easeOut" }}
          >
            {bits[i % bits.length]}
          </motion.span>
        );
      })}
    </div>
  );
}

export default function LoyaltyPopup({
  loyaltyEnabled,
  popupEnabled = true,
  consentText,
  incentive,
  name = "our",
}: {
  loyaltyEnabled: boolean;
  popupEnabled?: boolean;
  consentText: string;
  incentive: string;
  name?: string;
}) {
  const reduce = useReducedMotion();
  const pathname = usePathname() || "";
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"teaser" | "form" | "success">("teaser");

  // The whole popup is off unless the add-on AND its dedicated popup toggle are
  // on; also never on /rewards, checkout, or admin.
  const active = loyaltyEnabled && popupEnabled;
  const suppressedRoute =
    pathname === "/rewards" || /\/purchase(\/|$)/.test(pathname) || pathname.startsWith("/admin");

  // Arm the one-shot timer (once per mount). Layout persists across customer
  // route changes, so this fires a single time per session.
  useEffect(() => {
    if (!active || suppressedRoute) return;
    const s = readSuppression();
    if (s?.completed) return;
    if (s && Date.now() < s.until) return;
    const t = setTimeout(() => setOpen(true), DELAY_MS);
    return () => clearTimeout(t);
  }, [active, suppressedRoute]);

  // Auto-close the celebration after a beat (manual close is available too).
  useEffect(() => {
    if (step !== "success") return;
    const t = setTimeout(() => finishCompleted(), 3000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Soft dismiss (X / backdrop / "No thanks"): back off, longer if they've now
  // brushed it aside more than once.
  const softDismiss = () => {
    const prev = readSuppression();
    const count = (prev?.count ?? 0) + 1;
    writeSuppression({ until: Date.now() + (count >= 2 ? 30 : 7) * DAY, count });
    setOpen(false);
  };
  // Completed a signup (or acknowledged success): don't show again for a year.
  const finishCompleted = () => {
    writeSuppression({ until: Date.now() + 365 * DAY, count: 99, completed: true });
    setOpen(false);
  };

  if (!active || suppressedRoute) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            aria-hidden
            className="absolute inset-0 bg-black/50"
            onClick={softDismiss}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            layout
            role="dialog"
            aria-modal="true"
            aria-label="Southern Jerks Rewards"
            className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-background shadow-2xl ring-1 ring-black/10"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 60, scale: 0.96 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.98 }}
            transition={reduce ? { duration: 0.2 } : { type: "spring", stiffness: 300, damping: 24 }}
          >
            <LogoDriftBackground veilClassName="bg-background/95" className="rounded-3xl" />

            <button
              type="button"
              onClick={softDismiss}
              aria-label="Close"
              className="absolute right-3 top-3 z-20 grid size-8 place-items-center rounded-full text-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
            >
              ✕
            </button>

            {/* Steps cross-fade in place (default "sync" mode): the next step
                mounts immediately rather than waiting on the previous step's
                exit - a true cross-fade, and it never stalls if the tab is
                backgrounded mid-transition (paused rAF can't complete an exit). */}
            <div className="relative z-10 grid p-6 sm:p-8 [&>*]:col-start-1 [&>*]:row-start-1">
              <AnimatePresence>
                {step === "teaser" && (
                  <motion.div
                    key="teaser"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="text-center"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                      {name} Rewards
                    </p>
                    <h2 className="mt-3 text-4xl font-extrabold leading-[1.05] text-brand sm:text-5xl">
                      Join the club.
                    </h2>
                    <p className="mt-3 text-base font-semibold text-stone-700">
                      Sign up for {incentive}.
                    </p>
                    <div className="mt-6 flex flex-col items-center gap-3">
                      <Button variant="mainButton" size="lg" className="w-full" onClick={() => setStep("form")}>
                        I&apos;m in 🔥
                      </Button>
                      <button
                        type="button"
                        onClick={softDismiss}
                        className="text-sm font-medium text-stone-500 underline underline-offset-4 hover:text-stone-700"
                      >
                        No thanks
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === "form" && (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <LoyaltySignupForm
                      loyaltyEnabled
                      consentText={consentText}
                      incentive={incentive}
                      onSuccess={() => setStep("success")}
                    />
                  </motion.div>
                )}

                {step === "success" && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative text-center"
                  >
                    <Burst reduce={reduce} />
                    <p className="text-4xl">🎉</p>
                    <h2 className="mt-2 text-2xl font-extrabold text-stone-800">You&apos;re in!</h2>
                    <p className="mt-1 text-sm text-stone-600">
                      Watch your phone or inbox for {incentive}.
                    </p>
                    <Button variant="mainButton" size="md" className="mt-5" onClick={finishCompleted}>
                      Awesome, thanks
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
