import { CheckCircle2, AlertTriangle, XCircle, MinusCircle } from "lucide-react";
import { gatherHealth } from "@/lib/ops/health";
import { summarise, type CheckStatus } from "@/lib/ops/checks";
import { getAllFlags } from "@/lib/flags";
import PageHeader from "../_components/pageHeader";

export const dynamic = "force-dynamic";

// /admin/health — one screen that says whether this site can take and fulfil
// orders right now, plus which platform features are on. Reached by URL (and
// linked from the agency's daily digest); always available, read-only.

const ICON: Record<CheckStatus, React.ReactNode> = {
  ok: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
  warn: <AlertTriangle className="h-5 w-5 text-amber-500" />,
  fail: <XCircle className="h-5 w-5 text-red-600" />,
  off: <MinusCircle className="h-5 w-5 text-stone-300" />,
};

export default async function HealthPage() {
  const [checks, flags] = await Promise.all([gatherHealth(), getAllFlags()]);
  const { status } = summarise(checks);
  return (
    <div className="lg:flex justify-center">
      <div className="w-full lg:w-[80%] p-4 md:p-6 space-y-5">
        <div>
          <PageHeader>Site health</PageHeader>
          <p className="mt-1 text-sm text-stone-500">
            {status === "ok" ? "Everything needed to take and fulfil orders is working." : status === "warn" ? "Working, with things to look at." : "Something is stopping orders — see below."}
          </p>
        </div>
        <ul className="divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white shadow-sm">
          {checks.map((c) => (
            <li key={c.id} className="flex items-start gap-3 px-5 py-3.5">
              <span className="mt-0.5">{ICON[c.status]}</span>
              <div>
                <p className="text-sm font-medium text-stone-800">{c.label}</p>
                <p className="text-sm text-stone-500">{c.detail}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm font-semibold text-stone-800">Platform features</p>
          <ul className="grid gap-1 text-sm sm:grid-cols-2">
            {Object.entries(flags).map(([k, f]) => (
              <li key={k} className="flex justify-between gap-3">
                <span className="text-stone-600">{f.label}</span>
                <span className={f.killed ? "text-red-600" : f.on ? "text-emerald-700" : "text-stone-400"}>
                  {f.killed ? "killed" : f.on ? "on" : "off"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
