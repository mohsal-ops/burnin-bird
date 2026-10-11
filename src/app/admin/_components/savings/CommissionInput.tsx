"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveCommissionPct } from "./savingsActions";

export default function CommissionInput({ initial }: { initial: number }) {
  const [v, setV] = useState(String(initial));
  const [pending, start] = useTransition();
  return (
    <label className="flex items-center gap-2 pt-1">
      <span>The app you&apos;d otherwise use charges</span>
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
        onClick={() =>
          start(async () => {
            const r = await saveCommissionPct(Number(v));
            if (r.ok) toast.success("Saved");
            else toast.error(r.error);
          })
        }
      >
        Save
      </button>
    </label>
  );
}
