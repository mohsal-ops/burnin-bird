"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE_CONFIG } from "@/lib/siteConfig";
import AppSideBar from "../sideBar";
import CartSideBar from "../Cart-SideBar";
import { useNavCart } from "./useNavCart";

// Bespoke navbar for refined-elegant — modeled on Fiorella: a wide-tracked
// wordmark on the left and small bold uppercase links on the right, floating
// TRANSPARENT over the full-bleed homepage photo, then settling into solid
// near-black once you scroll (and on every other page, which has no hero).

export function ElegantNav({ initialCartId }: { initialCartId: string | null }) {
  const pathname = usePathname();
  const { cartId, cartItems } = useNavCart(initialCartId);
  const [scrolled, setScrolled] = useState(false);
  const overHero = pathname === "/" && !scrolled;

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const c = SITE_CONFIG;
  const wordmark = (c.trademark || c.name).toUpperCase();

  return (
    <div
      className={`text-white transition-[background-color,backdrop-filter,box-shadow] duration-500 ${overHero ? "bg-transparent" : "bg-[#0F0606]/95 shadow-[0_1px_0_rgba(255,255,255,0.06)] backdrop-blur"}`}
    >
      <div className="mx-auto flex h-20 items-center justify-between gap-6 px-6 md:px-10">
        <Link href="/" className="whitespace-nowrap text-lg font-semibold tracking-[0.22em] md:text-xl" style={{ fontFamily: "var(--font-jost), sans-serif" }}>
          {wordmark}
        </Link>
        <nav className="hidden items-center gap-5 lg:flex xl:gap-7">
          {c.navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`group relative whitespace-nowrap text-[0.8rem] font-semibold uppercase tracking-[0.08em] ${l.href === pathname ? "text-[#FFD469]" : "text-white/90 hover:text-white"}`}
            >
              {l.label}
              <span className="absolute -bottom-1.5 left-1/2 h-px w-0 -translate-x-1/2 bg-current transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
          <span className="[&_button>div]:!border-white/30 [&_button>div]:!bg-transparent [&_button>div]:!text-white">
            <CartSideBar cartId={cartId} cartItems={cartItems} />
          </span>
        </nav>
        <div className="lg:hidden [&_button]:text-white">
          <AppSideBar />
        </div>
      </div>
      {cartItems.length > 0 && (
        <div className="fixed bottom-16 left-2 right-2 z-50 flex justify-center lg:hidden">
          <CartSideBar cartId={cartId} cartItems={cartItems} />
        </div>
      )}
    </div>
  );
}
