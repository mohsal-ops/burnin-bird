"use client";

import { useEffect } from "react";

// Pings /api/visit-alert once per browser at most every COOLDOWN_MS so the
// owner gets a single "someone opened the site" email per visit instead of
// one per page view. Runs only in a real browser (client-side), so headless
// bots that don't execute JS never trigger it. Renders nothing.
const COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 hours
const KEY = "va_ts";

export default function VisitAlert() {
  useEffect(() => {
    try {
      const last = Number(localStorage.getItem(KEY) || 0);
      if (Date.now() - last < COOLDOWN_MS) return;
      localStorage.setItem(KEY, String(Date.now()));
      fetch("/api/visit-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: location.pathname,
          referrer: document.referrer,
        }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* localStorage/fetch unavailable - ignore */
    }
  }, []);

  return null;
}
