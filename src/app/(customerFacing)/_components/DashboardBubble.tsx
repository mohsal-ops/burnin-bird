"use client";

// A small, calm floating button that gives outreach visitors a way back into
// the read-only dashboard preview after they've closed the trial popup. It only
// appears once the popup has been shown at least once (so it never spoils the
// popup), then persists for the rest of the session across page navigation.
// Mounted in the customer layout only - never on /admin. Same destination as the
// popup's "See your dashboard" CTA.
import { useEffect, useState } from "react";
import { LayoutDashboard } from "lucide-react";
import { getOutreach } from "@/lib/outreach";
import { PREVIEW_ENTER_URL, SEEN_EVENT, hasSeenTrial } from "@/lib/trialPopupSession";

export default function DashboardBubble() {
  const o = getOutreach();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!o.enabled) return;
    // On a fresh page load the flag is already set if the popup ran earlier this
    // session; the event covers the same page where it just appeared.
    setVisible(hasSeenTrial());
    const onSeen = () => setVisible(true);
    window.addEventListener(SEEN_EVENT, onSeen);
    return () => window.removeEventListener(SEEN_EVENT, onSeen);
  }, [o.enabled]);

  if (!o.enabled || !visible) return null;

  return (
    <a
      href={PREVIEW_ENTER_URL}
      aria-label="Open your dashboard preview"
      className="fixed bottom-20 right-4 z-60 inline-flex items-center gap-2 rounded-full border border-[#c85a1e]/30 bg-[#c85a1e] px-4 py-3 text-sm font-medium text-white shadow-lg backdrop-blur transition-colors hover:bg-[#c85a1e] hover:text-white md:bottom-6 md:right-6"
    >
      <LayoutDashboard size={18} className="shrink-0" />
      <span className="inline">Your dashboard</span>
    </a>
  );
}
