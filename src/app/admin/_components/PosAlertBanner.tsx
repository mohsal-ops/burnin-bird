import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import db from "@/db/db";

// Red banner on every admin page while a paid order couldn't reach the POS and
// the owner hasn't confirmed entering it by hand. Renders nothing (one cheap
// count) on sites without POS — and nothing at all if the table isn't there yet.
export default async function PosAlertBanner() {
  const n = await db.posOrderSync.count({ where: { status: "manual" } }).catch(() => 0);
  if (!n) return null;
  return (
    <div role="alert" className="flex flex-wrap items-center gap-2 bg-red-600 px-4 py-2.5 text-sm font-medium text-white">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      {n === 1 ? "1 paid order didn't reach your POS." : `${n} paid orders didn't reach your POS.`} Enter{" "}
      {n === 1 ? "it" : "them"} by hand.
      <Link href="/admin/pos" className="ml-auto rounded-full bg-white/15 px-3 py-1 underline-offset-2 hover:underline">
        See orders
      </Link>
    </div>
  );
}
