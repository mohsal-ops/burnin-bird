"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Instagram } from "lucide-react";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { ThemeToggle } from "@/components/ThemeToggle";
import AppSideBar from "../sideBar";
import CartSideBar from "../Cart-SideBar";
import { shouldShowCart, useNavCart } from "./useNavCart";

// Bespoke navbar for diner-classic — modeled on Fame Grilled Cheese: a solid
// chocolate-brown bar, a two-line lockup (golden script name over a small caps
// cuisine line) on the left, a golden Instagram square and a chunky golden
// "order now" button with a hard offset shadow on the right.

// Colours come from the owner-editable palette (admin → Branding → Design
// colours), injected as --tp-* vars by the root layout. Defaults = Fame's
// golden #FCB931 / chocolate #3B2517 / cream #F9F4ED.
export const DINER = { brown: "var(--tp-ink)", cream: "var(--tp-paper)", gold: "var(--tp-accent)", onGold: "var(--tp-on-accent)", onBrown: "var(--tp-on-ink)" } as const;
/** Palette colour at an alpha (works with CSS vars, unlike "#hex" + "22"). */
export const tint = (c: string, pct: number) => `color-mix(in srgb, ${c} ${pct}%, transparent)`;

// Wordmark only (no logo badge): the golden script name, with a SHORT cuisine
// line tucked underneath. Long descriptors (“fresh mediterranean dips &
// artisanal hummus”) used to collide with the tilted script — now the sub line
// is the first cuisine word(s), capped and clipped, with real breathing room.
function shortSub(): string {
  const c = SITE_CONFIG;
  const raw = (c.cuisines?.[0] || c.primaryDish || "").trim();
  const cut = raw.split(/s*[&,|·•-]s*|s+ands+/i)[0] ?? "";
  return cut.length > 22 ? cut.split(" ").slice(0, 2).join(" ") : cut;
}

export function DinerLockup({ size = "md" }: { size?: "md" | "lg" }) {
  const c = SITE_CONFIG;
  const name = c.trademark || c.name;
  const sub = shortSub().toUpperCase();
  return (
    <span className="flex flex-col items-start leading-none">
      <span
        className={`${size === "lg" ? "text-5xl" : "text-[1.9rem] md:text-[2.1rem]"} inline-block whitespace-nowrap pb-1`}
        style={{ fontFamily: "var(--font-script), cursive", color: DINER.gold, transform: "rotate(-4deg)", transformOrigin: "left bottom" }}
      >
        {name}
      </span>
      {sub && (
        <span className={`${size === "lg" ? "mt-2 text-sm" : "mt-1 text-[0.58rem]"} max-w-[15rem] truncate pl-1 font-extrabold tracking-[0.22em]`} style={{ color: tint(DINER.onBrown, 70) }}>
          {sub}
        </span>
      )}
    </span>
  );
}

export function DinerButton({ href, children, className = "", shadow = DINER.brown, tone = "gold" }: { href: string; children: React.ReactNode; className?: string; shadow?: string; tone?: "gold" | "brown" }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-md px-7 py-3 text-base font-extrabold lowercase transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_var(--diner-shadow)] active:translate-x-1 active:translate-y-1 active:shadow-none ${className}`}
      style={{ background: tone === "gold" ? DINER.gold : DINER.brown, color: tone === "gold" ? DINER.onGold : DINER.onBrown, boxShadow: "5px 5px 0 var(--diner-shadow)", ["--diner-shadow" as string]: shadow }}
    >
      {children}
    </Link>
  );
}

export function DinerNav({ initialCartId }: { initialCartId: string | null; logoUrl?: string }) {
  const pathname = usePathname();
  const { cartId, cartItems } = useNavCart(initialCartId);
  const c = SITE_CONFIG;

  return (
    <div style={{ background: DINER.brown, color: DINER.onBrown }}>
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-5 md:px-8">
        <Link href="/" aria-label={`${c.name} home`}>
          <DinerLockup />
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {c.navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`relative whitespace-nowrap text-sm font-bold lowercase transition-colors after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-[var(--tp-accent)] after:transition-transform hover:after:scale-x-100 ${l.href === pathname ? "text-[var(--tp-accent)]" : "text-[var(--tp-on-ink)]/80 hover:text-[var(--tp-on-ink)]"}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {c.instagramUrl && (
            <a
              href={c.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="hidden size-9 place-items-center rounded-md transition-transform hover:-rotate-6 hover:scale-110 sm:grid"
              style={{ background: DINER.gold, color: DINER.onGold }}
            >
              <Instagram className="size-4.5" />
            </a>
          )}
          <span className="hidden md:inline-flex [&_button]:text-[var(--tp-on-ink)]">
            <ThemeToggle />
          </span>
          {shouldShowCart(pathname, cartItems.length) && (
            <span className="hidden md:block [&_button>div]:!border-[var(--tp-on-ink)]/30 [&_button>div]:!bg-transparent [&_button>div]:!text-[var(--tp-on-ink)]">
              <CartSideBar cartId={cartId} cartItems={cartItems} />
            </span>
          )}
          <span className="hidden md:block">
            <DinerButton href="/Menu" shadow={DINER.cream} className="!py-2.5 !text-[0.95rem]">
              {c.menuCtaLabel}
            </DinerButton>
          </span>
          <span className="md:hidden [&_button]:text-[var(--tp-on-ink)]">
            <AppSideBar />
          </span>
        </div>
      </div>
      {cartItems.length > 0 && (
        <div className="fixed bottom-1 left-2 right-2 z-50 flex justify-center md:hidden">
          <CartSideBar cartId={cartId} cartItems={cartItems} />
        </div>
      )}
    </div>
  );
}
