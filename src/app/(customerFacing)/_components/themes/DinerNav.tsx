"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Instagram } from "lucide-react";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { ThemeToggle } from "@/components/ThemeToggle";
import AppSideBar from "../sideBar";
import CartSideBar from "../Cart-SideBar";
import { useNavCart } from "./useNavCart";

// Bespoke navbar for diner-classic — modeled on Fame Grilled Cheese: a solid
// chocolate-brown bar, a two-line lockup (golden script name over a small caps
// cuisine line) on the left, a golden Instagram square and a chunky golden
// "order now" button with a hard offset shadow on the right.

export const DINER = { brown: "#3B2517", cream: "#F9F4ED", gold: "#FCB931" } as const;

export function DinerLockup({ size = "md", logoUrl }: { size?: "md" | "lg"; logoUrl?: string | null }) {
  const c = SITE_CONFIG;
  const name = c.trademark || c.name;
  const sub = (c.primaryDish || c.cuisines?.[0] || "").toUpperCase();
  return (
    <span className="flex items-center gap-2.5">
      {logoUrl && size === "md" && (
        <Image src={logoUrl} alt="" width={40} height={40} className="size-10 rounded-full object-cover" />
      )}
      <span className="flex flex-col leading-none">
        <span
          className={size === "lg" ? "text-5xl" : "text-[1.7rem]"}
          style={{ fontFamily: "var(--font-script), cursive", color: DINER.gold, transform: "rotate(-4deg)", display: "inline-block" }}
        >
          {name}
        </span>
        {sub && (
          <span className={`${size === "lg" ? "mt-1 text-base" : "-mt-0.5 text-[0.62rem]"} font-extrabold tracking-[0.08em]`} style={{ color: DINER.cream }}>
            {sub}
          </span>
        )}
      </span>
    </span>
  );
}

export function DinerButton({ href, children, className = "", shadow = DINER.brown, tone = "gold" }: { href: string; children: React.ReactNode; className?: string; shadow?: string; tone?: "gold" | "brown" }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-md px-7 py-3 text-base font-extrabold lowercase transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_var(--diner-shadow)] active:translate-x-1 active:translate-y-1 active:shadow-none ${className}`}
      style={{ background: tone === "gold" ? DINER.gold : DINER.brown, color: tone === "gold" ? DINER.brown : DINER.cream, boxShadow: "5px 5px 0 var(--diner-shadow)", ["--diner-shadow" as string]: shadow }}
    >
      {children}
    </Link>
  );
}

export function DinerNav({ initialCartId, logoUrl }: { initialCartId: string | null; logoUrl?: string }) {
  const pathname = usePathname();
  const { cartId, cartItems } = useNavCart(initialCartId);
  const c = SITE_CONFIG;

  return (
    <div style={{ background: DINER.brown, color: DINER.cream }}>
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-5 md:px-8">
        <Link href="/" aria-label={`${c.name} home`}>
          <DinerLockup logoUrl={logoUrl} />
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {c.navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`relative whitespace-nowrap text-sm font-bold lowercase transition-colors after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-[#FCB931] after:transition-transform hover:after:scale-x-100 ${l.href === pathname ? "text-[#FCB931]" : "text-[#F9F4ED]/85 hover:text-[#F9F4ED]"}`}
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
              style={{ background: DINER.gold, color: DINER.brown }}
            >
              <Instagram className="size-4.5" />
            </a>
          )}
          <span className="hidden md:inline-flex [&_button]:text-[#F9F4ED]">
            <ThemeToggle />
          </span>
          <span className="hidden md:block [&_button>div]:!border-[#F9F4ED]/30 [&_button>div]:!bg-transparent [&_button>div]:!text-[#F9F4ED]">
            <CartSideBar cartId={cartId} cartItems={cartItems} />
          </span>
          <span className="hidden md:block">
            <DinerButton href="/Menu" shadow={DINER.cream} className="!py-2.5 !text-[0.95rem]">
              {c.menuCtaLabel}
            </DinerButton>
          </span>
          <span className="md:hidden [&_button]:text-[#F9F4ED]">
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
