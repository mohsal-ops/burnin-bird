"use client";

import { useEffect } from "react";
import { SITE_CONFIG } from "@/lib/siteConfig";

// Pings /api/visit-alert once per browser at most every COOLDOWN_MS so the
// owner gets a single "someone opened the site" email per visit instead of
// one per page view. Runs only in a real browser (client-side), so headless
// bots that don't execute JS never trigger it. Renders nothing.
//
// The public website and the admin/preview dashboard each mount their own copy
// with a distinct `source`, so their cooldowns are INDEPENDENT: opening the
// preview dashboard no longer suppresses the website's alert (and vice versa).
//
// The same ping also (best-effort) hits the VegaStar builder's visit tracker
// cross-origin from this browser, so the agency's project card shows when this
// client last opened their site/dashboard. The builder derives the project from
// this page's Origin and drops the agency's own (Algeria) visits.
const COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 hours

// The builder derives the project slug from the request Origin (like the interest
// checkbox). Overridable per-build via NEXT_PUBLIC_BUILDER_URL.
const BUILDER_URL =
  process.env.NEXT_PUBLIC_BUILDER_URL || "https://restaurant-websites-builder.vercel.app";

type Source = "site" | "dashboard";

export default function VisitAlert({ source = "site" }: { source?: Source }) {
  useEffect(() => {
    try {
      const key = `va_ts_${source}`;
      const last = Number(localStorage.getItem(key) || 0);
      if (Date.now() - last < COOLDOWN_MS) return;
      localStorage.setItem(key, String(Date.now()));

      // 1) Owner email alert (same-origin).
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

      // 2) Builder activity tracker (cross-origin). The tracker uses "website"
      // and "dashboard" as its source names.
      fetch(`${BUILDER_URL}/api/visits/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: source === "dashboard" ? "dashboard" : "website",
          path: location.pathname,
          siteUrl: (SITE_CONFIG as { siteUrl?: string }).siteUrl || location.origin,
        }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* localStorage/fetch unavailable - ignore */
    }
  }, [source]);

  return null;
}
