"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NewOrderAlert from "@/components/NewOrderAlert";

// The kitchen new-order alarm, mounted in the admin LAYOUT so it keeps
// running (and stays enabled) on every dashboard page, not only Orders.
// Polls a tiny endpoint every 8s while the screen is visible, and refreshes
// the page data when the open-order list changes so lists / the live bar update.
type Order = Parameters<typeof NewOrderAlert>[0]["orders"][number];

export default function GlobalOrderAlert() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    let alive = true;
    let lastIds: string | null = null;
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const r = await fetch("/api/admin/live-orders", { cache: "no-store" });
        if (!r.ok) return;
        const { orders: next } = (await r.json()) as { orders: Order[] };
        if (!alive) return;
        const ids = next.map((o) => o.id).join(",");
        if (lastIds !== null && ids !== lastIds) router.refresh();
        lastIds = ids;
        setOrders(next);
      } catch {
        /* offline: try again next tick */
      }
    };
    void tick();
    const id = setInterval(tick, 8000);
    const onVis = () => {
      if (document.visibilityState === "visible") void tick();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      alive = false;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [router]);

  if (!orders) return null;
  return <NewOrderAlert orders={orders} />;
}
