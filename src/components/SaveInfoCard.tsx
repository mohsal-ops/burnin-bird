"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, UserRound } from "lucide-react";

// Order success page: "Save your info for next time?" One tap signs the
// customer in with the email they just paid with - no code, no password.
export default function SaveInfoCard({ paymentIntent, clientSecret, email }: { paymentIntent: string; clientSecret: string; email: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  if (state === "done")
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl bg-white/90 px-4 py-3 text-sm font-semibold text-stone-800">
        <Check className="h-4 w-4 text-green-600" /> Saved. Next time is faster.{" "}
        <Link href="/account" className="underline">
          Your account
        </Link>
      </div>
    );
  return (
    <div className="rounded-2xl bg-white/90 p-4 text-left text-stone-800">
      <p className="flex items-center gap-2 font-bold">
        <UserRound className="h-4 w-4" /> Save your info for next time?
      </p>
      <p className="mt-1 text-sm text-stone-600">See this order later and order again in one tap. We&apos;ll use {email}.</p>
      <button
        type="button"
        disabled={state === "busy"}
        onClick={async () => {
          setState("busy");
          const r = await fetch("/api/account", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "claim", paymentIntent, clientSecret }),
          }).catch(() => null);
          setState(r?.ok ? "done" : "error");
        }}
        className="mt-3 h-11 w-full rounded-xl bg-stone-900 font-bold text-white disabled:opacity-60"
      >
        {state === "busy" ? "Saving…" : "Yes, save it"}
      </button>
      {state === "error" && <p className="mt-2 text-sm text-red-600">That didn&apos;t work. You can sign in from the menu any time.</p>}
    </div>
  );
}
