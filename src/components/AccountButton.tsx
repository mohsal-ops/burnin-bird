"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";

// Small "Sign in / account" icon for every navbar. Renders nothing unless the
// restaurant turned accounts on (flag "customer_accounts"). One request per
// browser session, shared with the side menus (useAccountState).
type AccountState = { enabled: boolean; signedIn?: boolean; firstName?: string | null };
let cache: Promise<AccountState> | null = null;

export function useAccountState(): AccountState | null {
  const [state, setState] = useState<AccountState | null>(null);
  useEffect(() => {
    cache ??= fetch("/api/account", { cache: "no-store" })
      .then((r) => r.json())
      .catch(() => ({ enabled: false }));
    cache.then(setState);
  }, []);
  return state;
}

export default function AccountButton({ className = "" }: { className?: string }) {
  const state = useAccountState();
  if (!state?.enabled) return null;
  return (
    <Link
      href="/account"
      aria-label={state.signedIn ? "Your account" : "Sign in"}
      title={state.signedIn ? "Your account" : "Sign in"}
      className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted ${className}`}
    >
      <UserRound size={20} />
      {state.signedIn && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-green-500" />}
    </Link>
  );
}
