import { getOutreach, formatUsd } from "@/lib/outreach";

// Shown only to read-only preview visitors (outreach leads). Honest: it says
// plainly that this is a live, read-only demo of their own dashboard and that
// saving is locked until they go live — and reinforces the offer without any
// countdown or fake scarcity.
export default function PreviewBanner() {
  const o = getOutreach();
  return (
    <div className="relative z-40 flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 bg-stone-900 px-4 py-2 text-center text-xs text-white sm:text-sm md:sticky md:top-0">
      <span className="font-semibold">
        You&apos;re previewing your live dashboard, read-only.
      </span>
      <span className="text-white/70">
        Everything works; saving is locked until you go live.
      </span>
      <span className="text-white/90">
        Full setup{" "}
        <span className="font-semibold">{formatUsd(o.discountedPrice)}</span>{" "}
        <span className="text-white/50 line-through">{formatUsd(o.fullPrice)}</span>
      </span>
    </div>
  );
}
