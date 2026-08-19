// Outreach-conversion config + helpers (trial popup, read-only preview, savings
// math). Everything is read defensively from SITE_CONFIG.outreach with the
// defaults below, so a client whose config doesn't set the block simply has the
// feature OFF (enabled defaults to false). Shared by the popup and the preview
// dashboard so prices/math never drift between them.
import { SITE_CONFIG } from "@/lib/siteConfig";

export type OutreachConfig = {
  enabled: boolean;
  fullPrice: number;
  discountedPrice: number;
  discountReason: string;
  // INTERNAL follow-up tracking only — never surfaced as a countdown/deadline.
  trialLengthDays: number;
  calendlyUrl: string;
  // One-click "yes, I'm interested" signal. `signalKey` is THIS client's project
  // slug in the builder CRM; the checkbox only renders when it's set (per-client,
  // like the outreach block itself). `signalEndpoint` is the builder's public
  // interest API — the default fits every client, override only if it moves.
  signalEndpoint: string;
  signalKey: string;
  savings: {
    estimatedOrdersPerDay: number;
    avgOrderValue: number;
    commissionPct: number;
  };
};

const DEFAULTS: OutreachConfig = {
  enabled: false,
  fullPrice: 2600,
  discountedPrice: 1200,
  discountReason: "review",
  trialLengthDays: 14,
  calendlyUrl: "https://calendly.com/popdeveloper54/10-minute-meet",
  signalEndpoint: "https://restaurant-websites-builder.vercel.app/api/interest",
  signalKey: "",
  savings: { estimatedOrdersPerDay: 20, avgOrderValue: 25, commissionPct: 30 },
};

export function getOutreach(): OutreachConfig {
  const raw = (SITE_CONFIG as { outreach?: Partial<OutreachConfig> }).outreach;
  if (!raw) return DEFAULTS;
  return {
    ...DEFAULTS,
    ...raw,
    savings: { ...DEFAULTS.savings, ...(raw.savings ?? {}) },
  };
}

export function outreachEnabled(): boolean {
  return getOutreach().enabled === true;
}

export function formatUsd(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

// Monthly savings vs. third-party delivery apps:
//   orders/day × ~30 days × avg order value × commission %.
// All inputs come from config (default formula, override per client).
export function savingsBreakdown() {
  const o = getOutreach();
  const { estimatedOrdersPerDay, avgOrderValue, commissionPct } = o.savings;
  const monthlyOrders = estimatedOrdersPerDay * 30;
  const monthlyGross = monthlyOrders * avgOrderValue;
  const monthlySavings = Math.round((monthlyGross * commissionPct) / 100);
  const annualSavings = monthlySavings * 12;
  return {
    estimatedOrdersPerDay,
    avgOrderValue,
    commissionPct,
    monthlyOrders,
    monthlyGross,
    monthlySavings,
    annualSavings,
  };
}
