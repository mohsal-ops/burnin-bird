"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { CartItem } from "generated/prisma";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { ThemeToggle } from "@/components/ThemeToggle";
import AppSideBar from "../sideBar";
import CartSideBar from "../Cart-SideBar";

// Bespoke navbar for smash-bold — modeled on Ender's: a wide-tracked wordmark on
// the left, centered uppercase links, and a dark pill CTA on the right. Reuses
// the same cart plumbing as the default TopNavBar.

const fetcher = async (url: string, cartId: string | null) => {
  const res = await fetch(url, { headers: { "Content-Type": "application/json", "x-cart-id": cartId ?? "" } });
  return res.json();
};

export function SmashNav({ initialCartId, logoUrl }: { initialCartId: string | null; logoUrl?: string }) {
  const pathname = usePathname();
  const [cartId, setCartId] = useState<string | null>(initialCartId);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/getcartId");
      const data = await res.json().catch(() => ({}));
      if (data?.cartId) setCartId(data.cartId);
    })();
  }, []);

  const { data } = useSWR(cartId ? ["/api/cart/get", cartId] : null, ([url, id]) => fetcher(url, id), { revalidateOnFocus: false });
  const cartItems = (data?.cart?.items ?? []) as CartItem[];
  const links = SITE_CONFIG.navLinks;
  const wordmark = (SITE_CONFIG.trademark || SITE_CONFIG.name || "").toUpperCase();

  return (
    <div className="border-b border-foreground/10 bg-background">
      {/* Mobile */}
      <div className="flex h-20 items-center justify-between px-5 md:hidden">
        <Link href="/" className="text-xl font-extrabold uppercase tracking-[0.25em] text-foreground">{wordmark}</Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <AppSideBar />
        </div>
        {cartItems.length > 0 && (
          <div className="fixed bottom-1 left-2 right-2 z-50 flex justify-center">
            <CartSideBar cartId={cartId} cartItems={cartItems} />
          </div>
        )}
      </div>

      {/* Desktop: wordmark · centered links · dark pill */}
      <div className="mx-auto hidden h-20 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-6 px-6 md:grid">
        <Link href="/" className="justify-self-start whitespace-nowrap text-xl font-extrabold uppercase tracking-[0.25em] text-foreground lg:text-2xl">
          {wordmark}
        </Link>
        <nav className="flex items-center justify-center gap-5 lg:gap-8">
          {links.map((l) => {
            const active = l.href === pathname;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`whitespace-nowrap text-sm font-semibold uppercase tracking-wide transition-colors ${active ? "text-primary" : "text-foreground/70 hover:text-foreground"}`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center justify-end gap-3">
          <ThemeToggle />
          <CartSideBar cartId={cartId} cartItems={cartItems} />
          <Link
            href="/Menu"
            className="cta-primary rounded-full bg-foreground px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-background transition-transform hover:scale-105"
          >
            {SITE_CONFIG.menuCtaLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
