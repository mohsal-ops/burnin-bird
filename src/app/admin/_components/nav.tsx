"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Tag,
  ShoppingBag,
  BookOpen,
  MapPin,
  Newspaper,
  ChartArea,
  ShieldCheck,
  UserCircle,
  Images,
  Star,
  Menu,
  X,
  Clock,
  Mail,
  Image as ImageIcon,
  Globe,
  Palette,
  ExternalLink,
  FileText,
  type LucideIcon,
} from "lucide-react";
import { SITE_CONFIG } from "@/lib/siteConfig";

// ── "New" badges in the sidebar ───────────────────────────────────────────
// Shows a small "New" pill next to recently-added tabs so the owner notices
// them. TO REMOVE ALL BADGES: set SHOW_NEW_BADGES to false.
// TO CHANGE WHICH TABS are flagged: edit the NEW_TAB_HREFS list.
const SHOW_NEW_BADGES = false;
const NEW_TAB_HREFS = new Set([
  "/admin/catering",
  "/admin/hours",
  "/admin/story",
  "/admin/media",
  "/admin/reviews",
  "/admin/branding",
  "/admin/team",
  "/admin/profile",
]);

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badgeKey?: "catering";
};

type NavGroup = { label: string; items: NavItem[] };

// Grouped the way an owner actually thinks about the business: the daily
// overview first, then day-to-day operations, then the menu, then the public
// website content, and finally the rarely-touched settings.
const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/analytics", label: "Analytics", icon: ChartArea },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/orders", label: "Sales", icon: ShoppingBag },
      { href: "/admin/catering", label: "Catering", icon: Mail, badgeKey: "catering" },
      { href: "/admin/hours", label: "Hours", icon: Clock },
    ],
  },
  {
    label: "Menu",
    items: [
      { href: "/admin/menuItems", label: "Menu Items", icon: UtensilsCrossed },
      { href: "/admin/menuCategories", label: "Categories", icon: Tag },
    ],
  },
  {
    label: "Website",
    items: [
      { href: "/admin/story", label: "Our Story", icon: Newspaper },
      { href: "/admin/Blog", label: "Blog", icon: BookOpen },
      { href: "/admin/content", label: "Content", icon: FileText },
      { href: "/admin/media", label: "Media", icon: Images },
      { href: "/admin/reviews", label: "Reviews", icon: Star },
    ],
  },
  {
    label: "Settings",
    items: [
      { href: "/admin/branding", label: "Branding", icon: Palette },
      { href: "/admin/places", label: "Places", icon: MapPin },
      { href: "/admin/team", label: "Team", icon: ShieldCheck },
    ],
  },
];

function isItemActive(href: string, pathname: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

function NavItemLink({
  item,
  pathname,
  badge,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  badge?: number;
  onNavigate?: () => void;
}) {
  const active = isItemActive(item.href, pathname);
  const Icon = item.icon;
  const showBadge = !!badge && badge > 0;
  const showNew = SHOW_NEW_BADGES && NEW_TAB_HREFS.has(item.href);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-[#c85a1e] text-white shadow-sm"
          : "text-stone-300 hover:bg-stone-800 hover:text-white"
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-white/80" />
      )}
      <Icon
        size={18}
        className={cn(active ? "text-white" : "text-stone-400 group-hover:text-white")}
      />
      <span className="flex flex-1 items-center gap-1.5 truncate">
        <span className="truncate">{item.label}</span>
        {showNew && (
          <span className="rounded-full bg-emerald-500 px-1.5 py-px text-[9px] font-bold uppercase leading-none tracking-wide text-white">
            New
          </span>
        )}
      </span>
      {showBadge && (
        <span
          className={cn(
            "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold",
            active ? "bg-white text-[#c85a1e]" : "bg-orange-500 text-white"
          )}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#c85a1e]">
        <span className="text-xs font-bold text-white">SJ</span>
      </div>
      {!compact && (
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">{SITE_CONFIG.name}</p>
          <p className="text-[11px] text-stone-500">Admin panel</p>
        </div>
      )}
    </div>
  );
}

function SidebarBody({
  pathname,
  newCateringCount,
  onNavigate,
}: {
  pathname: string;
  newCateringCount: number;
  onNavigate?: () => void;
}) {
  const isProfileActive = pathname.startsWith("/admin/profile");

  return (
    <>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItemLink
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  badge={item.badgeKey === "catering" ? newCateringCount : undefined}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-1 border-t border-stone-800 p-3">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-stone-300 transition-colors hover:bg-stone-800 hover:text-white"
        >
          <Globe size={18} className="text-stone-400 group-hover:text-white" />
          <span className="flex-1">View live site</span>
          <ExternalLink size={14} className="text-stone-500 group-hover:text-white" />
        </a>
        <Link
          href="/admin/profile"
          onClick={onNavigate}
          aria-current={isProfileActive ? "page" : undefined}
          className={cn(
            "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isProfileActive
              ? "bg-[#c85a1e] text-white"
              : "text-stone-300 hover:bg-stone-800 hover:text-white"
          )}
        >
          <UserCircle
            size={18}
            className={cn(isProfileActive ? "text-white" : "text-stone-400 group-hover:text-white")}
          />
          <span className="flex flex-1 items-center gap-1.5">
            <span>My account</span>
            {SHOW_NEW_BADGES && NEW_TAB_HREFS.has("/admin/profile") && (
              <span className="rounded-full bg-emerald-500 px-1.5 py-px text-[9px] font-bold uppercase leading-none tracking-wide text-white">
                New
              </span>
            )}
          </span>
        </Link>
      </div>
    </>
  );
}

export function AdminNav({ newCateringCount = 0 }: { newCateringCount?: number }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-stone-800 bg-stone-900 text-white md:flex">
        <div className="flex h-16 items-center border-b border-stone-800 px-5">
          <Brand />
        </div>
        <SidebarBody pathname={pathname} newCateringCount={newCateringCount} />
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-stone-800 bg-stone-900 px-3 text-white md:hidden">
        <button
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-stone-200 hover:bg-stone-800"
        >
          <Menu size={20} />
          {newCateringCount > 0 && (
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-orange-500" />
          )}
        </button>
        <Brand compact />
        <Link
          href="/admin/profile"
          aria-label="Your profile"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-300"
        >
          <UserCircle size={18} />
        </Link>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 flex h-full w-72 max-w-[82vw] flex-col bg-stone-900 text-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-stone-800 px-5">
              <Brand />
              <button
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-800 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <SidebarBody
              pathname={pathname}
              newCateringCount={newCateringCount}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
