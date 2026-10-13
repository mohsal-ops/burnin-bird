"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, Share, PlusSquare, Download, MoreVertical, Compass, Check } from "lucide-react";
import { isIOS, isStandalone, registerSW } from "@/lib/pwa/client";

// Mounted in the public layout ONLY when the "pwa" flag is on (the owner has
// the app). Adds the manifest + iOS tags, registers the service worker, and
// shows a small "Get the app" button on phones:
//   - Android/Chrome: one tap opens the real install prompt.
//   - iPhone: Apple allows no one-tap install, so it opens a short visual
//     guide pointing at Share → "Add to Home Screen".
//   - Instagram/Facebook in-app browsers can't install: it tells them to open
//     the page in Safari/Chrome first.
// Closing the button hides it for 7 days. Any other button can open it with
// window.dispatchEvent(new Event("sv:install")).

const DISMISS_KEY = "sv_install_dismissed";
export const ORDERED_KEY = "sv_ordered";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
type Mode = "ios" | "inapp" | "android-menu";

function addHead(tag: string, attrs: Record<string, string>) {
  const sel = `${tag}[${Object.entries(attrs).map(([k, v]) => `${k}="${v}"`)[0]}]`;
  if (document.head.querySelector(sel)) return;
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  document.head.appendChild(el);
}

const inAppBrowser = () => /Instagram|FBAN|FBAV|Line\/|TikTok|Snapchat/i.test(navigator.userAgent);
const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || isIOS();

export default function PwaBoot({ name }: { name: string }) {
  const deferred = useRef<BIPEvent | null>(null);
  const [pill, setPill] = useState(false);
  const [guide, setGuide] = useState<Mode | null>(null);
  const [installed, setInstalled] = useState(false);

  const open = useCallback(async () => {
    if (inAppBrowser()) return setGuide("inapp");
    if (isIOS()) return setGuide("ios");
    const d = deferred.current;
    if (d) {
      deferred.current = null; // a prompt can only be used once
      await d.prompt();
      const choice = await d.userChoice.catch(() => null);
      if (choice?.outcome === "accepted") {
        setInstalled(true);
        setPill(false);
      }
      return;
    }
    setGuide("android-menu");
  }, []);

  useEffect(() => {
    addHead("link", { rel: "manifest", href: "/app.webmanifest" });
    addHead("link", { rel: "apple-touch-icon", href: "/api/pwa/icon/180" });
    addHead("meta", { name: "apple-mobile-web-app-capable", content: "yes" });
    addHead("meta", { name: "apple-mobile-web-app-title", content: name });
    void registerSW();
    if (isStandalone()) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      deferred.current = e as BIPEvent;
    };
    const onInstalled = () => {
      setInstalled(true);
      setPill(false);
      setGuide(null);
    };
    const onOpen = () => void open();
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("sv:install", onOpen);

    let dismissedAt = 0;
    try {
      dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    } catch {
      /* storage blocked: still show */
    }
    const t = isMobile() && Date.now() - dismissedAt > 7 * 86400_000 ? setTimeout(() => setPill(true), 2500) : undefined;
    return () => {
      clearTimeout(t);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("sv:install", onOpen);
    };
  }, [name, open]);

  const dismiss = () => {
    setPill(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <AnimatePresence>
        {pill && !installed && !guide && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="sv-float-bottom fixed bottom-20 left-3 z-[60] flex items-center gap-1 rounded-full bg-stone-900 py-1.5 pl-1.5 pr-1 text-white shadow-xl md:hidden"
          >
            <button type="button" onClick={() => void open()} className="flex items-center gap-2 rounded-full pr-2 text-sm font-semibold">
              <img src="/api/pwa/icon/192" alt="" className="h-8 w-8 rounded-[10px]" />
              Get the app
            </button>
            <button type="button" onClick={dismiss} aria-label="Hide" className="grid h-8 w-8 place-items-center rounded-full text-white/60 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {guide && (
          <motion.div className="fixed inset-0 z-[120]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button type="button" aria-label="Close" onClick={() => setGuide(null)} className="absolute inset-0 bg-black/55" />
            <motion.div
              role="dialog"
              aria-label="Add the app to your phone"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 34 }}
              className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white px-5 pb-[calc(56px+env(safe-area-inset-bottom))] pt-5 text-stone-900"
            >
              <button type="button" onClick={() => setGuide(null)} aria-label="Close" className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-stone-100">
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-3 pr-10">
                <img src="/api/pwa/icon/192" alt="" className="h-14 w-14 rounded-2xl shadow" />
                <div>
                  <p className="text-lg font-extrabold leading-tight">Get the {name} app</p>
                  <p className="text-sm text-stone-500">Free. No app store. Takes 5 seconds.</p>
                </div>
              </div>

              {guide === "inapp" ? (
                <Steps
                  steps={[
                    { icon: <MoreVertical className="h-5 w-5" />, text: "Tap the ••• menu at the top of this screen" },
                    { icon: <Compass className="h-5 w-5" />, text: isIOS() ? "Pick “Open in Safari”" : "Pick “Open in browser”" },
                    { icon: <Download className="h-5 w-5" />, text: "Then tap “Get the app” again" },
                  ]}
                />
              ) : guide === "ios" ? (
                <Steps
                  steps={[
                    { icon: <Share className="h-5 w-5" />, text: "Tap the Share button at the bottom (on newer iPhones, tap ••• first)" },
                    { icon: <PlusSquare className="h-5 w-5" />, text: "Scroll down and tap “Add to Home Screen”" },
                    { icon: <Check className="h-5 w-5" />, text: "Tap “Add”. Done!" },
                  ]}
                />
              ) : (
                <Steps
                  steps={[
                    { icon: <MoreVertical className="h-5 w-5" />, text: "Tap the ⋮ menu at the top right of your browser" },
                    { icon: <PlusSquare className="h-5 w-5" />, text: "Tap “Add to Home screen” or “Install app”" },
                    { icon: <Check className="h-5 w-5" />, text: "Tap “Install”. Done!" },
                  ]}
                />
              )}

              {guide === "ios" && (
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute bottom-[calc(8px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 text-[var(--brand,#111)]"
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                >
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 4v15" />
                    <path d="m6 13 6 6 6-6" />
                  </svg>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Steps({ steps }: { steps: { icon: React.ReactNode; text: string }[] }) {
  return (
    <ol className="mt-5 flex flex-col gap-3">
      {steps.map((s, i) => (
        <motion.li
          key={i}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.12 + i * 0.12 }}
          className="flex items-center gap-3 rounded-2xl bg-stone-100 px-4 py-3"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--brand,#111)] text-[var(--brand-foreground,#fff)]">{s.icon}</span>
          <span className="text-[15px] font-semibold leading-snug">
            <span className="mr-1 text-stone-400">{i + 1}.</span>
            {s.text}
          </span>
        </motion.li>
      ))}
    </ol>
  );
}
