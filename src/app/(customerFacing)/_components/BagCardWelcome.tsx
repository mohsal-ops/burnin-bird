"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

// Bag card (offer v3). The card in delivery/takeout bags has a QR to
// /?ref=bag&code=DIRECT. On arrival we save the code (checkout fills it in, see
// PromoField) and say hello once. Nothing shows for normal visitors.
export default function BagCardWelcome({ name }: { name: string }) {
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      if (q.get("ref") !== "bag") return;
      const c = (q.get("code") || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);
      if (c) {
        sessionStorage.setItem("bag_code", c);
        localStorage.setItem("bag_code", c);
      }
      setCode(c || "");
      // Clean the address bar so a shared link doesn't carry the code around.
      q.delete("ref");
      q.delete("code");
      const rest = q.toString();
      window.history.replaceState(null, "", window.location.pathname + (rest ? `?${rest}` : "") + window.location.hash);
    } catch {
      /* storage blocked */
    }
  }, []);

  if (code === null) return null;
  return (
    <div className="fixed inset-x-3 bottom-4 z-[60] mx-auto max-w-md rounded-2xl bg-stone-900 p-4 text-white shadow-2xl sm:bottom-6">
      <button aria-label="Close" onClick={() => setCode(null)} className="absolute right-3 top-3 text-white/60 hover:text-white">
        <X className="size-4" />
      </button>
      <p className="pr-6 text-base font-semibold">Welcome back to {name}!</p>
      <p className="mt-1 text-sm text-white/75">
        {code
          ? <>Thanks for ordering straight from us. Your code <span className="font-mono font-semibold text-white">{code}</span> is saved for checkout.</>
          : "Thanks for ordering straight from us."}
      </p>
      <a href="/Menu" className="mt-3 inline-block rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-stone-900">
        See the menu
      </a>
    </div>
  );
}
