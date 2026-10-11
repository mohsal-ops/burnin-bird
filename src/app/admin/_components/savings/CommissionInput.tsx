"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveCommissionPct, sendTestReport, setMonthlyEmail } from "./savingsActions";

type R = { ok: true; message?: string } | { ok: false; error: string };
const report = (r: R, fallback: string) => {
  if (r.ok) toast.success(r.message ?? fallback);
  else toast.error(r.error);
};

export function CommissionInput({ initial }: { initial: number }) {
  const [v, setV] = useState(String(initial));
  const [pending, start] = useTransition();
  return (
    <label className="flex flex-wrap items-center gap-2 pt-1">
      <span>The delivery app you&apos;d otherwise use charges</span>
      <input
        type="number"
        min={0}
        max={60}
        className="w-16 rounded border border-stone-300 px-2 py-1"
        value={v}
        onChange={(e) => setV(e.target.value)}
      />
      %
      <button
        type="button"
        disabled={pending || v === String(initial)}
        className="rounded-full bg-stone-900 px-3 py-1 text-xs font-medium text-white disabled:opacity-40"
        onClick={() => start(async () => report(await saveCommissionPct(Number(v)), "Saved"))}
      >
        Save
      </button>
    </label>
  );
}

export function ReportControls({ emailOn }: { emailOn: boolean }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap items-center gap-3 pt-1">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={emailOn}
          disabled={pending}
          onChange={(e) => start(async () => report(await setMonthlyEmail(e.target.checked), "Saved"))}
        />
        Email me this report every month
      </label>
      <button
        type="button"
        disabled={pending}
        className="rounded-full border border-stone-300 px-3 py-1 text-xs font-medium"
        onClick={() => start(async () => report(await sendTestReport(), "Sent"))}
      >
        Send me a test report
      </button>
    </div>
  );
}
