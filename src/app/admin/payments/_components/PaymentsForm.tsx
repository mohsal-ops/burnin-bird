"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, CheckCircle2, AlertTriangle, ExternalLink, PlugZap, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { connectStripe, disconnectStripe, testStripe } from "../_actions/paymentActions";

type Status = {
  source: "dashboard" | "env" | "none";
  mode: "live" | "test" | null;
  accountName: string;
  webhookUrl: string;
  connectedAt: string;
  publishableTail: string;
};

const KEYS_URL = "https://dashboard.stripe.com/apikeys";
const SIGNUP_URL = "https://dashboard.stripe.com/register";

export function PaymentsForm({ status }: { status: Status }) {
  const connected = status.source !== "none";
  const [editing, setEditing] = useState(!connected);
  const [sk, setSk] = useState("");
  const [pk, setPk] = useState("");
  const [showSk, setShowSk] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const [testing, startTest] = useTransition();
  const [test, setTest] = useState<{ ok: boolean; message: string } | null>(null);
  const confirm = useConfirm();

  const connect = () =>
    start(async () => {
      setError("");
      const r = await connectStripe({ secretKey: sk, publishableKey: pk });
      if (r.ok) {
        toast.success(r.message);
        setSk("");
        setPk("");
        setEditing(false);
        setTest(null);
      } else setError(r.error);
    });

  const runTest = () =>
    startTest(async () => {
      setTest(null);
      const r = await testStripe();
      setTest(r.ok ? { ok: true, message: r.message } : { ok: false, message: r.error });
    });

  const disconnect = async () => {
    const yes = await confirm({
      title: "Disconnect Stripe?",
      description: "Customers won't be able to pay online until you connect again. Money already in Stripe isn't affected.",
      confirmText: "Disconnect",
      destructive: true,
    });
    if (!yes) return;
    start(async () => {
      const r = await disconnectStripe();
      if (r.ok) {
        toast.success(r.message);
        setEditing(true);
      } else toast.error(r.error);
    });
  };

  const field =
    "w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 font-mono text-sm text-stone-800 outline-none transition-colors focus:border-stone-800";

  return (
    <div className="space-y-4">
      {/* status */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                connected ? "bg-emerald-50 text-emerald-600" : "bg-stone-100 text-stone-500"
              }`}
            >
              {connected ? <CheckCircle2 size={20} /> : <CreditCard size={20} />}
            </span>
            <div>
              <p className="font-semibold text-stone-800">
                {connected ? "Stripe is connected" : "Stripe isn't connected yet"}
                {status.mode === "test" && (
                  <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">Test mode</span>
                )}
              </p>
              <p className="mt-0.5 text-sm text-stone-500">
                {status.source === "dashboard" &&
                  `${status.accountName || "Your Stripe account"}${status.publishableTail ? ` · key …${status.publishableTail}` : ""}${
                    status.connectedAt ? ` · connected ${new Date(status.connectedAt).toLocaleDateString()}` : ""
                  }`}
                {status.source === "env" && "Set up for you by Starvega. You can switch to your own keys below anytime."}
                {status.source === "none" && "Customers can't pay online until you connect it. Takes about 2 minutes."}
              </p>
              {status.source === "dashboard" && status.webhookUrl && (
                <p className="mt-1 text-xs text-stone-400">Order confirmations: set up automatically ✓</p>
              )}
            </div>
          </div>
          {connected && (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={runTest} disabled={testing}>
                <PlugZap size={14} className="mr-1.5" />
                {testing ? "Checking…" : "Check connection"}
              </Button>
              {!editing && (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  {status.source === "env" ? "Use my own keys" : "Reconnect"}
                </Button>
              )}
              {status.source === "dashboard" && (
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={disconnect} disabled={pending}>
                  Disconnect
                </Button>
              )}
            </div>
          )}
        </div>
        {test && (
          <div
            role="status"
            className={`mt-4 flex items-start gap-2 rounded-xl p-3 text-sm ${
              test.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
            }`}
          >
            {test.ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertTriangle size={16} className="mt-0.5 shrink-0" />}
            {test.message}
          </div>
        )}
      </div>

      {/* connect: 3 steps */}
      {editing && (
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="font-semibold text-stone-800">Connect your Stripe</p>
          <ol className="mt-4 space-y-5">
            <li className="flex gap-3">
              <Step n={1} />
              <div className="flex-1">
                <p className="font-medium text-stone-800">Open your Stripe keys page</p>
                <p className="mt-0.5 text-sm text-stone-500">
                  Log in to Stripe. No account yet?{" "}
                  <a href={SIGNUP_URL} target="_blank" rel="noreferrer" className="font-medium text-stone-800 underline underline-offset-2">
                    Create one free
                  </a>{" "}
                  (your bank details go there, so payouts reach you).
                </p>
                <a
                  href={KEYS_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#635bff] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#5249e6]"
                >
                  Open Stripe keys <ExternalLink size={14} />
                </a>
              </div>
            </li>
            <li className="flex gap-3">
              <Step n={2} />
              <div className="flex-1 space-y-3">
                <p className="font-medium text-stone-800">Copy the 2 keys and paste them here</p>
                <label className="block">
                  <span className="text-sm text-stone-600">
                    Publishable key <span className="text-stone-400">(starts with pk_live_)</span>
                  </span>
                  <input
                    value={pk}
                    onChange={(e) => setPk(e.target.value)}
                    placeholder="pk_live_…"
                    autoComplete="off"
                    spellCheck={false}
                    className={`mt-1 ${field}`}
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-stone-600">
                    Secret key <span className="text-stone-400">(click &quot;Reveal&quot; in Stripe, starts with sk_live_)</span>
                  </span>
                  <span className="relative mt-1 block">
                    <input
                      value={sk}
                      onChange={(e) => setSk(e.target.value)}
                      type={showSk ? "text" : "password"}
                      placeholder="sk_live_…"
                      autoComplete="off"
                      spellCheck={false}
                      className={`${field} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSk((v) => !v)}
                      aria-label={showSk ? "Hide secret key" : "Show secret key"}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700"
                    >
                      {showSk ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </span>
                  <span className="mt-1 block text-xs text-stone-400">Stored encrypted. Never shown again, never shared.</span>
                </label>
              </div>
            </li>
            <li className="flex gap-3">
              <Step n={3} />
              <div className="flex-1">
                <p className="font-medium text-stone-800">Click Connect</p>
                <p className="mt-0.5 text-sm text-stone-500">
                  We check the keys with Stripe and set up order confirmations in your Stripe account for you.
                </p>
                {error && (
                  <div role="alert" className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-800">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    {error}
                  </div>
                )}
                <div className="mt-3 flex gap-2">
                  <Button onClick={connect} disabled={pending || !sk || !pk} variant="mainButton" size="md">
                    {pending ? "Connecting…" : "Connect Stripe"}
                  </Button>
                  {connected && (
                    <Button variant="outline" size="md" onClick={() => setEditing(false)} disabled={pending}>
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}

function Step({ n }: { n: number }) {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-900 text-sm font-semibold text-white">
      {n}
    </span>
  );
}
