import db from "@/db/db";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/../public/general/logo/logo.png";
import {
  PenLine,
  UtensilsCrossed,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Zap,
  Images,
  Mail,
  DollarSign,
  ShoppingBag,
  Receipt,
  ExternalLink,
} from "lucide-react";
import { ReactNode } from "react";
import TrafficSourceChart from "./_components/charts/trafficSources";
import { getBusinessHours, getOpenStatus } from "@/lib/getHours";
import { getOwnerBriefing } from "@/lib/dashboardStats";
import { formatCurrency } from "@/lib/formatters";
import { SITE_CONFIG } from "@/lib/siteConfig";

const isUnlocked = true; // 🔒 flip to true when ready

async function getDashboardData() {
  const [totalItems, activeItems, inactiveItems, totalCategories, totalPosts, latestPost, totalLocations, featuredItems, totalGalleryImages, totalReviews] =
    await Promise.all([
      db.item.count(),
      db.item.count({ where: { isAvailableForPurchase: true } }),
      db.item.count({ where: { isAvailableForPurchase: false } }),
      db.types.count(),
      db.post.count(),
      db.post.findFirst({ orderBy: { createdAt: "desc" }, select: { title: true, createdAt: true } }),
      db.location.count(),
      db.item.count({ where: { isAvailableForPurchase: true } }),
      db.galleryImage.count(),
      db.review.count(),
    ]);

  let seoScore = 0;
  if (totalPosts >= 1)  seoScore += 20;
  if (totalPosts >= 5)  seoScore += 20;
  if (totalPosts >= 10) seoScore += 10;
  if (activeItems >= 10) seoScore += 15;
  if (featuredItems >= 3) seoScore += 10;
  if (totalLocations >= 1) seoScore += 15;
  if (latestPost) {
    const d = Math.floor((Date.now() - new Date(latestPost.createdAt).getTime()) / 86400000);
    if (d <= 7) seoScore += 10;
    else if (d <= 30) seoScore += 5;
  }
  return { totalItems, activeItems, inactiveItems, totalCategories, totalPosts, latestPost, totalLocations, featuredItems, totalGalleryImages, totalReviews, seoScore };
}

function greetingFor(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4">{children}</h2>;
}

function TodayTile({ label, value, sub, icon, accent }: { label: string; value: string | number; sub?: string; icon: ReactNode; accent: string }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: accent + "18", color: accent }}>{icon}</div>
      <p className="text-2xl font-bold text-stone-900 truncate">{value}</p>
      <p className="text-xs font-medium text-stone-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-stone-400 mt-1">{sub}</p>}
    </div>
  );
}

function AttentionRow({ icon, text, action, href, tone }: { icon: ReactNode; text: string; action: string; href: string; tone: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 py-3 border-b border-stone-50 last:border-0 group">
      <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: tone + "18", color: tone }}>{icon}</span>
      <p className="flex-1 text-sm text-stone-700">{text}</p>
      <span className="text-xs font-semibold flex items-center gap-1 shrink-0 group-hover:underline" style={{ color: tone }}>
        {action} <ArrowRight size={12} />
      </span>
    </Link>
  );
}

function Sparkline({ data, color = "#c85a1e" }: { data: number[]; color?: string }) {
  const max = Math.max(1, ...data);
  const w = 260, h = 48;
  const step = data.length > 1 ? w / (data.length - 1) : w;
  const pts = data.map((v, i) => `${(i * step).toFixed(1)},${(h - (v / max) * h).toFixed(1)}`);
  const line = pts.join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-12" preserveAspectRatio="none">
      <polygon points={area} fill={color} opacity={0.08} />
      <polyline points={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SEOTip({ done, text, action, href }: { done: boolean; text: string; action?: string; href?: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-stone-50 last:border-0">
      <div className="mt-0.5 shrink-0">
        {done ? <CheckCircle2 size={16} className="text-green-500" /> : <XCircle size={16} className="text-stone-300" />}
      </div>
      <p className={`flex-1 text-sm ${done ? "text-stone-600" : "text-stone-400"}`}>{text}</p>
      {!done && href && action && (
        <Link href={href} className="text-xs font-semibold text-[#c85a1e] hover:underline shrink-0">{action} →</Link>
      )}
    </div>
  );
}

export default async function Page() {
  const [data, businessHours, briefing] = await Promise.all([
    getDashboardData(),
    getBusinessHours(),
    getOwnerBriefing(),
  ]);
  const houstonStatus = getOpenStatus(businessHours);
  const daysSincePost = data.latestPost
    ? Math.floor((Date.now() - new Date(data.latestPost.createdAt).getTime()) / 86400000)
    : null;
  const seoColor = data.seoScore >= 70 ? "#1a6b3c" : data.seoScore >= 40 ? "#d97706" : "#dc2626";

  const chicagoHour = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: SITE_CONFIG.timezone, hour: "numeric", hour12: false }).format(new Date()),
  );
  const greeting = greetingFor(chicagoHour % 24);
  const todayLabel = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  const attention: { icon: ReactNode; text: string; action: string; href: string; tone: string }[] = [];
  if (briefing.newCatering > 0)
    attention.push({ icon: <Mail size={15} />, text: `${briefing.newCatering} new catering request${briefing.newCatering > 1 ? "s" : ""} waiting for a reply`, action: "Review", href: "/admin/catering", tone: "#c85a1e" });
  if (briefing.ordersToday > 0)
    attention.push({ icon: <ShoppingBag size={15} />, text: `${briefing.ordersToday} order${briefing.ordersToday > 1 ? "s" : ""} placed today`, action: "View", href: "/admin/orders", tone: "#1a6b3c" });
  if (data.inactiveItems > 0)
    attention.push({ icon: <AlertCircle size={15} />, text: `${data.inactiveItems} menu item${data.inactiveItems > 1 ? "s" : ""} marked unavailable`, action: "Fix", href: "/admin/menuItems", tone: "#d97706" });

  const deltaPositive = (briefing.weekDeltaPct ?? 0) >= 0;

  return (
    <>
      <div
        className={
          isUnlocked
            ? "min-h-screen bg-stone-50 p-4 md:p-6 space-y-8"
            : "min-h-screen bg-stone-50 p-4 md:p-6 space-y-8 blur-sm pointer-events-none select-none"
        }
      >
        {/* ── HEADER - subtle: logo + greeting, accent touches only ── */}
        <header className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center shrink-0 overflow-hidden">
              <Image src={Logo} alt={`${SITE_CONFIG.name} logo`} width={40} height={40} className="w-full h-full rounded-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-stone-400">{todayLabel}</p>
              <h1 className="text-2xl font-bold text-stone-900 truncate">{greeting}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-full px-3.5 py-2">
              <span className={`w-2 h-2 rounded-full shrink-0 ${houstonStatus.isOpen ? "bg-green-500 animate-pulse" : "bg-red-400"}`} />
              <span className="text-sm font-medium text-stone-700">{houstonStatus.label}</span>
              {houstonStatus.next && <span className="text-xs text-stone-400 hidden sm:inline">· {houstonStatus.next}</span>}
            </div>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-[#c85a1e] border border-stone-200 rounded-full px-3.5 py-2 transition-colors"
            >
              View site <ExternalLink size={13} />
            </a>
          </div>
        </header>

        {/* ── TODAY - the money glance ── */}
        <div>
          <SectionTitle>Today</SectionTitle>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <TodayTile label="Revenue today" value={formatCurrency(briefing.revenueTodayCents / 100)} icon={<DollarSign size={16} />} accent="#1a6b3c" />
            <TodayTile label="Orders today" value={briefing.ordersToday} icon={<ShoppingBag size={16} />} accent="#c85a1e" />
            <TodayTile label="Avg order (7d)" value={briefing.avgOrderCents > 0 ? formatCurrency(briefing.avgOrderCents / 100) : "-"} icon={<Receipt size={16} />} accent="#1d4ed8" />
            <TodayTile label="New catering" value={briefing.newCatering} sub={briefing.newCatering > 0 ? "Needs a reply" : "All clear"} icon={<Mail size={16} />} accent="#d97706" />
          </div>
        </div>

        {/* ── NEEDS ATTENTION ── */}
        <div>
          <SectionTitle>Needs your attention</SectionTitle>
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm px-5 py-1">
            {attention.length > 0 ? (
              attention.map((a, i) => <AttentionRow key={i} {...a} />)
            ) : (
              <div className="flex items-center gap-3 py-4">
                <CheckCircle2 size={18} className="text-green-500 shrink-0" />
                <p className="text-sm text-stone-500">You&apos;re all caught up - nothing needs action right now.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── THIS WEEK ── */}
        <div>
          <SectionTitle>This week</SectionTitle>
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 grid sm:grid-cols-[1fr_1.4fr] gap-6 items-center">
            <div className="space-y-3">
              <div>
                <p className="text-3xl font-bold text-stone-900">{formatCurrency(briefing.weekRevenueCents / 100)}</p>
                <p className="text-xs text-stone-500 mt-0.5">Revenue · last 7 days</p>
              </div>
              <div className="flex items-center gap-3 text-sm">
                {briefing.weekDeltaPct !== null ? (
                  <span className={`inline-flex items-center gap-1 font-semibold ${deltaPositive ? "text-green-600" : "text-red-500"}`}>
                    {deltaPositive ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                    {deltaPositive ? "+" : ""}{briefing.weekDeltaPct}%
                  </span>
                ) : (
                  <span className="text-stone-400 text-xs">No prior-week data yet</span>
                )}
                <span className="text-stone-400 text-xs">vs. previous 7 days</span>
              </div>
              <p className="text-xs text-stone-400">{briefing.weekOrders} order{briefing.weekOrders !== 1 ? "s" : ""} this week</p>
            </div>
            <div>
              <Sparkline data={briefing.sparkRevenue} color={deltaPositive ? "#1a6b3c" : "#c85a1e"} />
              <div className="flex justify-between text-[10px] text-stone-400 mt-1">
                <span>7 days ago</span>
                <span>Today</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── QUICK ACTIONS ── */}
        <div>
          <SectionTitle>Quick Actions</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link href="/admin/menuItems/new" className="group bg-white rounded-2xl border border-stone-200 shadow-sm p-5 hover:border-[#1a6b3c] hover:shadow-md transition-all">
              <div className="w-9 h-9 rounded-xl bg-green-50 text-[#1a6b3c] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><UtensilsCrossed size={18} /></div>
              <p className="font-semibold text-stone-800 text-sm">Add Menu Item</p>
              <p className="text-xs text-stone-400 mt-1">{data.totalItems} items · {data.totalCategories} categories</p>
            </Link>
            <Link href="/admin/Blog" className="group bg-white rounded-2xl border border-stone-200 shadow-sm p-5 hover:border-[#c85a1e] hover:shadow-md transition-all">
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#c85a1e] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><PenLine size={18} /></div>
              <p className="font-semibold text-stone-800 text-sm">Write Blog Post</p>
              <p className="text-xs text-stone-400 mt-1">{daysSincePost === null ? "No posts yet -- start now" : daysSincePost === 0 ? "Last post: today ✓" : `Last post: ${daysSincePost}d ago`}</p>
            </Link>
            <Link href="/admin/gallery" className="group bg-white rounded-2xl border border-stone-200 shadow-sm p-5 hover:border-[#7c3aed] hover:shadow-md transition-all">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#7c3aed] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><Images size={18} /></div>
              <p className="font-semibold text-stone-800 text-sm">Manage Gallery</p>
              <p className="text-xs text-stone-400 mt-1">{data.totalGalleryImages} photo{data.totalGalleryImages !== 1 ? "s" : ""} on the home page</p>
            </Link>
          </div>
        </div>

        {/* ── GROWTH & MARKETING (demoted) ── */}
        <div className="pt-2">
          <SectionTitle>Growth &amp; Marketing</SectionTitle>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-1">SEO Health</p>
                  <p className="font-semibold text-stone-800">How Google sees your site</p>
                </div>
                <div className="relative w-16 h-16 shrink-0">
                  <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke={seoColor} strokeWidth="3" strokeDasharray={`${data.seoScore} 100`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold" style={{ color: seoColor }}>{data.seoScore}</span>
                  </div>
                </div>
              </div>
              <SEOTip done={data.totalPosts >= 1} text="At least 1 blog post published" action="Write post" href="/admin/Blog" />
              <SEOTip done={data.totalPosts >= 5} text="5+ blog posts (boosts ranking significantly)" action="Write post" href="/admin/Blog" />
              <SEOTip done={data.totalPosts >= 10} text="10+ blog posts (establishes content authority)" action="Write post" href="/admin/Blog" />
              <SEOTip done={daysSincePost !== null && daysSincePost <= 7} text="Posted within the last 7 days (freshness signal)" action="Write now" href="/admin/Blog" />
              <SEOTip done={data.activeItems >= 10} text="10+ active menu items visible on site" action="Add items" href="/admin/menuItems/new" />
              <SEOTip done={data.featuredItems >= 3} text="3+ featured items on home page" action="Set featured" href="/admin/menuItems" />
              <SEOTip done={data.totalLocations >= 1} text="Location added (helps local SEO in Eagle Pass)" action="Add location" href="/admin/places" />
              <div className="mt-4 bg-stone-50 rounded-xl p-3 flex gap-2">
                <Zap size={14} className="text-[#c85a1e] shrink-0 mt-0.5" />
                <p className="text-xs text-stone-500 leading-relaxed">
                  <span className="font-semibold text-stone-700">Pro tip:</span>{" "}
                  Posting 2-3 blog posts per week is the single biggest thing you can do to rank higher on Google.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
                <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-1">Traffic Sources</p>
                <p className="font-semibold text-stone-800 mb-6">Where your visitors come from</p>
                <TrafficSourceChart />
              </div>

              <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#c85a1e] flex items-center justify-center"><TrendingUp size={16} /></div>
                    <div>
                      <p className="font-semibold text-stone-800 text-sm">{data.totalPosts} post{data.totalPosts !== 1 ? "s" : ""} published</p>
                      <p className="text-xs text-stone-400">
                        {data.latestPost ? `Last: "${data.latestPost.title}" - ${daysSincePost === 0 ? "today" : `${daysSincePost} days ago`}` : "No posts yet - start writing to get found on Google"}
                      </p>
                    </div>
                  </div>
                  <Link href="/admin/Blog" className="text-xs font-semibold text-[#c85a1e] hover:underline flex items-center gap-1">Manage <ArrowRight size={12} /></Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── MENU HEALTH ── */}
        <div>
          <SectionTitle>Menu Health</SectionTitle>
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="grid grid-cols-3 divide-x divide-stone-100">
              <div className="p-6 text-center">
                <p className="text-3xl font-bold text-green-600">{data.activeItems}</p>
                <p className="text-xs text-stone-500 mt-1 font-medium">Available</p>
              </div>
              <div className="p-6 text-center">
                <p className="text-3xl font-bold text-red-500">{data.inactiveItems}</p>
                <p className="text-xs text-stone-500 mt-1 font-medium">Unavailable</p>
              </div>
              <div className="p-6 text-center">
                <p className="text-3xl font-bold text-stone-800">{data.featuredItems}</p>
                <p className="text-xs text-stone-500 mt-1 font-medium">Featured</p>
              </div>
            </div>
            <div className="px-6 pb-5">
              <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${data.totalItems > 0 ? (data.activeItems / data.totalItems) * 100 : 0}%` }} />
              </div>
              <p className="text-xs text-stone-400 mt-2">
                {data.totalItems > 0 ? `${Math.round((data.activeItems / data.totalItems) * 100)}% of menu currently available` : "No items yet"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── OVERLAY - fixed so it sits above page content but below the layout navbar ── */}
      {!isUnlocked && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-auto"
          style={{ top: "56px" }}
        >
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center">
              <span className="text-3xl">🚧</span>
            </div>
            <h2 className="text-xl font-bold text-stone-900">Dashboard Coming Soon</h2>
            <p className="text-sm text-stone-500 leading-relaxed">
              We&apos;re building you a powerful admin dashboard - SEO tools, blog management, menu control, and live analytics. Almost ready.
            </p>
            <div className="w-full">
              <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full w-[80%] bg-[#c85a1e] rounded-full animate-pulse" />
              </div>
              <p className="text-xs text-stone-400 mt-2">Progress: 80% complete</p>
            </div>
            <p className="text-xs text-stone-400">
              Questions? Email{" "}
              <a href="mailto:popdeveloper54@gmail.com" className="text-[#c85a1e] hover:underline font-medium">
                popdeveloper54@gmail.com
              </a>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
