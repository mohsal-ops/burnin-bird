"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Bell, Clock, MapPin, Store } from "lucide-react";
import { deriveOrderType } from "@/lib/orderType";
import { startAlertLoop, stopAlertLoop, unlockAudio } from "@/lib/orderAlertSound";

// The kitchen new-order alert. Watches the live orders list for orders that
// weren't there before and, for each genuinely new one, sounds a repeating chime
// and throws up an unmistakable full-screen alarm the staff must tap to
// acknowledge. Two hard rules honored here: audio only starts after an explicit
// "enable" tap (browser autoplay gesture), and the alarm uses a smooth ~0.55Hz
// pulse, never a hard strobe (photosensitivity).

type AlertOrderItem = {
  customerName: string | null;
  deliveryAddress: string | null;
  orderType: string | null;
};

type AlertOrder = {
  id: string;
  status: string;
  createdAt: Date | string;
  items: AlertOrderItem[];
};

type Queued = {
  id: string;
  itemCount: number;
  customerName: string | null;
  type: "pickup" | "delivery";
  arrivedAt: number; // ms epoch of the order's createdAt
};

// sessionStorage (NOT localStorage): survives a mid-shift page refresh so already
// seen orders don't re-alert, but resets when the tablet is actually restarted
// for a new day.
const SEEN_KEY = "kitchen:seenOrders";

function loadSeen(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(SEEN_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(arr) ? (arr as string[]) : []);
  } catch {
    return new Set();
  }
}

function toQueued(o: AlertOrder): Queued {
  const first = o.items[0] ?? { customerName: null, deliveryAddress: null, orderType: null };
  return {
    id: o.id,
    itemCount: o.items.length,
    customerName: first.customerName,
    type: deriveOrderType(first),
    arrivedAt: new Date(o.createdAt).getTime(),
  };
}

function fmtElapsed(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export default function NewOrderAlert({ orders }: { orders: AlertOrder[] }) {
  const reduce = useReducedMotion();

  // Audio is enabled by an explicit tap (per-session; a page reload is a fresh
  // audio session so the banner correctly reappears).
  const [alertsOn, setAlertsOn] = useState(false);
  const [queue, setQueue] = useState<Queued[]>([]);
  const [nowTs, setNowTs] = useState(() => Date.now());

  // Seed the "seen" set once, synchronously, from sessionStorage so it's ready
  // before the orders effect below runs.
  const seenRef = useRef<Set<string> | null>(null);
  if (seenRef.current === null) seenRef.current = loadSeen();
  const initializedRef = useRef(false);

  const persistSeen = () => {
    try {
      sessionStorage.setItem(SEEN_KEY, JSON.stringify([...seenRef.current!]));
    } catch {
      /* private mode / storage full - non-fatal */
    }
  };

  // Detect newly-arrived open orders on every poll. The FIRST pass just baselines
  // whatever is already open (so opening the dashboard never alerts on existing
  // orders); after that, any open id we haven't seen is a real new order.
  useEffect(() => {
    // "new" = a paid order awaiting the kitchen (what finalizeCart sets). Open
    // carts are unpaid and never alarm.
    const newOrders = orders.filter((o) => o.status === "new");
    const seen = seenRef.current!;

    if (!initializedRef.current) {
      newOrders.forEach((o) => seen.add(o.id));
      persistSeen();
      initializedRef.current = true;
      return;
    }

    const fresh = newOrders.filter((o) => !seen.has(o.id));
    if (fresh.length === 0) return;
    fresh.forEach((o) => seen.add(o.id));
    persistSeen();
    setQueue((q) => [...q, ...fresh.map(toQueued)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders]);

  // Sound the loop while there's anything unacknowledged (and audio is enabled).
  // stopAlertLoop only fires when the WHOLE queue is cleared - nobody walks away
  // mid-stack.
  useEffect(() => {
    if (alertsOn && queue.length > 0) startAlertLoop();
    else stopAlertLoop();
  }, [alertsOn, queue.length]);

  // Always stop the tone if this screen unmounts.
  useEffect(() => () => stopAlertLoop(), []);

  // Tick the elapsed counter while an alarm is showing.
  useEffect(() => {
    if (queue.length === 0) return;
    setNowTs(Date.now());
    const t = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(t);
  }, [queue.length]);

  const enable = () => {
    unlockAudio();
    setAlertsOn(true);
  };
  const dismiss = () => setQueue((q) => q.slice(1));

  const current = queue[0];
  const moreWaiting = queue.length - 1;

  return (
    <>
      {/* Enable-audio banner: obvious, persistent, above the overlay so staff can
          arm sound even while an alarm is already showing. */}
      {!alertsOn && (
        <button
          onClick={enable}
          className="fixed bottom-4 left-1/2 z-[110] -translate-x-1/2 rounded-full bg-[#c85a1e] px-5 py-3 text-sm font-bold text-white shadow-lg ring-4 ring-[#c85a1e]/20 transition hover:bg-[#b04d17] animate-pulse"
        >
          🔔 Tap to enable order alerts
        </button>
      )}

      <AnimatePresence>
        {current && (
          <motion.div
            key="order-alarm"
            role="alertdialog"
            aria-label="New order"
            className="fixed inset-0 z-[100] flex cursor-pointer items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={dismiss}
          >
            {/* Pulsing alarm backdrop - smooth ~1.8s cycle (~0.55Hz), never a
                hard on/off flash. Reduced-motion users get a steady wash. */}
            <motion.div
              aria-hidden
              className="absolute inset-0"
              style={{ backgroundColor: "rgba(185,28,28,0.92)" }}
              animate={
                reduce
                  ? { opacity: 1 }
                  : { backgroundColor: ["rgba(127,17,17,0.9)", "rgba(220,38,38,0.94)"] }
              }
              transition={
                reduce
                  ? { duration: 0 }
                  : { duration: 0.9, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }
              }
            />

            {/* Alarm card */}
            <motion.div
              initial={{ scale: reduce ? 1 : 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={reduce ? { duration: 0.15 } : { type: "spring", stiffness: 300, damping: 22 }}
              className="relative z-10 w-full max-w-md rounded-3xl bg-white/95 p-8 text-center shadow-2xl backdrop-blur"
            >
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-red-100 text-red-600">
                <Bell size={32} className={reduce ? "" : "animate-bounce"} />
              </div>
              <h2 className="mt-4 text-4xl font-black tracking-tight text-red-700">NEW ORDER</h2>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-lg font-semibold text-stone-800">
                <span>
                  {current.itemCount} item{current.itemCount !== 1 ? "s" : ""}
                </span>
                <span className="text-stone-300">·</span>
                <span className="inline-flex items-center gap-1.5 capitalize">
                  {current.type === "delivery" ? <MapPin size={18} /> : <Store size={18} />}
                  {current.type}
                </span>
                {current.customerName && (
                  <>
                    <span className="text-stone-300">·</span>
                    <span>{current.customerName}</span>
                  </>
                )}
              </div>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2 font-mono text-2xl font-bold tabular-nums text-white">
                <Clock size={20} />
                <span suppressHydrationWarning>{fmtElapsed(nowTs - current.arrivedAt)}</span>
              </div>

              {moreWaiting > 0 && (
                <p className="mt-4 text-sm font-bold uppercase tracking-wide text-red-600">
                  +{moreWaiting} more waiting
                </p>
              )}

              <p className="mt-6 text-sm font-medium text-stone-400">Tap anywhere to acknowledge</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
