"use client";

// A small, calm floating button that gives outreach visitors a way back into
// the read-only dashboard preview after they've closed the trial popup. It only
// appears once the popup has been shown at least once (so it never spoils the
// popup), then persists across page navigation. Mounted in the customer layout
// only - never on /admin. Same destination as the popup's "See your dashboard" CTA.
//
// Closable: once closed it stops floating over the page and moves to
//   • phones  → a "Your dashboard" row in the menu sheet (AppSideBar)
//   • desktop → a slim tab docked on the right edge (label slides out on hover)
import { useEffect, useState } from "react";
import { LayoutDashboard, X } from "lucide-react";
import { getOutreach } from "@/lib/outreach";
import {
  BUBBLE_EVENT,
  PREVIEW_ENTER_URL,
  SEEN_EVENT,
  hasSeenTrial,
  isBubbleHidden,
  setBubbleHidden,
} from "@/lib/trialPopupSession";

/** Shared state: is the dashboard link available, and has the bubble been closed? */
export function useDashboardAccess() {
  const o = getOutreach();
  const [seen, setSeen] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!o.enabled) return;
    setSeen(hasSeenTrial());
    setHidden(isBubbleHidden());
    const onSeen = () => setSeen(true);
    const onBubble = () => setHidden(isBubbleHidden());
    window.addEventListener(SEEN_EVENT, onSeen);
    window.addEventListener(BUBBLE_EVENT, onBubble);
    return () => {
      window.removeEventListener(SEEN_EVENT, onSeen);
      window.removeEventListener(BUBBLE_EVENT, onBubble);
    };
  }, [o.enabled]);

  return { available: o.enabled && seen, hidden, href: PREVIEW_ENTER_URL };
}

export default function DashboardBubble() {
  const { available, hidden, href } = useDashboardAccess();
  if (!available) return null;

  if (hidden) {
    // Desktop only: a quiet tab on the right edge. Phones get it in the menu.
    return (
      <a
        href={href}
        aria-label="Open your dashboard preview"
        className="group fixed bottom-28 right-0 z-60 hidden items-center gap-2 rounded-l-xl bg-[#c85a1e] py-2.5 pl-3 pr-2.5 text-sm font-medium text-white shadow-lg transition-all duration-300 hover:pr-4 md:flex"
      >
        <LayoutDashboard size={18} className="shrink-0" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap transition-all duration-300 group-hover:max-w-[9rem]">Your dashboard</span>
      </a>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 z-60 md:bottom-6 md:right-6">
      <a
        href={href}
        aria-label="Open your dashboard preview"
        className="inline-flex items-center gap-2 rounded-full border border-[#c85a1e]/30 bg-[#c85a1e] px-4 py-3 text-sm font-medium text-white shadow-lg backdrop-blur transition-colors hover:bg-[#b34f19]"
      >
        <LayoutDashboard size={18} className="shrink-0" />
        <span className="inline">Your dashboard</span>
      </a>
      <button
        type="button"
        aria-label="Hide the dashboard button"
        onClick={() => setBubbleHidden(true)}
        className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full border border-stone-200 bg-white text-stone-600 shadow-md transition-colors hover:bg-stone-100"
      >
        <X size={13} strokeWidth={2.5} />
      </button>
    </div>
  );
}
