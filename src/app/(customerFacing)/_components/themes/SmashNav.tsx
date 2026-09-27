"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { ThemeToggle } from "@/components/ThemeToggle";
import AppSideBar from "../sideBar";
import CartSideBar from "../Cart-SideBar";
import { useNavCart } from "./useNavCart";

// Bespoke navbar for smash-bold — modeled on Ender's: a wide-tracked wordmark on
// the left, centered uppercase links, and a dark pill CTA on the right. Reuses
// the same cart plumbing as the default TopNavBar.

export function SmashNav({ initialCartId }: { initialCartId: string | null; logoUrl?: string }) {
  const pathname = usePathname();
  const { cartId, cartItems } = useNavCart(initialCartId);
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
                className={`group relative whitespace-nowrap text-sm font-semibold uppercase tracking-wide transition-colors ${active ? "text-foreground" : "text-foreground/55 hover:text-foreground"}`}
              >
                {l.label}
                <span className={`absolute -bottom-1.5 left-0 h-[3px] rounded-full bg-brand transition-all duration-300 ${active ? "w-full" : "w-0 group-hover:w-full"}`} />
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
