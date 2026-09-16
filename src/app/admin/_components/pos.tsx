import * as React from "react";
import { cn } from "@/lib/utils";

// POS design-system primitives for the admin. ONE status-color language and a
// number-forward type scale, so every section (Orders, Catering, Hours, Loyalty,
// Reviews, Team, …) speaks the same visual vocabulary instead of ad-hoc colors.
//
// Tones:
//   live       - on / good / enabled / available / paid
//   attention  - pending / needs a decision / new
//   off        - off / error / unavailable / declined
//   neutral    - idle / informational
//   info       - in-progress / informational (e.g. "contacted")
export type PosTone = "live" | "attention" | "off" | "neutral" | "info";

// Canonical status swatches. Every admin section reads these (directly via
// StatusPill/StatusDot, or by mirroring POS_PILL in a local status map) so the
// same state is the same color everywhere.
export const POS_PILL: Record<PosTone, string> = {
  live: "bg-green-100 text-green-800",
  attention: "bg-amber-100 text-amber-800",
  off: "bg-red-100 text-red-700",
  neutral: "bg-stone-100 text-stone-600",
  info: "bg-blue-100 text-blue-700",
};
const PILL = POS_PILL;

const DOT: Record<PosTone, string> = {
  live: "bg-green-600",
  attention: "bg-amber-500",
  off: "bg-red-600",
  neutral: "bg-stone-400",
  info: "bg-blue-600",
};

// A small status pill. Optional leading dot; `pulse` for a live/active state.
export function StatusPill({
  tone = "neutral",
  dot = true,
  pulse = false,
  className,
  children,
}: {
  tone?: PosTone;
  dot?: boolean;
  pulse?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide",
        PILL[tone],
        className,
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full", DOT[tone], pulse && "animate-pulse")} />}
      {children}
    </span>
  );
}

// A bare status dot (for compact rows/tiles).
export function StatusDot({ tone = "neutral", pulse = false, className }: { tone?: PosTone; pulse?: boolean; className?: string }) {
  return <span className={cn("inline-block size-2.5 rounded-full", DOT[tone], pulse && "animate-pulse", className)} />;
}

// A number-forward metric: the value gets real visual weight, the label stays
// quiet. This is the type-scale rule for prices / counts / totals.
export function Metric({
  label,
  value,
  tone,
  sub,
  className,
}: {
  label: string;
  value: React.ReactNode;
  tone?: PosTone;
  sub?: React.ReactNode;
  className?: string;
}) {
  const valueColor =
    tone === "live" ? "text-green-700" : tone === "off" ? "text-red-700" : tone === "attention" ? "text-amber-700" : "text-stone-900";
  return (
    <div className={cn("flex flex-col", className)}>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">{label}</span>
      <span className={cn("text-3xl font-extrabold leading-tight tabular-nums tracking-tight", valueColor)}>
        {value}
      </span>
      {sub && <span className="mt-0.5 text-xs text-stone-500">{sub}</span>}
    </div>
  );
}

// An elevated, tactile POS surface (card/tile). Use for content cards so the
// whole admin shares one card treatment.
export function PosCard({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-2xl border border-stone-200 bg-white p-6 shadow-sm", className)}
      {...props}
    >
      {children}
    </div>
  );
}

// Maps a boolean on/off toggle to the shared tone language (live vs off).
export function toggleTone(on: boolean): PosTone {
  return on ? "live" : "off";
}
