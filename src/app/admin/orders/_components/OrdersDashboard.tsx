"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  RefreshCw,
  ChevronDown,
  MapPin,
  Store,
  Phone,
  Trash2,
  CheckCircle2,
  Archive,
} from "lucide-react";
import { updateCartStatus, deleteCart } from "../_actions/cartOrders";
import { deriveOrderType } from "@/lib/orderType";

type OrderItemSide = { id: string; label: string; priceInCents: number | null };

type OrderItem = {
  id: string;
  name: string | null;
  price: number | null;
  quantity: number | null;
  pickupDay: Date | null;
  pickupTime: string | null;
  deliveryAddress: string | null;
  apt: string | null;
  instructions: string | null;
  customerName: string | null;
  customerPhone: string | null;
  orderType: string | null;
  sides: OrderItemSide[];
};

type Order = {
  id: string;
  status: string;
  createdAt: Date;
  items: OrderItem[];
};

type Stats = {
  totalOrdersToday: number;
  revenueTodayCents: number;
  averageOrderValueCents: number;
  pickupCount: number;
  deliveryCount: number;
  ordersByHour: number[];
  mostOrderedItem: { name: string; count: number } | null;
};

const STATUS_TABS = ["all", "open", "completed", "abandoned"] as const;

export default function OrdersDashboard({ orders, stats }: { orders: Order[]; stats: Stats }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<(typeof STATUS_TABS)[number]>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Keep the dashboard reasonably live without the admin having to babysit it.
  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 60000);
    return () => clearInterval(interval);
  }, [router]);

  const filteredOrders = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const orderTotal = (order: Order) =>
    order.items.reduce((sum, i) => sum + (i.price ?? 0) * (i.quantity ?? 1), 0);
  const maxHourCount = Math.max(1, ...stats.ordersByHour);

  return (
    <div className="space-y-6 px-4 md:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Orders</h1>
          <p className="text-sm text-stone-500 mt-0.5">Live orders from the cart</p>
        </div>
        <Button variant="outline" onClick={refresh} disabled={isRefreshing} className="gap-2 self-start sm:self-auto">
          <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Orders Today" value={stats.totalOrdersToday} />
        <StatCard label="Revenue Today" value={formatCurrency(stats.revenueTodayCents / 100)} />
        <StatCard label="Avg Order Value" value={formatCurrency(stats.averageOrderValueCents / 100)} />
        <StatCard
          label="Most Ordered"
          value={stats.mostOrderedItem ? stats.mostOrderedItem.name : "-"}
          sub={stats.mostOrderedItem ? `${stats.mostOrderedItem.count} sold all-time` : undefined}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4">
            Pickup vs Delivery (today)
          </p>
          <PickupDeliverySplit pickup={stats.pickupCount} delivery={stats.deliveryCount} />
        </div>
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 overflow-x-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4">
            Orders by Hour (today)
          </p>
          <div className="flex items-end gap-1 h-28 min-w-[480px]">
            {stats.ordersByHour.map((count, hour) => (
              <div key={hour} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-[#c85a1e] rounded-t"
                  style={{ height: `${(count / maxHourCount) * 100}%`, minHeight: count > 0 ? 4 : 0 }}
                  title={`${count} order${count !== 1 ? "s" : ""} at ${hour}:00`}
                />
                <span className="text-[9px] text-stone-400">{hour}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              filter === f ? "bg-[#c85a1e] text-white" : "bg-stone-100 text-stone-500 hover:bg-stone-200"
            }`}
          >
            {f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Order list */}
      <div className="space-y-3">
        {filteredOrders.length === 0 && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8 text-center text-stone-400 text-sm">
            No orders found
          </div>
        )}
        {filteredOrders.map((order) => {
          const first = order.items[0];
          if (!first) return null;
          const total = orderTotal(order);
          const type = deriveOrderType(first);
          const isExpanded = expandedId === order.id;

          return (
            <div key={order.id} className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              <button
                className="w-full flex flex-wrap items-center gap-3 p-4 text-left"
                onClick={() => setExpandedId(isExpanded ? null : order.id)}
              >
                <span className="font-mono text-xs text-stone-400">#{order.id.slice(0, 8)}</span>
                <StatusBadge status={order.status} />
                <span className="flex items-center gap-1 text-xs text-stone-500 capitalize">
                  {type === "delivery" ? <MapPin size={12} /> : <Store size={12} />} {type}
                </span>
                <span className="text-xs text-stone-400">
                  {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                </span>
                <span className="text-xs text-stone-400 hidden sm:inline">
                  {new Date(order.createdAt).toLocaleString()}
                </span>
                <span className="ml-auto font-semibold text-stone-800">{formatCurrency(total / 100)}</span>
                <ChevronDown
                  size={16}
                  className={`text-stone-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                />
              </button>

              {isExpanded && (
                <div className="border-t border-stone-100 p-4 space-y-4">
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm gap-3">
                        <div>
                          <p className="font-medium text-stone-800">
                            {item.name} × {item.quantity}
                          </p>
                          {item.sides.length > 0 && (
                            <ul className="text-xs text-stone-400 pl-3">
                              {item.sides.map((s) => (
                                <li key={s.id}>
                                  • {s.label}
                                  {s.priceInCents ? ` (+${formatCurrency(s.priceInCents / 100)})` : ""}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <span className="text-stone-600 flex-shrink-0">
                          {formatCurrency(((item.price ?? 0) * (item.quantity ?? 1)) / 100)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2 text-xs text-stone-500 bg-stone-50 rounded-xl p-3">
                    {first.customerName && (
                      <p>
                        <span className="font-semibold text-stone-700">Name:</span> {first.customerName}
                      </p>
                    )}
                    {first.customerPhone && (
                      <p className="flex items-center gap-1">
                        <Phone size={11} /> {first.customerPhone}
                      </p>
                    )}
                    {type === "delivery" ? (
                      <>
                        <p className="sm:col-span-2">
                          <span className="font-semibold text-stone-700">Deliver to:</span>{" "}
                          {first.deliveryAddress} {first.apt ? `(${first.apt})` : ""}
                        </p>
                        {first.instructions && (
                          <p className="sm:col-span-2">
                            <span className="font-semibold text-stone-700">Instructions:</span> {first.instructions}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="sm:col-span-2">
                        <span className="font-semibold text-stone-700">Pickup:</span>{" "}
                        {first.pickupDay ? new Date(first.pickupDay).toDateString() : "-"} {first.pickupTime ?? ""}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {order.status !== "completed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        className="gap-1.5"
                        onClick={() =>
                          startTransition(async () => {
                            await updateCartStatus(order.id, "completed");
                            router.refresh();
                            toast("Marked completed");
                          })
                        }
                      >
                        <CheckCircle2 size={14} /> Mark Completed
                      </Button>
                    )}
                    {order.status !== "abandoned" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        className="gap-1.5"
                        onClick={() =>
                          startTransition(async () => {
                            await updateCartStatus(order.id, "abandoned");
                            router.refresh();
                            toast("Marked abandoned");
                          })
                        }
                      >
                        <Archive size={14} /> Mark Abandoned
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={isPending}
                      className="gap-1.5"
                      onClick={() => {
                        if (!confirm("Delete this order permanently?")) return;
                        startTransition(async () => {
                          await deleteCart(order.id);
                          router.refresh();
                          toast("Order deleted");
                        });
                      }}
                    >
                      <Trash2 size={14} /> Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
      <p className="text-2xl font-bold text-stone-900 truncate">{value}</p>
      <p className="text-xs font-medium text-stone-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-stone-400 mt-1">{sub}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    open: "bg-blue-50 text-blue-600",
    completed: "bg-green-50 text-green-600",
    abandoned: "bg-stone-100 text-stone-500",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${styles[status] ?? styles.open}`}>
      {status}
    </span>
  );
}

function PickupDeliverySplit({ pickup, delivery }: { pickup: number; delivery: number }) {
  const total = pickup + delivery;
  const pickupPct = total > 0 ? Math.round((pickup / total) * 100) : 0;
  return (
    <div className="space-y-3">
      <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden flex">
        <div className="h-full bg-[#1a6b3c]" style={{ width: `${pickupPct}%` }} />
        <div className="h-full bg-[#1d4ed8]" style={{ width: `${100 - pickupPct}%` }} />
      </div>
      <div className="flex justify-between text-xs text-stone-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#1a6b3c]" /> Pickup ({pickup})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#1d4ed8]" /> Delivery ({delivery})
        </span>
      </div>
    </div>
  );
}
