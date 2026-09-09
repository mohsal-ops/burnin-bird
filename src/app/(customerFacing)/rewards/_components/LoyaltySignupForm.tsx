"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

// The rewards join form. One definition, reused on /rewards and inside the
// Stripe checkout - so it's a <div> with a type="button" submit, never its own
// <form> (it must embed inside the checkout <form> without nesting). SMS and
// email are separate opt-ins: the SMS box only appears once a phone is entered,
// and each box is unchecked by default (pre-checked consent isn't valid).
// Copy/consent text and the reward come in as props (the parent server
// component reads them) so this client bundle never pulls in the DB module.
export default function LoyaltySignupForm({
  loyaltyEnabled,
  consentText,
  incentive,
  prefillEmail = "",
  prefillPhone = "",
  className = "",
  onSuccess,
}: {
  loyaltyEnabled: boolean;
  consentText: string;
  incentive: string;
  prefillEmail?: string;
  prefillPhone?: string;
  className?: string;
  // When provided (e.g. the popup), the parent owns the success UI - the form
  // hands off instead of rendering its own confirmation card.
  onSuccess?: (result: { sms: boolean; email: boolean }) => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState(prefillEmail);
  const [phone, setPhone] = useState(prefillPhone);
  const [birthday, setBirthday] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);
  const [emailConsent, setEmailConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ sms: boolean; email: boolean } | null>(null);

  if (!loyaltyEnabled) {
    return (
      <div className={`rounded-2xl border border-stone-200 bg-white p-6 text-center ${className}`}>
        <p className="font-semibold text-stone-800">Rewards are launching soon 🎉</p>
        <p className="mt-1 text-sm text-stone-500">Check back shortly to join.</p>
      </div>
    );
  }

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const phoneValid = phone.replace(/\D/g, "").length >= 10;
  const hasPhone = phone.trim().length > 0;
  // Can only join if at least one channel has a valid identifier + its consent.
  const canSubmit = (emailValid && emailConsent) || (phoneValid && smsConsent);

  const submit = async () => {
    setError("");
    if (!canSubmit) {
      setError("Enter an email or phone and check the box to join.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/loyalty/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim() || undefined,
          email: emailValid ? email.trim() : undefined,
          phone: phoneValid ? phone.trim() : undefined,
          birthday: birthday || undefined,
          smsConsent: phoneValid && smsConsent,
          emailConsent: emailValid && emailConsent,
          consentTextVersion: consentText,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        sms?: boolean;
        email?: boolean;
      };
      if (!res.ok || !data.ok) {
        setError(data.error || "Couldn't sign you up - please try again.");
      } else if (onSuccess) {
        onSuccess({ sms: !!data.sms, email: !!data.email });
      } else {
        setDone({ sms: !!data.sms, email: !!data.email });
      }
    } catch {
      setError("Couldn't sign you up - please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    const where =
      done.sms && done.email
        ? "your phone and inbox"
        : done.sms
          ? "your phone"
          : "your inbox";
    return (
      <div className={`rounded-2xl border border-stone-200 bg-white p-6 text-center ${className}`}>
        <p className="text-2xl">🎉</p>
        <p className="mt-1 text-lg font-bold text-stone-800">You&apos;re in!</p>
        <p className="mt-1 text-sm text-stone-600">
          Check <span className="font-semibold">{where}</span> for {incentive}.
        </p>
      </div>
    );
  }

  const inputCls =
    "w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-[#c85a1e]";

  return (
    <div className={`rounded-2xl border border-stone-200 bg-white p-5 text-left ${className}`}>
      <p className="text-sm font-semibold text-stone-800">
        Join Southern Jerks Rewards - get {incentive}
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First name (optional)"
          className={inputCls}
        />
        <input
          type="date"
          value={birthday}
          onChange={(e) => setBirthday(e.target.value)}
          title="Birthday (optional) - for a birthday treat"
          className={`${inputCls} text-stone-500`}
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className={inputCls}
        />
        <div>
          <input
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (!e.target.value.trim()) setSmsConsent(false);
            }}
            placeholder="Mobile number (optional)"
            className={inputCls}
          />
          <p className="mt-1 text-[11px] text-stone-400">Needed for text specials.</p>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {hasPhone && (
          <label className="flex items-start gap-2 text-xs text-stone-600">
            <input
              type="checkbox"
              checked={smsConsent}
              onChange={(e) => setSmsConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#c85a1e]"
            />
            <span>{consentText}</span>
          </label>
        )}
        <label className="flex items-start gap-2 text-xs text-stone-600">
          <input
            type="checkbox"
            checked={emailConsent}
            onChange={(e) => setEmailConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[#c85a1e]"
          />
          <span>Email me specials and news - unsubscribe anytime.</span>
        </label>
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <Button
        type="button"
        variant="mainButton"
        size="md"
        className="mt-3 w-full"
        disabled={submitting || !canSubmit}
        onClick={submit}
      >
        {submitting ? "Joining…" : "Join Rewards"}
      </Button>
    </div>
  );
}
