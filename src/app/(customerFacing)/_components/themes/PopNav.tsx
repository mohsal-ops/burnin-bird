"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { ThemeToggle } from "@/components/ThemeToggle";
import AccountButton from "@/components/AccountButton";
import AppSideBar from "../sideBar";
import CartSideBar from "../Cart-SideBar";
import { shouldShowCart, useNavCart } from "./useNavCart";

// Pop Bento navbar: a floating rounded pill that tucks in a little once you
// scroll, the active link sits in a brand-colour bubble, and a dark "Order"
// pill on the right.
export function PopNav({ initialCartId, logoUrl }: { initialCartId: string | null; logoUrl?: string }) {
  const pathname = usePathname();
  const { cartId, cartItems } = useNavCart(initialCartId);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const c = SITE_CONFIG;
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.toLowerCase().startsWith(href.toLowerCase()));

  return (
    <div className={`px-3 transition-[padding] duration-300 ${scrolled ? "pt-2" : "pt-3 md:pt-4"}`}>
      <div
        className={`mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full bg-background/90 pl-2 pr-2 text-foreground backdrop-blur transition-[height,box-shadow] duration-300 ${
          scrolled ? "h-14 shadow-[var(--pop-nav-shadow-scrolled)]" : "h-16 shadow-[var(--pop-nav-shadow)]"
        }`}
      >
        <Link href="/" className="flex min-w-0 items-center gap-2.5 pl-1">
          <Image
            src={logoUrl || "/logo.png"}
            alt={`${c.name} logo`}
            width={44}
            height={44}
            className={`shrink-0 rounded-full object-cover ${scrolled ? "h-9 w-9" : "h-11 w-11"} transition-all`}
          />
          <span className="hidden truncate font-display text-lg font-semibold tracking-tight sm:block">{c.name}</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {c.navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-full px-4 py-2 text-[15px] font-semibold transition-colors ${
                active(l.href) ? "bg-[var(--brand)] text-[var(--brand-foreground)]" : "hover:bg-foreground/5"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <span className="hidden md:inline-flex">
            <AccountButton />
          </span>
          <ThemeToggle />
          {shouldShowCart(pathname, cartItems.length) && (
            <span className="hidden md:block">
              <CartSideBar cartId={cartId} cartItems={cartItems} />
            </span>
          )}
          <Link
            href="/Menu"
            className="hidden items-center gap-2 rounded-full bg-foreground py-2.5 pl-5 pr-2 text-sm font-bold text-background md:inline-flex"
          >
            {c.menuCtaLabel || "Order now"}
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--brand)] text-[var(--brand-foreground)]">
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
          <span className="lg:hidden">
            <AppSideBar variant="pop-bento" />
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
