"use client";

import { useEffect } from "react";

// Pings /api/visit-alert once per browser at most every COOLDOWN_MS so the
// owner gets a single "someone opened the site" email per visit instead of
// one per page view. Runs only in a real browser (client-side), so headless
// bots that don't execute JS never trigger it. Renders nothing.
//
// The public website and the admin/preview dashboard each mount their own copy
// with a distinct `source`, so their cooldowns are INDEPENDENT: opening the
// preview dashboard no longer suppresses the website's alert (and vice versa).
const COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 hours

type Source = "site" | "dashboard";

export default function VisitAlert({ source = "site" }: { source?: Source }) {
  useEffect(() => {
    try {
      const key = `va_ts_${source}`;
      const last = Number(localStorage.getItem(key) || 0);
      if (Date.now() - last < COOLDOWN_MS) return;
      localStorage.setItem(key, String(Date.now()));
      fetch("/api/visit-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: location.pathname,
          referrer: document.referrer,
          source,
        }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* localStorage/fetch unavailable - ignore */
    }
  }, [source]);

  return null;
}
