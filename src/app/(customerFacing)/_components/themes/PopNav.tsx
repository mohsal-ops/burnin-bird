"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { ThemeToggle } from "@/components/ThemeToggle";
import AccountButton from "@/components/AccountButton";
import AppSideBar from "../sideBar";
import CartSideBar from "../Cart-SideBar";
import { shouldShowCart, useNavCart } from "./useNavCart";

// Pop Bento navbar: a floating rounded pill that tucks in a little once you
// scroll, the active link sits in a brand-colour bubble, and a dark "Order"
// pill on the right. Only the first few links sit in the bar (3 on lg, 4 on
// xl) - the rest live in a "More" dropdown so a long restaurant name never
// squeezes the links onto two lines.
const EMOJI: Record<string, string> = {
  "/": "🏠",
  "/menu": "🍽️",
  "/catering": "🎉",
  "/giftcard": "🎁",
  "/rewards": "⭐",
  "/kidszone": "🎈",
  "/blog": "📰",
  "/story": "📖",
};

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

  // index 0-2 always in the bar, index 3 only on xl, the rest only in "More"
  const links = c.navLinks;
  const extra = links.slice(3);

  return (
    <div className={`px-3 transition-[padding] duration-300 ${scrolled ? "pt-2" : "pt-3 md:pt-4"}`}>
      <div
        className={`mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full bg-background/90 pl-2 pr-2 text-foreground backdrop-blur transition-[height,box-shadow] duration-300 ${
          scrolled ? "h-14 shadow-[var(--pop-nav-shadow-scrolled)]" : "h-16 shadow-[var(--pop-nav-shadow)]"
        }`}
      >
        <Link href="/" className="flex min-w-0 shrink items-center gap-2.5 pl-1">
          <Image
            src={logoUrl || "/logo.png"}
            alt={`${c.name} logo`}
            width={44}
            height={44}
            className={`shrink-0 rounded-full object-cover ${scrolled ? "h-9 w-9" : "h-11 w-11"} transition-all`}
          />
          <span className="hidden max-w-[11rem] truncate font-display text-lg font-semibold tracking-tight sm:block lg:max-w-[13rem] xl:max-w-[15rem]">
            {c.name}
          </span>
        </Link>

        <nav className="hidden shrink-0 items-center gap-1 lg:flex">
          {links.map((l, i) =>
            i > 3 ? null : (
              <Link
                key={l.href}
                href={l.href}
                className={`${i === 3 ? "hidden xl:inline-flex" : "inline-flex"} whitespace-nowrap rounded-full px-4 py-2 text-[15px] font-semibold transition-colors ${
                  active(l.href) ? "bg-[var(--brand)] text-[var(--brand-foreground)]" : "hover:bg-foreground/5"
                }`}
              >
                {l.label}
              </Link>
            ),
          )}
          {extra.length > 0 && <MoreMenu items={extra} active={active} onlyBelowXl={extra.length === 1} />}
        </nav>

        <div className="flex shrink-0 items-center gap-1">
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
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-foreground py-1.5 pl-4 pr-1.5 text-sm font-bold text-background transition-transform active:scale-95 md:gap-2 md:py-2.5 md:pl-5 md:pr-2"
          >
            <span className="md:hidden">Order</span>
            <span className="hidden md:inline">{c.menuCtaLabel || "Order now"}</span>
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

// "More ▾" bubble. Turns brand-colour (and shows the page name) when the page
// you're on lives inside it. Link #3 is in here only below xl.
function MoreMenu({
  items,
  active,
  onlyBelowXl,
}: {
  items: { href: string; label: string }[];
  active: (href: string) => boolean;
  onlyBelowXl?: boolean; // its only item fits in the bar on xl
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  const current = items.find((l) => active(l.href));
  // the xl-visible link (items[0]) shouldn't light up "More" on xl
  const currentIsXl = current === items[0];

  return (
    <div
      ref={ref}
      className={`relative ${onlyBelowXl ? "xl:hidden" : ""}`}
      onMouseEnter={() => window.matchMedia("(hover: hover)").matches && setOpen(true)}
      onMouseLeave={() => window.matchMedia("(hover: hover)").matches && setOpen(false)}
    >
      <button
        type="button"
        // mouse users already opened it on hover - a click mustn't shut it again
        onClick={() => setOpen((o) => (window.matchMedia("(hover: hover)").matches ? true : !o))}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full py-2 pl-4 pr-3 text-[15px] font-semibold transition-colors ${
          current
            ? `bg-[var(--brand)] text-[var(--brand-foreground)] ${currentIsXl ? "xl:bg-transparent xl:text-foreground xl:hover:bg-foreground/5" : ""}`
            : open
              ? "bg-foreground/5"
              : "hover:bg-foreground/5"
        }`}
      >
        {current ? (
          <>
            <span className={currentIsXl ? "xl:hidden" : ""}>{current.label}</span>
            {currentIsXl && <span className="hidden xl:inline">More</span>}
          </>
        ) : (
          "More"
        )}
        <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          // pt-3 bridges the gap so hover doesn't drop between button and card
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 520, damping: 32 }}
            className="absolute right-0 top-full z-50 origin-top-right pt-3"
          >
            <div className="w-64 overflow-hidden rounded-[1.75rem] bg-[var(--pop-card)] p-2 text-[var(--pop-fg)] shadow-[0_24px_60px_rgba(0,0,0,0.18)] ring-1 ring-black/5 dark:ring-white/10">
              {items.map((l, i) => {
                const on = active(l.href);
                return (
                  <motion.div
                    key={l.href}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.03 * i }}
                    className={i === 0 ? "xl:hidden" : ""}
                  >
                    <Link
                      href={l.href}
                      role="menuitem"
                      className={`group flex items-center gap-3 rounded-2xl px-2.5 py-2 text-[15px] font-semibold transition-colors ${
                        on ? "bg-[var(--brand)] text-[var(--brand-foreground)]" : "hover:bg-[var(--pop-soft)]"
                      }`}
                    >
                      <span
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-lg transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 ${
                          on ? "bg-black/10" : "bg-[var(--pop-soft)] group-hover:bg-[var(--pop-card)]"
                        }`}
                      >
                        {EMOJI[l.href.toLowerCase()] ?? "✨"}
                      </span>
                      <span className="flex-1">{l.label}</span>
                      <ArrowRight
                        className={`h-4 w-4 transition-all duration-300 ${on ? "opacity-100" : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"}`}
                      />
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
