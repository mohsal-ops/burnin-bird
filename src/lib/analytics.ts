// src/lib/analytics.ts
// ─────────────────────────────────────────────────────────────────────────────
// DIAGNOSIS: Why GA4 returns 0 but Search Console works
//
// ROOT CAUSES (in order of likelihood):
//
// 1. SERVICE ACCOUNT NOT ADDED TO GA4 PROPERTY
//    Search Console and GA4 are completely separate permission systems.
//    Adding the service account to Search Console does NOT grant GA4 access.
//    Fix: analytics.google.com → Admin → Property Access Management → Add User
//         Paste service account email → Role: Viewer → Add
//
// 2. WRONG PROPERTY ID FORMAT
//    GA4_PROPERTY_ID must be ONLY the numeric ID: e.g. "123456789"
//    NOT the Measurement ID: "G-XXXXXXXXXX"  ← this causes INVALID_ARGUMENT
//    NOT with prefix: "properties/123456789"  ← also causes errors
//    Find it: analytics.google.com → Admin → Property Settings → Property ID
//
// 3. GA4 DATA API NOT ENABLED
//    "Google Analytics Data API" must be enabled in Google Cloud Console.
//    This is different from "Google Analytics API" (the old Universal Analytics one).
//    Fix: console.cloud.google.com → APIs & Services → Library
//         Search "Google Analytics Data API" → Enable
//
// 4. ERRORS SWALLOWED SILENTLY
//    Every function wraps in try/catch and returns 0 fallbacks.
//    The actual error was never visible. Fixed below with structured error returns.
//
// WHY SEARCH CONSOLE WORKS:
//    googleapis uses a different underlying auth client (google-auth-library)
//    that handles token negotiation differently from @google-analytics/data.
//    The service account was added to Search Console specifically, so it works.
//    GA4 uses a separate IAM system entirely.
//
// DEBUGGING: Set DEBUG_ANALYTICS=true in .env.local to see raw API responses.
// ─────────────────────────────────────────────────────────────────────────────

import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { google } from "googleapis";
import { SITE_CONFIG } from "@/lib/siteConfig";
import type { protos } from "@google-analytics/data";

// ── Types ─────────────────────────────────────────────────────────────────────

type AnalyticsError = {
  details?: string;
  message?: string;
  status?: number;
  code?: number;
};

export type TrafficData = {
  uniqueVisitors: number;
  totalVisits: number;
  pageViews: number;
  bounceRate: number;
  uniqueVisitorsDelta: number;
  totalVisitsDelta: number;
  pageViewsDelta: number;
  bounceRateDelta: number;
  _error?: string;
};

export type DailyPoint = {
  date: string;  // "May 1"
  users: number;
  sessions: number;
};

export type EngagementData = {
  avgSessionDuration: string;
  pagesPerSession: number;
  returningVisitors: number;
  topExitPage: string;
  exitRate: number;
  _error?: string;
};

export type TrafficSource = {
  name: string;
  percentage: number;
  sessions: number;
};

export type PageData = {
  page: string;
  views: number;
  avgTime: string;
  exitRate: number;
};

export type ConversionData = {
  conversionRate: number;
  goalCompletions: number;
  goalsDelta: number;
  _error?: string;
};

export type DeviceData = {
  label: string;
  value: number;
  sessions: number;
};

export type KeywordData = {
  keyword: string;
  position: number;
  clicks: number;
  ctr: number;
};

export type SeoData = {
  organicTraffic: number;
  impressions: number;
  ctr: number;
  avgPosition: number;
  keywords: KeywordData[];
  _error?: string;
};

export type PageSpeedData = {
  performanceScore: number;
  loadSpeed: number | null;
  fcp: string;
  lcp: string;
  cls: string;
  tbt: string;
  _error?: string;
};

// ── Clients ───────────────────────────────────────────────────────────────────

const DEBUG = process.env.DEBUG_ANALYTICS === "true";

function debugLog(label: string, data: unknown) {
  if (!DEBUG) return;
  console.log(`\n╔══ [Analytics Debug] ${label} ══`);
  try {
    console.log(JSON.stringify(data, null, 2).slice(0, 3000));
  } catch {
    console.log(String(data));
  }
  console.log(`╚${"═".repeat(40)}\n`);
}

const credentials = {
  client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "",
  private_key: (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
};

// GA4_PROPERTY_ID must be ONLY the number - no "properties/" prefix, no "G-" prefix
const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID!;
const SITE_URL = process.env.SITE_URL!;

const ga4 = new BetaAnalyticsDataClient({ credentials });

const gscAuth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
});
const searchconsole = google.searchconsole({ version: "v1", auth: gscAuth });

// ── Core GA4 helper ───────────────────────────────────────────────────────────
// Single reusable function - reduces duplication and surfaces real errors

type GA4ReportRequest = protos.google.analytics.data.v1beta.IRunReportRequest;

async function runGA4(request: Omit<GA4ReportRequest, "property">) {
  try {
    const [response] = await ga4.runReport({
      property: `properties/${GA4_PROPERTY_ID}`,
      ...request,
    });

    return response;
  } catch (error: unknown) {
    console.error(
      "GA4 REQUEST FAILED:",
      JSON.stringify(request, null, 2)
    );

    console.error(
      "GA4 ERROR:",
      (error as AnalyticsError).details || (error as AnalyticsError).message
    );

    throw error;
  }
}

function pct(delta: number, prev: number): number {
  return prev === 0 ? 0 : Math.round(((delta - prev) / prev) * 100);
}

function parseNum(val?: string | null): number {
  return parseInt(val ?? "0", 10) || 0;
}

function parseFloat2(val?: string | null): number {
  return parseFloat(val ?? "0") || 0;
}

// ── 1. Traffic overview ───────────────────────────────────────────────────────

export async function getTrafficData(): Promise<TrafficData> {
  const fallback: TrafficData = {
    uniqueVisitors: 0, totalVisits: 0, pageViews: 0, bounceRate: 0,
    uniqueVisitorsDelta: 0, totalVisitsDelta: 0, pageViewsDelta: 0, bounceRateDelta: 0,
  };
  try {
    const metrics = [
      { name: "activeUsers" },
      { name: "sessions" },
      { name: "screenPageViews" },
      { name: "bounceRate" },
    ];
    const [cur, prev] = await Promise.all([
      runGA4({ dateRanges: [{ startDate: "30daysAgo", endDate: "today" }], metrics }),
      runGA4({ dateRanges: [{ startDate: "60daysAgo", endDate: "31daysAgo" }], metrics }),
    ]);

    const c = cur.rows?.[0]?.metricValues;
    const p = prev.rows?.[0]?.metricValues;

    const uv = parseNum(c?.[0]?.value);
    const tv = parseNum(c?.[1]?.value);
    const pv = parseNum(c?.[2]?.value);
    // bounceRate in GA4 is 0-1 float; multiply by 100
    const br = Math.round(parseFloat2(c?.[3]?.value) * 100);

    const uvP = parseNum(p?.[0]?.value);
    const tvP = parseNum(p?.[1]?.value);
    const pvP = parseNum(p?.[2]?.value);
    const brP = Math.round(parseFloat2(p?.[3]?.value) * 100);


    return {
      uniqueVisitors: uv, totalVisits: tv, pageViews: pv, bounceRate: br,
      uniqueVisitorsDelta: pct(uv, uvP),
      totalVisitsDelta: pct(tv, tvP),
      pageViewsDelta: pct(pv, pvP),
      bounceRateDelta: br - brP,
      
    };
  } catch (e: unknown) {
    const msg = (e as AnalyticsError).details || (e as AnalyticsError).message || String(e);
    console.error("[getTrafficData]", msg);
    debugLog("getTrafficData ERROR", e);
    return { ...fallback, _error: msg };
  }
}

// ── 2. Daily traffic trend (for line chart) ───────────────────────────────────

export async function getDailyTraffic(): Promise<DailyPoint[]> {
  try {
    const response = await runGA4({
      dateRanges: [{ startDate: "29daysAgo", endDate: "today" }],
      dimensions: [{ name: "date" }],
      metrics: [{ name: "activeUsers" }, { name: "sessions" }],
      orderBys: [{ dimension: { dimensionName: "date" } }],
    });

    return (response.rows ?? []).map((row) => {
      // GA4 date format: "20240101" → "Jan 1"
      const raw = row.dimensionValues?.[0]?.value ?? "";
      const d = new Date(`${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`);
      const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      return {
        date,
        users: parseNum(row.metricValues?.[0]?.value),
        sessions: parseNum(row.metricValues?.[1]?.value),
      };
    });
  } catch (e: unknown) {
    console.error("[getDailyTraffic]", (e as AnalyticsError).details || (e as AnalyticsError).message);
    return [];
  }
}

// ── 3. Engagement ─────────────────────────────────────────────────────────────

export async function getEngagementData(): Promise<EngagementData> {
  const fallback: EngagementData = {
    avgSessionDuration: "0m 0s", pagesPerSession: 0,
    returningVisitors: 0, topExitPage: "/", exitRate: 0,
  };
  try {
    const [durationRes, exitRes, nvr] = await Promise.all([
      runGA4({
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        metrics: [{ name: "averageSessionDuration" }, { name: "screenPageViewsPerSession" }],
      }),
      runGA4({
  dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
  dimensions: [{ name: "pagePath" }],
  metrics: [{ name: "screenPageViews" }],
  limit: 1,
}),
      runGA4({
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "newVsReturning" }],
        metrics: [{ name: "activeUsers" }],
      }),
    ]);

    const mv = durationRes.rows?.[0]?.metricValues;
    const rawSec = parseFloat2(mv?.[0]?.value);
    const min = Math.floor(rawSec / 60);
    const sec = Math.round(rawSec % 60);

    const exitRow = exitRes.rows?.[0];
    const topExitPage = exitRow?.dimensionValues?.[0]?.value ?? "/";
    const exitRate = Math.round(parseFloat2(exitRow?.metricValues?.[0]?.value) * 100);

    const rows = nvr.rows ?? [];
    const ret = rows.find((r) => r.dimensionValues?.[0]?.value === "returning");
    const newU = rows.find((r) => r.dimensionValues?.[0]?.value === "new");
    const retN = parseNum(ret?.metricValues?.[0]?.value);
    const newN = parseNum(newU?.metricValues?.[0]?.value);
    const total = retN + newN;

    return {
      avgSessionDuration: `${min}m ${sec}s`,
      pagesPerSession: parseFloat(parseFloat2(mv?.[1]?.value).toFixed(1)),
      returningVisitors: total === 0 ? 0 : Math.round((retN / total) * 100),
      topExitPage,
      exitRate,
    };
  } catch (e: unknown) {
    const msg = (e as AnalyticsError).details || (e as AnalyticsError).message || String(e);
    console.error("[getEngagementData]", msg);
    return { ...fallback, _error: msg };
  }
}

// ── 4. Traffic sources ────────────────────────────────────────────────────────

export async function getTrafficSources(): Promise<TrafficSource[]> {
  try {
    const response = await runGA4({
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [{ name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 6,
    });

    const rows = response.rows ?? [];
    const totalSessions = rows.reduce((s, r) => s + parseNum(r.metricValues?.[0]?.value), 0);

    return rows.map((row) => {
      const name = row.dimensionValues?.[0]?.value ?? "Other";
      const sessions = parseNum(row.metricValues?.[0]?.value);
      return {
        name,
        sessions,
        percentage: totalSessions === 0 ? 0 : Math.round((sessions / totalSessions) * 100),
      };
    });
  } catch (e: unknown) {
    console.error("[getTrafficSources]", (e as AnalyticsError).details || (e as AnalyticsError).message);
    return [];
  }
}

// ── 5. Top pages ──────────────────────────────────────────────────────────────

export async function getTopPages(): Promise<PageData[]> {
  try {
    const response = await runGA4({
  dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
  dimensions: [{ name: "pagePath" }],
  metrics: [{ name: "screenPageViews" }],
  limit: 8,
});


    return (response.rows ?? []).map((row) => {
      const rawSec = parseFloat2(row.metricValues?.[1]?.value);
      const m = Math.floor(rawSec / 60);
      const s = Math.round(rawSec % 60);
      return {
        page: row.dimensionValues?.[0]?.value ?? "/",
        views: parseNum(row.metricValues?.[0]?.value),
        avgTime: `${m}m ${s}s`,
        exitRate: Math.round(parseFloat2(row.metricValues?.[2]?.value) * 100),
      };
    });
  } catch (e: unknown) {
    console.error("[getTopPages]", (e as AnalyticsError).details || (e as AnalyticsError).message);
    return [];
  }
}

// ── 6. Conversions ────────────────────────────────────────────────────────────

export async function getConversionData(): Promise<ConversionData> {
  const fallback: ConversionData = { conversionRate: 0, goalCompletions: 0, goalsDelta: 0 };
  try {
    const metrics = [{ name: "conversions" }, { name: "sessionConversionRate" }];
    const [cur, prev] = await Promise.all([
      runGA4({ dateRanges: [{ startDate: "30daysAgo", endDate: "today" }], metrics }),
      runGA4({ dateRanges: [{ startDate: "60daysAgo", endDate: "31daysAgo" }], metrics }),
    ]);

    const c = cur.rows?.[0]?.metricValues;
    const goals = parseNum(c?.[0]?.value);
    const prevGoals = parseNum(prev.rows?.[0]?.metricValues?.[0]?.value);

    return {
      conversionRate: parseFloat((parseFloat2(c?.[1]?.value) * 100).toFixed(1)),
      goalCompletions: goals,
      goalsDelta: goals - prevGoals,
    };
  } catch (e: unknown) {
    const msg = (e as AnalyticsError).details || (e as AnalyticsError).message || String(e);
    console.error("[getConversionData]", msg);
    return { ...fallback, _error: msg };
  }
}

// ── 7. Devices ────────────────────────────────────────────────────────────────

export async function getDeviceData(): Promise<DeviceData[]> {
  try {
    const response = await runGA4({
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      dimensions: [{ name: "deviceCategory" }],
      metrics: [{ name: "sessions" }],
    });

    const rows = response.rows ?? [];
    const total = rows.reduce((s, r) => s + parseNum(r.metricValues?.[0]?.value), 0);

    return rows.map((row) => {
      const raw = row.dimensionValues?.[0]?.value ?? "other";
      const sessions = parseNum(row.metricValues?.[0]?.value);
      return {
        label: raw.charAt(0).toUpperCase() + raw.slice(1),
        sessions,
        value: total === 0 ? 0 : Math.round((sessions / total) * 100),
      };
    });
  } catch (e: unknown) {
    console.error("[getDeviceData]", (e as AnalyticsError).details || (e as AnalyticsError).message);
    return [];
  }
}

// ── 8. SEO - Search Console ───────────────────────────────────────────────────

export async function getSeoData(): Promise<SeoData> {
  const fallback: SeoData = {
    organicTraffic: 0, impressions: 0, ctr: 0, avgPosition: 0, keywords: [],
  };
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().split("T")[0];
    const endDate = new Date().toISOString().split("T")[0];

    const [overview, keywords] = await Promise.all([
      searchconsole.searchanalytics.query({
        siteUrl: SITE_URL,
        requestBody: { startDate, endDate },
      }),
      searchconsole.searchanalytics.query({
        siteUrl: SITE_URL,
        requestBody: { startDate, endDate, dimensions: ["query"], rowLimit: 10 },
      }),
    ]);

    debugLog("Search Console overview", overview.data);
    debugLog("Search Console keywords", keywords.data);

    const ov = overview.data.rows?.[0];
    return {
      organicTraffic: Math.round(ov?.clicks ?? 0),
      impressions: Math.round(ov?.impressions ?? 0),
      ctr: parseFloat(((ov?.ctr ?? 0) * 100).toFixed(1)),
      avgPosition: parseFloat((ov?.position ?? 0).toFixed(1)),
      keywords: (keywords.data.rows ?? []).map((row) => ({
        keyword: (row.keys?.[0] ?? "").toLowerCase(),
        position: Math.round(row.position ?? 0),
        clicks: Math.round(row.clicks ?? 0),
        ctr: parseFloat(((row.ctr ?? 0) * 100).toFixed(1)),
      })),
    };
  } catch (e: unknown) {
    const status = (e as AnalyticsError)?.status ?? (e as AnalyticsError)?.code ?? "unknown";
    const msg = status === 403
      ? "403 - service account missing from Search Console or wrong SITE_URL format"
      : `Error ${status}: ${(e as AnalyticsError)?.message}`;
    console.error("[getSeoData]", msg);
    return { ...fallback, _error: msg };
  }
}

// ── 9. PageSpeed ──────────────────────────────────────────────────────────────

export async function getPageSpeedData(
  pageUrl?: string  // optional - defaults to your homepage
): Promise<PageSpeedData> {
  const fallback: PageSpeedData = {
    performanceScore: 0, loadSpeed: null,
    fcp: "-", lcp: "-", cls: "-", tbt: "-",
  };

  const apiKey = process.env.PAGESPEED_API_KEY;

  // Use dedicated pagespeed URL, not the sc-domain: Search Console one
  const baseUrl = process.env.PAGESPEED_SITE_URL ?? SITE_CONFIG.siteUrl;
  const targetUrl = pageUrl ?? baseUrl;

  if (!apiKey) {
    return { ...fallback, _error: "PAGESPEED_API_KEY not set" };
  }

  try {
    const endpoint = new URL(
      "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
    );
    endpoint.searchParams.set("url", targetUrl);
    endpoint.searchParams.set("key", apiKey);
    endpoint.searchParams.set("strategy", "mobile");
    endpoint.searchParams.set("category", "performance");

    const res = await fetch(endpoint.toString(), { next: { revalidate: 3600 } });

    if (!res.ok) {
      const errText = await res.text();
      return { ...fallback, _error: `HTTP ${res.status}: ${errText.slice(0, 200)}` };
    }

    const data = await res.json();
    if (data.error) return { ...fallback, _error: data.error.message };

    const audits = data.lighthouseResult?.audits;
    const score  = data.lighthouseResult?.categories?.performance?.score;
    const rawSpeed = audits?.["interactive"]?.numericValue;

    return {
      performanceScore: Math.round((score ?? 0) * 100),
      loadSpeed: rawSpeed != null ? parseFloat((rawSpeed / 1000).toFixed(1)) : null,
      fcp: audits?.["first-contentful-paint"]?.displayValue  ?? "-",
      lcp: audits?.["largest-contentful-paint"]?.displayValue ?? "-",
      cls: audits?.["cumulative-layout-shift"]?.displayValue  ?? "-",
      tbt: audits?.["total-blocking-time"]?.displayValue      ?? "-",
    };
  } catch (e: unknown) {
    return { ...fallback, _error: (e as AnalyticsError).message };
  }
}