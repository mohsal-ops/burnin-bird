"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { ArrowRight, Download, Gamepad2, LayoutDashboard, TextAlignJustify, UserRound, X } from "lucide-react";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { useDashboardAccess } from "./DashboardBubble";
import { useAccountState } from "@/components/AccountButton";

// The phone menu. One component, four personalities - each theme gets its own
// look and motion (the content is the same everywhere):
//   classic-starvega → clean panel slides in from the right, links glide in
//   smash-bold       → brand-colour flood from the button, huge tilted caps
//   diner-classic    → a cream menu card drops from the top with a bounce
//   refined-elegant  → full screen in the navbar ink colour, numbered serif links, thin white rules
//   pop-bento        → colourful bento tiles that pop in with a little spin
// "Sign in" comes first when accounts are on; "Get the app" when the app is on.

export type MenuVariant = "classic-starvega" | "smash-bold" | "diner-classic" | "refined-elegant" | "pop-bento";

type Item = { href: string; label: string };

export default function AppSideBar({ variant = "classic-starvega" }: { variant?: MenuVariant }) {
  const dash = useDashboardAccess();
  const acct = useAccountState();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (variant !== "pop-bento") return;
    const t = setTimeout(loadNavPhotos, 1500); // after the page settles
    return () => clearTimeout(t);
  }, [variant]);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const [hasApp, setHasApp] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    // PwaBoot adds the manifest only when the owner has the app.
    setHasApp(!!document.querySelector('link[rel="manifest"]'));
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = () => {
    const r = btn.current?.getBoundingClientRect();
    if (r) setOrigin({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    setOpen((o) => !o);
  };

  const props: PanelProps = {
    links: SITE_CONFIG.navLinks,
    pathname,
    close: () => setOpen(false),
    signIn: acct?.enabled ? { href: "/account", label: acct.signedIn ? "Your account" : "Sign in" } : null,
    getApp: hasApp
      ? () => {
          setOpen(false);
          setTimeout(() => window.dispatchEvent(new Event("sv:install")), 250);
        }
      : null,
    dash: dash.available && dash.hidden ? dash.href : null,
    origin,
  };

  return (
    <>
      <button
        ref={btn}
        type="button"
        onClick={toggle}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="relative flex h-20 w-16 items-center justify-center"
      >
        <TextAlignJustify />
      </button>
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open &&
              (variant === "pop-bento" ? (
                <PopMenu key="m" {...props} />
              ) : variant === "smash-bold" ? (
                <SmashMenu key="m" {...props} />
              ) : variant === "diner-classic" ? (
                <DinerMenu key="m" {...props} />
              ) : variant === "refined-elegant" ? (
                <ElegantMenu key="m" {...props} />
              ) : (
                <ClassicMenu key="m" {...props} />
              ))}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}

type PanelProps = {
  links: Item[];
  pathname: string;
  close: () => void;
  signIn: Item | null;
  getApp: (() => void) | null;
  dash: string | null;
  origin: { x: number; y: number };
};

const isActive = (href: string, pathname: string) => (href === "/" ? pathname === "/" : pathname.toLowerCase().startsWith(href.toLowerCase()));
const Icon = ({ label }: { label: string }) => (label === "Kids Zone" ? <Gamepad2 strokeWidth={1.5} className="h-5 w-5" /> : null);

const list: Variants = { show: { transition: { staggerChildren: 0.06, delayChildren: 0.12 } } };

// ── Classic: clean panel from the right ──────────────────────────────────────
function ClassicMenu(p: PanelProps) {
  const item: Variants = { hidden: { opacity: 0, x: 40 }, show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 320, damping: 28 } } };
  return (
    <motion.div className="fixed inset-0 z-[70]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <button type="button" aria-label="Close menu" onClick={p.close} className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <motion.nav
        aria-label="Menu"
        className="absolute inset-y-0 right-0 flex w-[86vw] max-w-sm flex-col overflow-y-auto bg-background px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-6 text-foreground shadow-2xl"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
      >
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold">{SITE_CONFIG.name}</span>
          <button type="button" onClick={p.close} aria-label="Close menu" className="grid h-10 w-10 place-items-center rounded-full bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>
        <motion.ul className="mt-6 flex flex-col gap-1" variants={list} initial="hidden" animate="show">
          {p.signIn && (
            <motion.li variants={item}>
              <Link href={p.signIn.href} className="mb-2 flex items-center gap-3 rounded-2xl border-2 border-[var(--brand)] px-4 py-3.5 font-semibold">
                <UserRound className="h-5 w-5 text-[var(--brand)]" /> {p.signIn.label}
              </Link>
            </motion.li>
          )}
          {p.links.map((l) => (
            <motion.li key={l.href} variants={item}>
              <Link
                href={l.href}
                className={`flex items-center gap-2 rounded-2xl px-4 py-3.5 text-[17px] font-medium transition-colors ${
                  isActive(l.href, p.pathname) ? "bg-[var(--brand)] text-[var(--brand-foreground)]" : "text-foreground/80 hover:bg-muted"
                }`}
              >
                <Icon label={l.label} /> {l.label}
              </Link>
            </motion.li>
          ))}
          {p.dash && (
            <motion.li variants={item}>
              <a href={p.dash} className="mt-2 flex items-center gap-2 rounded-2xl bg-muted px-4 py-3.5 font-medium">
                <LayoutDashboard className="h-4 w-4" /> Your dashboard
              </a>
            </motion.li>
          )}
        </motion.ul>
        <BottomButtons p={p} order="rounded-2xl bg-[var(--brand)] text-[var(--brand-foreground)]" app="rounded-2xl border border-border" />
      </motion.nav>
    </motion.div>
  );
}

// ── Smash & Bold: brand flood from the button, huge tilted caps ──────────────
function SmashMenu(p: PanelProps) {
  const r = `${p.origin.x}px ${p.origin.y}px`;
  const item: Variants = {
    hidden: { opacity: 0, y: 60, rotate: -6 },
    show: { opacity: 1, y: 0, rotate: -3, transition: { type: "spring", stiffness: 260, damping: 18 } },
  };
  return (
    <motion.nav
      aria-label="Menu"
      className="fixed inset-0 z-[70] flex flex-col overflow-y-auto bg-[var(--brand)] px-6 pb-[calc(20px+env(safe-area-inset-bottom))] pt-6 text-[var(--brand-foreground)]"
      initial={{ clipPath: `circle(0px at ${r})` }}
      animate={{ clipPath: `circle(150% at ${r})` }}
      exit={{ clipPath: `circle(0px at ${r})` }}
      transition={{ duration: 0.55, ease: [0.7, 0, 0.2, 1] }}
    >
      <div className="flex items-center justify-between">
        <span className="font-display text-xl font-black uppercase tracking-tight">{SITE_CONFIG.name}</span>
        <button type="button" onClick={p.close} aria-label="Close menu" className="grid h-11 w-11 place-items-center rounded-full bg-black text-white">
          <X className="h-5 w-5" />
        </button>
      </div>
      <motion.ul className="mt-8 flex flex-col gap-3" variants={list} initial="hidden" animate="show">
        {p.signIn && (
          <motion.li variants={item} className="origin-left">
            <Link href={p.signIn.href} className="inline-flex items-center gap-3 rounded-full bg-black px-5 py-3 text-base font-black uppercase text-white">
              <UserRound className="h-5 w-5" /> {p.signIn.label}
            </Link>
          </motion.li>
        )}
        {p.links.map((l) => (
          <motion.li key={l.href} variants={item} className="origin-left">
            <Link
              href={l.href}
              className={`inline-block font-display text-[44px] font-black uppercase leading-[0.95] tracking-tight ${
                isActive(l.href, p.pathname) ? "underline decoration-black decoration-[6px] underline-offset-[6px]" : ""
              }`}
            >
              {l.label}
            </Link>
          </motion.li>
        ))}
        {p.dash && (
          <motion.li variants={item}>
            <a href={p.dash} className="inline-flex items-center gap-2 text-base font-bold uppercase">
              <LayoutDashboard className="h-4 w-4" /> Your dashboard
            </a>
          </motion.li>
        )}
      </motion.ul>
      <BottomButtons p={p} order="rounded-full bg-black text-white uppercase font-black" app="rounded-full border-2 border-black uppercase font-black" />
    </motion.nav>
  );
}

// ── Diner: a cream menu card drops from the top ──────────────────────────────
function DinerMenu(p: PanelProps) {
  const item: Variants = {
    hidden: { opacity: 0, y: -18, scale: 0.96 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 420, damping: 20 } },
  };
  return (
    <motion.div className="fixed inset-0 z-[70]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <button type="button" aria-label="Close menu" onClick={p.close} className="absolute inset-0 bg-[#3b2416]/60" />
      <motion.nav
        aria-label="Menu"
        className="absolute inset-x-3 top-3 flex max-h-[calc(100dvh-24px)] flex-col overflow-y-auto rounded-[28px] bg-[#fff4e2] pb-5 text-[#3b2416] shadow-2xl"
        initial={{ y: "-110%", rotate: -2 }}
        animate={{ y: 0, rotate: 0 }}
        exit={{ y: "-110%", rotate: 2 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <div
          aria-hidden
          className="h-4 w-full shrink-0 rounded-t-[28px]"
          style={{ background: "repeating-linear-gradient(90deg, var(--brand) 0 16px, #fff4e2 16px 32px)" }}
        />
        <div className="flex items-center justify-between px-5 pt-4">
          <span className="font-display text-2xl font-extrabold lowercase">{SITE_CONFIG.name}</span>
          <button type="button" onClick={p.close} aria-label="Close menu" className="grid h-10 w-10 place-items-center rounded-full bg-[#3b2416] text-[#fff4e2]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <motion.ul className="mt-4 flex flex-col gap-2.5 px-5" variants={list} initial="hidden" animate="show">
          {p.signIn && (
            <motion.li variants={item}>
              <Link
                href={p.signIn.href}
                className="flex items-center gap-3 rounded-xl border-2 border-[#3b2416] bg-white px-4 py-3 font-extrabold lowercase shadow-[4px_4px_0_#3b2416]"
              >
                <UserRound className="h-5 w-5" /> {p.signIn.label}
              </Link>
            </motion.li>
          )}
          {p.links.map((l) => (
            <motion.li key={l.href} variants={item}>
              <Link
                href={l.href}
                className={`flex items-center justify-between rounded-xl px-4 py-3 text-xl font-extrabold lowercase ${
                  isActive(l.href, p.pathname) ? "bg-[var(--brand)] text-[var(--brand-foreground)] shadow-[4px_4px_0_#3b2416]" : "hover:bg-[#3b2416]/5"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Icon label={l.label} /> {l.label}
                </span>
                <span aria-hidden className="text-[#3b2416]/30">•</span>
              </Link>
            </motion.li>
          ))}
          {p.dash && (
            <motion.li variants={item}>
              <a href={p.dash} className="flex items-center gap-2 px-4 py-2 font-bold lowercase">
                <LayoutDashboard className="h-4 w-4" /> your dashboard
              </a>
            </motion.li>
          )}
        </motion.ul>
        <div className="px-5">
          <BottomButtons
            p={p}
            order="rounded-xl bg-[var(--brand)] text-[var(--brand-foreground)] font-extrabold lowercase shadow-[4px_4px_0_#3b2416]"
            app="rounded-xl border-2 border-[#3b2416] bg-white font-extrabold lowercase"
          />
        </div>
      </motion.nav>
    </motion.div>
  );
}

// ── Refined: navbar ink full screen, numbered serif links, thin rules ──────────────
function ElegantMenu(p: PanelProps) {
  const item: Variants = {
    hidden: { opacity: 0, letterSpacing: "0.35em", y: 10 },
    show: { opacity: 1, letterSpacing: "0.02em", y: 0, transition: { duration: 0.7, ease: [0.2, 0.7, 0.2, 1] } },
  };
  const rule: Variants = { hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 0.8, ease: [0.2, 0.7, 0.2, 1] } } };
  return (
    <motion.nav
      aria-label="Menu"
      className="fixed inset-0 z-[70] flex flex-col overflow-y-auto bg-[var(--tp-ink,#0f0d0b)] px-7 pb-[calc(24px+env(safe-area-inset-bottom))] pt-6 text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold uppercase tracking-[0.22em]" style={{ fontFamily: "var(--font-jost), sans-serif" }}>{SITE_CONFIG.trademark || SITE_CONFIG.name}</span>
        <button type="button" onClick={p.close} aria-label="Close menu" className="grid h-10 w-10 place-items-center rounded-full border border-white/30 text-white">
          <X className="h-5 w-5" />
        </button>
      </div>
      <motion.ul className="mt-10 flex flex-col gap-5" variants={{ show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } } }} initial="hidden" animate="show">
        {p.signIn && (
          <motion.li variants={item}>
            <Link href={p.signIn.href} className="inline-flex items-center gap-2 border-b border-white/40 pb-1 text-sm uppercase tracking-[0.2em] text-white/80">
              <UserRound className="h-4 w-4" /> {p.signIn.label}
            </Link>
          </motion.li>
        )}
        {p.links.map((l, i) => (
          <motion.li key={l.href} variants={{ hidden: {}, show: {} }}>
            <Link href={l.href} className="group block">
              <span className="flex items-baseline gap-4">
                <span className="w-6 text-xs text-white/40">{String(i + 1).padStart(2, "0")}</span>
                <motion.span variants={item} className={`font-display text-[34px] font-light leading-none ${isActive(l.href, p.pathname) ? "italic text-white" : ""}`}>
                  {l.label}
                </motion.span>
              </span>
              <motion.span variants={rule} className="mt-4 block h-px origin-left bg-gradient-to-r from-white/35 to-transparent" />
            </Link>
          </motion.li>
        ))}
        {p.dash && (
          <motion.li variants={item}>
            <a href={p.dash} className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-white/70">
              <LayoutDashboard className="h-4 w-4" /> Your dashboard
            </a>
          </motion.li>
        )}
      </motion.ul>
      <BottomButtons p={p} order="bg-white text-[var(--tp-ink,#0f0d0b)] uppercase tracking-[0.2em] text-sm" app="border border-white/30 text-white uppercase tracking-[0.2em] text-sm" />
    </motion.nav>
  );
}

// ── Pop Bento: colourful tiles that pop in ──────────────────────────────────
// Photos for the picture tiles - fetched once per page load, shared by every
// open of the menu. Comes from the site's own dishes + gallery (no uploads).
type NavPhotos = { menu: string[]; story: string[] };
let navPhotosOnce: Promise<NavPhotos> | null = null;
// Fetch the list + warm the browser cache so tiles are ready the moment the menu opens.
function loadNavPhotos() {
  navPhotosOnce ??= fetch("/api/nav-photos")
    .then((r) => r.json() as Promise<NavPhotos>)
    .then((p) => {
      [...p.menu, ...p.story].forEach((src) => {
        const img = new window.Image();
        img.src = src;
      });
      return p;
    })
    .catch(() => ({ menu: [], story: [] }));
  return navPhotosOnce;
}
function useNavPhotos() {
  const [photos, setPhotos] = useState<NavPhotos | null>(null);
  useEffect(() => {
    loadNavPhotos();
    let live = true;
    navPhotosOnce!.then((p) => live && setPhotos(p));
    return () => {
      live = false;
    };
  }, []);
  return photos;
}
function photosFor(href: string, photos: NavPhotos | null) {
  if (!photos) return [];
  const h = href.toLowerCase();
  if (h.startsWith("/menu")) return photos.menu;
  if (/story|about/.test(h)) return photos.story;
  return [];
}

// A slow zoom on each photo, cross-fading to the next every 3s.
function PhotoLoop({ srcs }: { srcs: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (srcs.length < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % srcs.length), 3000);
    return () => clearInterval(t);
  }, [srcs.length]);
  return (
    <span aria-hidden className="absolute inset-0 overflow-hidden rounded-[inherit]">
      <AnimatePresence initial={false}>
        <motion.img
          key={i}
          src={srcs[i]}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: 1, scale: 1.14 }}
          exit={{ opacity: 0 }}
          transition={{ opacity: { duration: 0.8 }, scale: { duration: 4, ease: "linear" } }}
        />
      </AnimatePresence>
      <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
    </span>
  );
}

function PopMenu(p: PanelProps) {
  const photos = useNavPhotos();
  const tile: Variants = {
    hidden: { opacity: 0, scale: 0.6, rotate: -8 },
    show: { opacity: 1, scale: 1, rotate: 0, transition: { type: "spring", stiffness: 380, damping: 18 } },
  };
  const tones = [
    "bg-[var(--brand)] text-[var(--brand-foreground)]",
    "bg-[var(--pop-soft)] text-[var(--pop-fg)] ring-1 ring-inset ring-[color:var(--pop-ring)]",
    "bg-[var(--pop-card)] text-[var(--pop-fg)] ring-2 ring-inset ring-[color:var(--pop-outline)]",
    "bg-[var(--pop-ink)] text-[var(--pop-on-ink)]",
  ];
  return (
    <motion.nav
      aria-label="Menu"
      className="fixed inset-0 z-[70] flex flex-col overflow-y-auto bg-[var(--pop-paper)] px-4 pb-[calc(20px+env(safe-area-inset-bottom))] pt-5 text-[var(--pop-fg)]"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
    >
      <div className="flex items-center justify-between px-1">
        <span className="font-display text-2xl font-semibold tracking-tight">{SITE_CONFIG.name}</span>
        <button type="button" onClick={p.close} aria-label="Close menu" className="grid h-11 w-11 place-items-center rounded-full bg-[var(--pop-ink)] text-[var(--pop-on-ink)]">
          <X className="h-5 w-5" />
        </button>
      </div>
      <motion.ul className="mt-5 grid grid-cols-2 gap-2.5" variants={{ show: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } } }} initial="hidden" animate="show">
        {p.signIn && (
          <motion.li variants={tile} className="col-span-2">
            <Link href={p.signIn.href} className="flex h-16 items-center gap-3 rounded-[24px] bg-[var(--pop-ink)] px-5 text-lg font-bold text-[var(--pop-on-ink)]">
              <UserRound className="h-5 w-5" /> {p.signIn.label}
            </Link>
          </motion.li>
        )}
        {p.links.map((l, i) => {
          const pics = photosFor(l.href, photos);
          return (
          <motion.li key={l.href} variants={tile} className={i === 0 && p.links.length % 2 === 1 ? "col-span-2" : ""}>
            <Link
              href={l.href}
              className={`relative flex h-28 flex-col justify-end overflow-hidden rounded-[28px] p-4 font-display text-2xl font-semibold leading-none tracking-tight active:scale-95 ${
                pics.length ? "bg-[#15110e] text-white ring-1 ring-inset ring-[color:var(--pop-ring)]" : tones[i % tones.length]
              }`}
            >
              {pics.length > 0 && <PhotoLoop srcs={pics} />}
              {isActive(l.href, p.pathname) && <span className="absolute right-4 top-4 z-10 h-3 w-3 rounded-full bg-current" />}
              <span className="relative z-10 flex items-center gap-2">
                <Icon label={l.label} /> {l.label}
              </span>
            </Link>
          </motion.li>
          );
        })}
        {p.dash && (
          <motion.li variants={tile} className="col-span-2">
            <a href={p.dash} className="flex h-14 items-center gap-2 rounded-[22px] bg-[var(--pop-card)] px-5 font-bold ring-1 ring-inset ring-[color:var(--pop-fg)]/15">
              <LayoutDashboard className="h-4 w-4" /> Your dashboard
            </a>
          </motion.li>
        )}
      </motion.ul>
      <BottomButtons p={p} order="rounded-full bg-[var(--brand)] text-[var(--brand-foreground)] font-bold" app="rounded-full bg-[var(--pop-card)] text-[var(--pop-fg)] font-bold ring-2 ring-inset ring-[color:var(--pop-outline)]" />
    </motion.nav>
  );
}

function BottomButtons({ p, order, app }: { p: PanelProps; order: string; app: string }) {
  return (
    <motion.div
      className="mt-auto flex flex-col gap-2.5 pt-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, type: "spring", stiffness: 260, damping: 26 }}
    >
      {p.getApp && (
        <button type="button" onClick={p.getApp} className={`flex h-12 items-center justify-center gap-2 font-semibold ${app}`}>
          <Download className="h-4 w-4" /> Get the app
        </button>
      )}
      <Link href="/Menu" className={`flex h-12 items-center justify-center gap-2 font-semibold ${order}`}>
        {SITE_CONFIG.menuCtaLabel || "Order now"} <ArrowRight className="h-4 w-4" />
      </Link>
    </motion.div>
  );
}
