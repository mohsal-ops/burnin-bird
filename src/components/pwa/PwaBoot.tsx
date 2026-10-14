"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { X, Share, PlusSquare, Download, MoreVertical, MoreHorizontal, Compass, Check, ChevronRight } from "lucide-react";
import { isIOS, isStandalone, registerSW } from "@/lib/pwa/client";

// Mounted in the public layout ONLY when the "pwa" flag is on (the owner has
// the app). Adds the manifest + iOS tags, registers the service worker, and
// shows a permanent bottom bar on phones - "Get the app" + "Order online"
// (inspired by the best restaurant sites: always there, never a nagging popup):
//   - Android/Chrome: one tap opens the real install prompt.
//   - iPhone: Apple allows no one-tap install, so it opens a short visual
//     guide pointing at Share → "Add to Home Screen".
//   - Instagram/Facebook in-app browsers can't install: it tells them to open
//     the page in Safari/Chrome first.
// Hidden on the menu/checkout/account pages and inside the installed app.
// Any other button can open the install flow with
// window.dispatchEvent(new Event("sv:install")).

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
// Which iPhone browser + layout, so the guide names the exact buttons.
// Safari 26 (iOS 26) moved Share into the ••• menu at the bottom right.
type IosKind = "safari26" | "safari" | "chrome" | "other";
const iosKind = (): IosKind => {
  const ua = navigator.userAgent;
  if (/CriOS/i.test(ua)) return "chrome";
  if (/FxiOS|EdgiOS|OPiOS/i.test(ua)) return "other";
  const v = Number((ua.match(/Version\/(\d+)/) || [])[1] || (ua.match(/OS (\d+)_/) || [])[1] || 0);
  return v >= 26 ? "safari26" : "safari";
};
const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || isIOS();

export default function PwaBoot({ name, iconV = "" }: { name: string; iconV?: string }) {
  const icon = (size: number) => `/api/pwa/icon/${size}?v=${iconV}`;
  const deferred = useRef<BIPEvent | null>(null);
  const [bar, setBar] = useState(false);
  const pathname = usePathname() || "/";
  const [guide, setGuide] = useState<Mode | null>(null);
  const [installed, setInstalled] = useState(false);
  const [kind, setKind] = useState<IosKind>("safari");

  const open = useCallback(async () => {
    if (inAppBrowser()) return setGuide("inapp");
    if (isIOS()) {
      setKind(iosKind());
      return setGuide("ios");
    }
    const d = deferred.current;
    if (d) {
      deferred.current = null; // a prompt can only be used once
      await d.prompt();
      const choice = await d.userChoice.catch(() => null);
      if (choice?.outcome === "accepted") setInstalled(true);
      return;
    }
    setGuide("android-menu");
  }, []);

  useEffect(() => {
    addHead("link", { rel: "manifest", href: "/app.webmanifest" });
    addHead("link", { rel: "apple-touch-icon", href: icon(180) });
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
      setGuide(null);
    };
    const onOpen = () => void open();
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("sv:install", onOpen);

    setBar(isMobile());
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("sv:install", onOpen);
    };
  }, [name, open]);

  // Pages that already have their own bottom actions.
  const hideHere = /^\/(menu|stripe|account|checkout|catering)/i.test(pathname);
  const showBar = bar && !installed && !hideHere;
  useEffect(() => {
    document.documentElement.classList.toggle("sv-orderbar", showBar);
    return () => document.documentElement.classList.remove("sv-orderbar");
  }, [showBar]);

  return (
    <>
      <AnimatePresence>
        {showBar && (
          <motion.div
            initial={{ y: 90 }}
            animate={{ y: 0 }}
            exit={{ y: 90 }}
            transition={{ type: "spring", stiffness: 380, damping: 34, delay: 0.4 }}
            className="sv-orderbar fixed inset-x-0 bottom-0 z-[60] grid grid-cols-2 gap-2 border-t border-border bg-background/90 px-3 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2.5 backdrop-blur md:hidden"
          >
            <button
              type="button"
              onClick={() => void open()}
              className="flex h-12 items-center justify-center gap-1.5 rounded-2xl border border-border bg-background text-[15px] font-semibold text-foreground active:scale-[0.98]"
            >
              <img src={icon(192)} alt="" className="h-6 w-6 rounded-md" />
              Get the app
              <ChevronRight className="h-4 w-4 opacity-50" />
            </button>
            <Link
              href="/Menu"
              className="flex h-12 items-center justify-center rounded-2xl bg-[var(--brand,#111)] text-[15px] font-bold text-[var(--brand-foreground,#fff)] active:scale-[0.98]"
            >
              Order online
            </Link>
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
                <img src={icon(192)} alt="" className="h-14 w-14 rounded-2xl shadow" />
                <div>
                  <p className="text-lg font-extrabold leading-tight">Get the {name} app</p>
                  <p className="text-sm text-stone-500">Free. No app store. Takes 5 seconds.</p>
                </div>
              </div>

              {guide === "inapp" ? (
                <Steps
                  steps={[
                    { icon: <MoreVertical className="h-5 w-5" />, text: "Tap the ••• menu at the top of this screen" },
                    { icon: <Compass className="h-5 w-5" />, text: "Pick “Open in external browser” (or “Open in Safari”)" },
                    { icon: <Download className="h-5 w-5" />, text: "Then tap “Get the app” again" },
                  ]}
                />
              ) : guide === "ios" ? (
                <Steps
                  steps={
                    kind === "chrome"
                      ? [
                          { icon: <Share className="h-5 w-5" />, text: "Tap the Share icon at the top right, next to the web address" },
                          { icon: <PlusSquare className="h-5 w-5" />, text: "Tap “Add to Home Screen” (tap “More” if you don't see it)" },
                          { icon: <Check className="h-5 w-5" />, text: "Tap “Add”. Done!" },
                        ]
                      : kind === "safari26"
                        ? [
                            { icon: <MoreHorizontal className="h-5 w-5" />, text: "Tap the ••• button at the bottom right of Safari" },
                            { icon: <Share className="h-5 w-5" />, text: "Tap “Share”" },
                            { icon: <PlusSquare className="h-5 w-5" />, text: "Scroll down, tap “Add to Home Screen” (it may be under “View More”)" },
                            { icon: <Check className="h-5 w-5" />, text: "Tap “Add”. Done!" },
                          ]
                        : kind === "other"
                          ? [
                              { icon: <MoreHorizontal className="h-5 w-5" />, text: "Open your browser's menu (••• or ☰)" },
                              { icon: <Share className="h-5 w-5" />, text: "Tap “Share”" },
                              { icon: <PlusSquare className="h-5 w-5" />, text: "Tap “Add to Home Screen”, then “Add”" },
                            ]
                          : [
                              { icon: <Share className="h-5 w-5" />, text: "Tap the Share button at the bottom of Safari" },
                              { icon: <PlusSquare className="h-5 w-5" />, text: "Scroll down and tap “Add to Home Screen”" },
                              { icon: <Check className="h-5 w-5" />, text: "Tap “Add”. Done!" },
                            ]
                  }
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


            </motion.div>
            {guide === "ios" && kind !== "other" && (
              <motion.div
                aria-hidden
                className={`pointer-events-none fixed z-[121] text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] ${
                  kind === "chrome"
                    ? "right-4 top-2"
                    : kind === "safari26"
                      ? "bottom-[calc(4px+env(safe-area-inset-bottom))] right-5"
                      : "bottom-[calc(4px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2"
                }`}
                animate={{ y: kind === "chrome" ? [0, -10, 0] : [0, 10, 0] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
              >
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" style={{ transform: kind === "chrome" ? "rotate(180deg)" : undefined }}>
                  <path d="M12 4v15" />
                  <path d="m6 13 6 6 6-6" />
                </svg>
              </motion.div>
            )}
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
