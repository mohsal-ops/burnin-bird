"use client";

import { useEffect, useState } from "react";
import { X, Share, PlusSquare, Download } from "lucide-react";
import { isIOS, isStandalone, registerSW } from "@/lib/pwa/client";

// Mounted in the public layout ONLY when the "pwa" flag is on. Adds the
// manifest + iOS tags, registers the service worker, and shows a small
// "add to home screen" card on the visitor's 2nd+ visit or right after their
// first order (not on a first look). Dismissal remembered 30 days.

const DISMISS_KEY = "sv_install_dismissed";
const VISITS_KEY = "sv_visits";
export const ORDERED_KEY = "sv_ordered";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

function addHead(tag: string, attrs: Record<string, string>) {
  const sel = `${tag}[${Object.entries(attrs).map(([k, v]) => `${k}="${v}"`)[0]}]`;
  if (document.head.querySelector(sel)) return;
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  document.head.appendChild(el);
}

export default function PwaBoot({ name }: { name: string }) {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [show, setShow] = useState<"android" | "ios" | null>(null);

  useEffect(() => {
    addHead("link", { rel: "manifest", href: "/app.webmanifest" });
    addHead("link", { rel: "apple-touch-icon", href: "/api/pwa/icon/180" });
    addHead("meta", { name: "apple-mobile-web-app-capable", content: "yes" });
    addHead("meta", { name: "apple-mobile-web-app-title", content: name });
    void registerSW();

    if (isStandalone()) return;
    let visits = 0;
    let dismissedAt = 0;
    let ordered = false;
    try {
      if (!sessionStorage.getItem("sv_counted")) {
        visits = Number(localStorage.getItem(VISITS_KEY) || 0) + 1;
        localStorage.setItem(VISITS_KEY, String(visits));
        sessionStorage.setItem("sv_counted", "1");
      } else visits = Number(localStorage.getItem(VISITS_KEY) || 0);
      dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
      ordered = localStorage.getItem(ORDERED_KEY) === "1";
    } catch {
      return; // storage blocked: just never nag
    }
    if ((visits < 2 && !ordered) || Date.now() - dismissedAt < 30 * 86400_000) return;

    if (isIOS()) {
      const t = setTimeout(() => setShow("ios"), 4000);
      return () => clearTimeout(t);
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setShow("android");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, [name]);

  const dismiss = () => {
    setShow(null);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
  };

  if (!show) return null;
  return (
    <div className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-md rounded-2xl border border-stone-200 bg-white p-4 text-stone-800 shadow-xl sm:inset-x-auto sm:right-4">
      <button onClick={dismiss} className="absolute right-3 top-3 text-stone-400 hover:text-stone-700" aria-label="Close">
        <X className="h-4 w-4" />
      </button>
      <p className="pr-6 font-semibold">Order faster from your home screen</p>
      {show === "ios" ? (
        <p className="mt-1 text-sm text-stone-600">
          Tap <Share className="inline h-4 w-4 align-text-bottom" aria-label="Share" /> then{" "}
          <span className="whitespace-nowrap">
            <PlusSquare className="inline h-4 w-4 align-text-bottom" /> “Add to Home Screen”
          </span>
          . You&apos;ll get {name} like an app, with order updates.
        </p>
      ) : (
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-sm text-stone-600">Install {name} — no app store needed.</p>
          <button
            onClick={async () => {
              if (!deferred) return;
              await deferred.prompt();
              await deferred.userChoice.catch(() => null);
              dismiss();
            }}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white"
          >
            <Download className="h-4 w-4" /> Install
          </button>
        </div>
      )}
    </div>
  );
}
