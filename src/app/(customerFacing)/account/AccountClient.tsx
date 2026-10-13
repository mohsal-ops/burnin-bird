"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Gift, LogOut, Mail, Receipt } from "lucide-react";
import { loadCustomer } from "@/lib/customerMemory";

// Optional customer account: sign in with an emailed 6-digit code (no
// password), then see past orders and loyalty status. Guests never need it.

type Order = { at: string; totalCents: number; items: { id: string; name: string; image: string | null }[] };
type Me =
  | { enabled: false }
  | { enabled: true; signedIn: false }
  | {
      enabled: true;
      signedIn: true;
      email: string;
      firstName: string | null;
      orders: Order[];
      loyalty: { member: boolean };
    };

const money = (c: number) => `$${(c / 100).toFixed(2)}`;
const day = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

export default function AccountClient() {
  const [me, setMe] = useState<Me | null>(null);
  const load = useCallback(() => {
    fetch("/api/account", { cache: "no-store" })
      .then((r) => r.json())
      .then(setMe)
      .catch(() => setMe({ enabled: false }));
  }, []);
  useEffect(load, [load]);

  return (
    <div className="mx-auto w-full max-w-md px-5 pb-24 pt-28">
      {!me ? (
        <div className="h-64 animate-pulse rounded-3xl bg-muted" />
      ) : !me.enabled ? (
        <p className="text-center text-muted-foreground">Accounts aren&apos;t turned on for this restaurant.</p>
      ) : !me.signedIn ? (
        <SignIn onDone={load} />
      ) : (
        <Account me={me} onLogout={load} />
      )}
    </div>
  );
}

function SignIn({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [challenge, setChallenge] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const call = async (body: Record<string, string>) => {
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Something went wrong. Try again.");
      return j;
    } catch (e) {
      setErr((e as Error).message);
      return null;
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight">{challenge ? "Check your email" : "Sign in"}</h1>
      <p className="mt-2 text-muted-foreground">
        {challenge
          ? `We sent a 6-digit code to ${email}.`
          : "See your past orders and order again faster. No password. You can always order as a guest."}
      </p>

      {!challenge ? (
        <form
          className="mt-6 flex flex-col gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const j = await call({ action: "code", email });
            if (j?.challenge) setChallenge(j.challenge);
          }}
        >
          <label className="text-sm font-semibold" htmlFor="acct-email">
            Email
          </label>
          <input
            id="acct-email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 rounded-xl border border-border bg-background px-4 text-base outline-none focus:border-[var(--brand)]"
            placeholder="you@email.com"
          />
          <button type="submit" disabled={busy} className="mt-1 flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--brand)] font-bold text-[var(--brand-foreground)] disabled:opacity-60">
            <Mail size={18} /> {busy ? "Sending…" : "Email me a code"}
          </button>
        </form>
      ) : (
        <form
          className="mt-6 flex flex-col gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const j = await call({ action: "verify", challenge, code });
            if (j?.ok) window.location.reload(); // navbar icon + app pick up the new session
          }}
        >
          <label className="text-sm font-semibold" htmlFor="acct-code">
            Code
          </label>
          <input
            id="acct-code"
            required
            autoComplete="one-time-code"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="h-14 rounded-xl border border-border bg-background px-4 text-center text-2xl font-bold tracking-[0.4em] outline-none focus:border-[var(--brand)]"
            placeholder="••••••"
          />
          <button type="submit" disabled={busy || code.length !== 6} className="mt-1 h-12 rounded-xl bg-[var(--brand)] font-bold text-[var(--brand-foreground)] disabled:opacity-60">
            {busy ? "Checking…" : "Sign in"}
          </button>
          <button
            type="button"
            className="text-sm font-semibold text-muted-foreground underline"
            onClick={() => {
              setChallenge(null);
              setCode("");
            }}
          >
            Use a different email
          </button>
        </form>
      )}
      {err && <p className="mt-3 text-sm font-semibold text-red-600">{err}</p>}
      <Link href="/Menu" className="mt-8 flex items-center justify-center gap-1 text-sm font-semibold text-muted-foreground">
        Order as a guest <ArrowRight size={14} />
      </Link>
    </div>
  );
}

function Account({ me, onLogout }: { me: Extract<Me, { signedIn: true }>; onLogout: () => void }) {
  const name = me.firstName || loadCustomer().name?.split(/\s+/)[0] || "";
  return (
    <div>
      <p className="text-sm font-semibold text-muted-foreground">{me.email}</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{name ? `Hi, ${name}` : "Your account"}</h1>

      <Link href="/rewards" className="mt-6 flex items-center gap-3 rounded-2xl bg-muted px-4 py-4">
        <Gift size={20} className="text-[var(--brand)]" />
        <span className="flex-1 font-bold">{me.loyalty.member ? "You're in the rewards club" : "Join the rewards club"}</span>
        <ArrowRight size={16} className="opacity-50" />
      </Link>

      <h2 className="mt-8 flex items-center gap-2 text-lg font-extrabold">
        <Receipt size={18} /> Past orders
      </h2>
      {me.orders.length === 0 ? (
        <p className="mt-3 text-muted-foreground">
          No orders with this email yet. Orders show up here when you pay with this same email.
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          {me.orders.map((o) => (
            <div key={o.at} className="rounded-2xl border border-border p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-muted-foreground">{day(o.at)}</span>
                <span className="font-bold">{money(o.totalCents)}</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                {o.items.slice(0, 4).map((it, i) =>
                  it.image ? (
                    <span key={i} className="relative h-12 w-12 overflow-hidden rounded-xl bg-muted">
                      <Image src={it.image} alt={it.name} fill sizes="48px" className="object-cover" />
                    </span>
                  ) : null,
                )}
                <span className="ml-1 line-clamp-2 flex-1 text-sm">{o.items.map((i) => i.name.trim()).join(", ")}</span>
              </div>
              <ReorderButton items={o.items} />
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={async () => {
          await fetch("/api/account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) });
          onLogout();
        }}
        className="mt-10 flex items-center gap-2 text-sm font-semibold text-muted-foreground"
      >
        <LogOut size={16} /> Sign out
      </button>
    </div>
  );
}

// One tap: puts every dish from that order back in the cart (prices come from
// today's menu, checked by the server). Past orders don't keep options, so a
// dish that needs a choice (e.g. heat level) is named instead of guessed.
function ReorderButton({ items }: { items: { id: string; name: string }[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const run = async () => {
    setBusy(true);
    setMsg("");
    const unique = [...new Map(items.map((i) => [i.id, i])).values()];
    const needChoice: string[] = [];
    let added = 0;
    for (const it of unique) {
      const r = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: it.id, quantity: 1 }),
      }).catch(() => null);
      if (r?.ok) added++;
      else needChoice.push(it.name.trim());
    }
    setBusy(false);
    if (added && !needChoice.length) return router.push("/Menu?cart=open");
    setMsg(
      added
        ? `Added ${added}. Pick your options for ${needChoice.join(", ")} on the menu.`
        : `Pick your options for ${needChoice.join(", ")} on the menu.`,
    );
    if (added) setTimeout(() => router.push("/Menu?cart=open"), 1800);
  };
  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[var(--brand)] px-4 text-sm font-bold text-[var(--brand-foreground)] disabled:opacity-60"
      >
        {busy ? "Adding…" : "Order again"} <ArrowRight size={14} />
      </button>
      {msg && <p className="mt-2 text-sm text-muted-foreground">{msg}</p>}
    </div>
  );
}
