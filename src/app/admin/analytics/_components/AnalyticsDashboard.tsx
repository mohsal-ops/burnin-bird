"use client";

// src/app/admin/analytics/_components/AnalyticsDashboard.tsx
// Run: npm install framer-motion  (if not already installed)

import { motion, type Variants } from "framer-motion";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type {
  TrafficData, DailyPoint, EngagementData, TrafficSource,
  PageData, ConversionData, DeviceData, SeoData, PageSpeedData,
} from "@/lib/analytics";

// ── Animation variants ────────────────────────────────────────────────────────

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  },
};

// ── Chart palette - works on light + dark ─────────────────────────────────────
const PALETTE = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#6b7280", "#ec4899"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function Delta({ value, unit = "%" }: { value: number; unit?: string }) {
  if (value === 0) return null;
  const up = value > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums
        ${up ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}
    >
      {up ? "↑" : "↓"} {Math.abs(value)}{unit}
    </span>
  );
}

function ErrorBanner({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <div className="mb-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2">
      <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">{msg}</p>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-4">
      {children}
    </p>
  );
}

// Custom tooltip for all charts
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-background shadow-lg px-3 py-2.5 text-xs">
      {label && <p className="text-muted-foreground mb-1.5">{label}</p>}
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground capitalize">{p.name}:</span>
          <span className="font-semibold text-foreground">{p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

// ── KPI card ──────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, delta, deltaUnit = "%", sub,
}: {
  label: string;
  value: string | number;
  delta?: number;
  deltaUnit?: string;
  sub?: string;
}) {
  return (
    <motion.div
      variants={item}
      className="rounded-2xl border border-border bg-background p-5 flex flex-col gap-1.5
                 hover:border-foreground/20 transition-colors duration-200"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="text-[28px] font-semibold tracking-tight tabular-nums leading-none mt-1">
        {value}
      </p>
      <div className="flex items-center gap-2 h-5">
        {delta !== undefined && <Delta value={delta} unit={deltaUnit} />}
        {sub && <span className="text-[11px] text-muted-foreground">{sub}</span>}
      </div>
    </motion.div>
  );
}

// ── Rank badge ────────────────────────────────────────────────────────────────

function RankBadge({ pos }: { pos: number }) {
  if (pos <= 3)
    return (
      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400">
        #{pos}
      </span>
    );
  if (pos <= 10)
    return (
      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">
        #{pos}
      </span>
    );
  return (
    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
      #{pos}
    </span>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  traffic: TrafficData;
  dailyTraffic: DailyPoint[];
  engagement: EngagementData;
  sources: TrafficSource[];
  topPages: PageData[];
  conversions: ConversionData;
  devices: DeviceData[];
  seo: SeoData;
  speed: PageSpeedData;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export function AnalyticsDashboard({
  traffic, dailyTraffic, engagement, sources,
  topPages, conversions, devices, seo, speed,
}: Props) {
  const maxPageViews = Math.max(...topPages.map((p) => p.views), 1);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-24 space-y-10">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-end justify-between border-b border-border pb-6"
      >
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-1">
            The Wagon Wheel
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Website Analytics</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] text-muted-foreground">Last 30 days</span>
        </div>
      </motion.div>

      {/* ── KPI Row ─────────────────────────────────────────────────────────── */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        <ErrorBanner msg={traffic._error} />
        <KpiCard
          label="Unique Visitors"
          value={traffic.uniqueVisitors.toLocaleString()}
          delta={traffic.uniqueVisitorsDelta}
        />
        <KpiCard
          label="Total Sessions"
          value={traffic.totalVisits.toLocaleString()}
          delta={traffic.totalVisitsDelta}
        />
        <KpiCard
          label="Page Views"
          value={traffic.pageViews.toLocaleString()}
          delta={traffic.pageViewsDelta}
        />
        <KpiCard
          label="Bounce Rate"
          value={`${traffic.bounceRate}%`}
          delta={traffic.bounceRateDelta}
          deltaUnit=" pts"
          sub="lower is better"
        />
      </motion.div>

      {/* ── Trend + Sources ──────────────────────────────────────────────────── */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid lg:grid-cols-[1fr_360px] gap-4"
      >
        {/* Visitors area chart */}
        <motion.div
          variants={item}
          className="rounded-2xl border border-border bg-background p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <SectionLabel>Visitors trend</SectionLabel>
            <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-foreground rounded" />
                Visitors
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-blue-400/60 rounded" style={{ borderTop: "2px dashed" }} />
                Sessions
              </span>
            </div>
          </div>
          {dailyTraffic.length === 0 ? (
            <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">
              No traffic data yet - check GA4 service account permissions
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={dailyTraffic} margin={{ top: 0, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gSessions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#94a3b8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="0"
                  stroke="hsl(var(--border))"
                  vertical={false}
                  strokeOpacity={0.6}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="sessions"
                  name="sessions"
                  stroke="#94a3b8"
                  strokeWidth={1.5}
                  fill="url(#gSessions)"
                  dot={false}
                  activeDot={{ r: 3, fill: "#94a3b8" }}
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  name="visitors"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#gUsers)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#3b82f6" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Traffic sources donut */}
        <motion.div
          variants={item}
          className="rounded-2xl border border-border bg-background p-6"
        >
          <SectionLabel>Traffic sources</SectionLabel>
          {sources.length === 0 ? (
            <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground text-center">
              No source data yet
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={sources}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    dataKey="percentage"
                    nameKey="name"
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {sources.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} formatter={(v) => [`${v}%`, ""]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {sources.map((s, i) => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: PALETTE[i % PALETTE.length] }}
                      />
                      {s.name}
                    </span>
                    <span className="font-semibold tabular-nums">{s.percentage}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </motion.div>

      {/* ── Engagement ──────────────────────────────────────────────────────── */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
      >
        <SectionLabel>Engagement</SectionLabel>
        <ErrorBanner msg={engagement._error} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Avg session", value: engagement.avgSessionDuration, sub: "target 3min+" },
            { label: "Pages / session", value: String(engagement.pagesPerSession), sub: "higher is better" },
            { label: "Returning visitors", value: `${engagement.returningVisitors}%`, sub: "loyalty" },
            { label: "Top exit page", value: engagement.topExitPage, sub: `${engagement.exitRate}% exit rate` },
          ].map((card) => (
            <KpiCard key={card.label} label={card.label} value={card.value} sub={card.sub} />
          ))}
        </div>
      </motion.div>

      {/* ── Top pages ───────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.25 }}
        className="rounded-2xl border border-border bg-background overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-border">
          <SectionLabel>Top pages</SectionLabel>
        </div>
        {/* Header */}
        <div className="grid grid-cols-[1fr_64px_88px_56px] px-6 py-2.5 bg-muted/30 border-b border-border
                        text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          <span>Page</span>
          <span className="text-right">Views</span>
          <span className="text-right">Avg time</span>
          <span className="text-right">Exit</span>
        </div>
        {topPages.length === 0 && (
          <p className="px-6 py-5 text-sm text-muted-foreground">No page data yet</p>
        )}
        {topPages.map((page, i) => (
          <motion.div
            key={page.page}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 * i }}
            className={`grid grid-cols-[1fr_64px_88px_56px] px-6 py-3.5 items-center
                        text-sm hover:bg-muted/40 transition-colors duration-150
                        ${i < topPages.length - 1 ? "border-b border-border" : ""}`}
          >
            <div className="flex items-center gap-3 pr-4 overflow-hidden">
              {/* Mini view bar */}
              <div className="hidden sm:block w-16 h-1 bg-muted rounded-full overflow-hidden flex-shrink-0">
                <div
                  className="h-full bg-blue-500/60 rounded-full"
                  style={{ width: `${(page.views / maxPageViews) * 100}%` }}
                />
              </div>
              <span className="font-mono text-xs text-muted-foreground truncate">{page.page}</span>
            </div>
            <span className="text-right font-medium tabular-nums">
              {page.views.toLocaleString()}
            </span>
            <span className="text-right text-muted-foreground tabular-nums text-xs">
              {page.avgTime}
            </span>
            <span
              className={`text-right font-medium tabular-nums text-xs
                ${page.exitRate > 35 ? "text-red-500" : "text-muted-foreground"}`}
            >
              {page.exitRate}%
            </span>
          </motion.div>
        ))}
      </motion.div>

      {/* ── SEO ─────────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.3 }}
      >
        <SectionLabel>Search - Google Search Console</SectionLabel>
        <ErrorBanner msg={seo._error} />

        {/* SEO KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <KpiCard label="Organic clicks" value={seo.organicTraffic.toLocaleString()} />
          <KpiCard label="Impressions" value={seo.impressions.toLocaleString()} />
          <KpiCard label="Click-through rate" value={`${seo.ctr}%`} sub="avg across searches" />
          <KpiCard
            label="Avg position"
            value={`#${seo.avgPosition}`}
            sub={seo.avgPosition > 0 && seo.avgPosition <= 10 ? "on page 1" : ""}
          />
        </div>

        {/* Keyword table */}
        <div className="rounded-2xl border border-border bg-background overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <p className="text-sm font-medium">Keyword rankings</p>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              Last 30 days
            </span>
          </div>
          <div className="grid grid-cols-[1fr_68px_60px_56px_64px] px-6 py-2.5 bg-muted/30 border-b border-border
                          text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <span>Keyword</span>
            <span className="text-right">Position</span>
            <span className="text-right">Clicks</span>
            <span className="text-right">CTR</span>
            <span className="text-right">Rank</span>
          </div>
          {seo.keywords.length === 0 && (
            <p className="px-6 py-5 text-sm text-muted-foreground">No keyword data yet</p>
          )}
          {seo.keywords.map((kw, i) => (
            <motion.div
              key={kw.keyword}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.04 * i }}
              className={`grid grid-cols-[1fr_68px_60px_56px_64px] px-6 py-3.5 items-center
                          text-sm hover:bg-muted/40 transition-colors duration-150
                          ${i < seo.keywords.length - 1 ? "border-b border-border" : ""}`}
            >
              <span className="truncate pr-4 font-medium">{kw.keyword}</span>
              <span className="text-right tabular-nums text-muted-foreground text-xs">
                #{kw.position}
              </span>
              <span className="text-right tabular-nums text-muted-foreground text-xs">
                {kw.clicks}
              </span>
              <span className="text-right tabular-nums text-muted-foreground text-xs">
                {kw.ctr}%
              </span>
              <div className="flex justify-end">
                <RankBadge pos={kw.position} />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Devices + Conversions + Speed ───────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.35 }}
        className="grid lg:grid-cols-3 gap-4"
      >
        {/* Devices bar chart */}
        <div className="rounded-2xl border border-border bg-background p-6">
          <SectionLabel>Devices</SectionLabel>
          {devices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No device data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                data={devices}
                layout="vertical"
                margin={{ top: 0, right: 0, bottom: 0, left: -10 }}
              >
                <CartesianGrid strokeDasharray="0" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  width={56}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  formatter={(v) => [`${v}%`, "Share"]}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20}>
                  {devices.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Conversions */}
        <div className="rounded-2xl border border-border bg-background p-6">
          <SectionLabel>Conversions</SectionLabel>
          <ErrorBanner msg={conversions._error} />
          <div className="space-y-5">
            <div>
              <p className="text-[32px] font-semibold tracking-tight tabular-nums leading-none">
                {conversions.conversionRate}%
              </p>
              <p className="text-xs text-muted-foreground mt-1.5">conversion rate</p>
            </div>
            <div className="border-t border-border pt-4">
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-semibold tabular-nums">
                  {conversions.goalCompletions.toLocaleString()}
                </p>
                {conversions.goalsDelta !== 0 && (
                  <Delta value={conversions.goalsDelta} unit=" goals" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">goal completions</p>
            </div>
            <div className="border-t border-border pt-4">
              <p className="text-xl font-semibold tabular-nums">
                {speed.performanceScore > 0 ? `${speed.performanceScore}/100` : "-"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">PageSpeed score</p>
            </div>
          </div>
        </div>

        {/* Page speed */}
        <div className="rounded-2xl border border-border bg-background p-6">
          <SectionLabel>Page speed</SectionLabel>
          {speed.loadSpeed === null ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Not connected</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Add{" "}
                <code className="bg-muted px-1 py-0.5 rounded text-[11px]">
                  PAGESPEED_API_KEY
                </code>{" "}
                to <code className="bg-muted px-1 py-0.5 rounded text-[11px]">.env.local</code>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-end gap-2">
                <p className="text-[32px] font-semibold tracking-tight leading-none tabular-nums">
                  {speed.loadSpeed}s
                </p>

              </div>
              <div className="grid grid-cols-2 gap-2 border-t border-border pt-4">
                {[
                  { label: "FCP", value: speed.fcp },
                  { label: "LCP", value: speed.lcp },
                  { label: "CLS", value: speed.cls },
                  { label: "TBT", value: speed.tbt },
                ].map((m) => (
                  <div key={m.label} className="bg-muted/40 rounded-xl p-2.5 text-center">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {m.label}
                    </p>
                    <p className="text-sm font-semibold mt-1 tabular-nums">{m.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

    </div>
  );
}