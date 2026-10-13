"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Home, UtensilsCrossed, ShoppingBag, Gift, LayoutGrid, ChevronLeft, ChevronRight, Phone, MapPin } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ThemeToggle";
import AccountButton from "@/components/AccountButton";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { useNavCart } from "@/app/(customerFacing)/_components/themes/useNavCart";
import AppHome from "./AppHome";

// App-mode chrome (see AppModeBoot). Renders nothing unless <html> has
// `sv-app`, i.e. the site was opened from the home-screen icon.

export const OPEN_CART_EVENT = "sv:open-cart";

const tap = () => {
  try {
    navigator.vibrate?.(8);
  } catch {
    /* no haptics */
  }
};

export default function AppShell({ logoUrl }: { logoUrl?: string | null }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!document.documentElement.classList.contains("sv-app")) return;
    setOn(true);
    // Fade the launch screen out once the app is interactive.
    const s = document.getElementById("sv-splash");
    if (s) {
      const t = setTimeout(() => {
        s.classList.add("sv-splash-out");
        setTimeout(() => s.remove(), 450);
      }, 650);
      return () => clearTimeout(t);
    }
  }, []);
  if (!on) return null;
  return <Chrome logoUrl={logoUrl} />;
}

function Chrome({ logoUrl }: { logoUrl?: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const { cartItems } = useNavCart(null);
  const [more, setMore] = useState(false);
  const count = cartItems.filter((i) => i.name != null && i.price).reduce((n, i) => n + (i.quantity ?? 1), 0);

  const links = SITE_CONFIG.navLinks;
  const hasRewards = links.some((l) => l.href === "/rewards");
  const tabs = [
    { key: "home", label: "Home", href: "/", icon: Home },
    { key: "menu", label: "Menu", href: "/Menu", icon: UtensilsCrossed },
    { key: "cart", label: "Cart", href: null, icon: ShoppingBag },
    ...(hasRewards ? [{ key: "rewards", label: "Rewards", href: "/rewards", icon: Gift }] : []),
    { key: "more", label: "More", href: null, icon: LayoutGrid },
  ];
  const lower = pathname.toLowerCase();
  const activeKey = more
    ? "more"
    : lower === "/"
      ? "home"
      : lower.startsWith("/menu")
        ? "menu"
        : lower.startsWith("/rewards")
          ? "rewards"
          : "more";
  const isTopLevel = ["/", "/menu", "/rewards"].includes(lower);
  // Home gets its own app screen (AppHome) instead of the website homepage.
  const isHome = lower === "/";
  useEffect(() => {
    document.documentElement.classList.toggle("sv-app-home", isHome);
    if (isHome) window.scrollTo(0, 0);
  }, [isHome]);
  const extra = links.filter((l) => !["/", "/Menu", "/rewards"].includes(l.href));
  const title = isTopLevel ? SITE_CONFIG.name : (links.find((l) => lower.startsWith(l.href.toLowerCase()) && l.href !== "/")?.label ?? SITE_CONFIG.name);

  const openCart = () => {
    // Handled by the navbar's cart sheet; if nothing is in the cart, go order.
    const ev = new CustomEvent(OPEN_CART_EVENT, { cancelable: true });
    window.dispatchEvent(ev);
    if (!ev.defaultPrevented) router.push("/Menu");
  };

  return (
    <>
      {isHome && <AppHome />}
      <header className="sv-app-top">
        <div className="sv-app-top-inner">
          {isTopLevel ? (
            <Link href="/" className="flex items-center gap-2.5 min-w-0" onClick={tap}>
              {logoUrl ? (
                <Image src={logoUrl} alt="" width={34} height={34} className="h-[34px] w-[34px] rounded-full object-cover shrink-0" />
              ) : null}
              <span className="truncate font-semibold text-[17px]">{title}</span>
            </Link>
          ) : (
            <button
              onClick={() => {
                tap();
                if (history.length > 1) router.back();
                else router.push("/");
              }}
              className="flex items-center gap-1 min-w-0 -ml-1.5"
              aria-label="Back"
            >
              <ChevronLeft size={26} strokeWidth={2.2} className="shrink-0 text-[var(--brand)]" />
              <span className="truncate font-semibold text-[17px]">{title}</span>
            </button>
          )}
          <div className="flex items-center gap-1">
            <AccountButton />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <nav className="sv-app-tabs" aria-label="App navigation">
        {tabs.map((t) => {
          const active = activeKey === t.key;
          const Icon = t.icon;
          const inner = (
            <>
              {active && (
                <motion.span
                  layoutId="sv-tab-pill"
                  className="sv-tab-pill"
                  transition={{ type: "spring", stiffness: 520, damping: 38 }}
                />
              )}
              <motion.span
                className="relative"
                animate={active ? { y: -1, scale: 1.08 } : { y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <Icon size={22} strokeWidth={active ? 2.3 : 1.8} />
                {t.key === "cart" && (
                  <AnimatePresence>
                    {count > 0 && (
                      <motion.span
                        key={count}
                        initial={{ scale: 0.4, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.4, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 600, damping: 22 }}
                        className="sv-tab-badge"
                      >
                        {count > 9 ? "9+" : count}
                      </motion.span>
                    )}
                  </AnimatePresence>
                )}
              </motion.span>
              <span className="relative text-[10.5px] font-medium leading-none mt-1">{t.label}</span>
            </>
          );
          const cls = `sv-tab ${active ? "sv-tab-active" : ""}`;
          if (t.href)
            return (
              <Link key={t.key} href={t.href} className={cls} onClick={tap} aria-current={active ? "page" : undefined}>
                {inner}
              </Link>
            );
          return (
            <button
              key={t.key}
              className={cls}
              onClick={() => {
                tap();
                if (t.key === "cart") openCart();
                else setMore(true);
              }}
            >
              {inner}
            </button>
          );
        })}
      </nav>

      <Sheet open={more} onOpenChange={setMore}>
        <SheetContent side="bottom" className="sv-app-sheet rounded-t-3xl border-0 px-4 pb-[calc(20px+env(safe-area-inset-bottom))]">
          <SheetHeader className="pb-1">
            <SheetTitle className="text-left">{SITE_CONFIG.name}</SheetTitle>
          </SheetHeader>
          <div className="rounded-2xl bg-muted/60 overflow-hidden divide-y divide-border">
            {extra.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => {
                  tap();
                  setMore(false);
                }}
                className="flex items-center justify-between px-4 py-3.5 active:bg-muted"
              >
                <span className="font-medium">{l.label}</span>
                <ChevronRight size={18} className="text-muted-foreground" />
              </Link>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {SITE_CONFIG.phone ? (
              <a href={`tel:${SITE_CONFIG.phone}`} className="sv-app-action" onClick={tap}>
                <Phone size={18} /> Call
              </a>
            ) : null}
            {SITE_CONFIG.address ? (
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(SITE_CONFIG.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="sv-app-action"
                onClick={tap}
              >
                <MapPin size={18} /> Directions
              </a>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
