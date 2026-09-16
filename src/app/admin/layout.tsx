import { Toaster } from "@/components/ui/sonner";
import { AdminNav } from "./_components/nav";
import LoadingScreen from "@/components/LoadingScreen";
import PreviewBanner from "./_components/PreviewBanner";
import PreviewCallCta from "./_components/PreviewCallCta";
import VisitAlert from "@/app/(customerFacing)/_components/VisitAlert";
import { getAccess } from "@/lib/getAccess";
import { getLogoUrl } from "@/lib/siteSettings";
import { getTodaySummary } from "./orders/_actions/cartOrders";
import LiveBar from "./_components/LiveBar";
import db from "@/db/db";

export const dynamic = "force-dynamic";

export default async function Adminlayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [access, logoUrl] = await Promise.all([getAccess(), getLogoUrl()]);

  // Surfaced as a badge on the Catering nav item so pending requests are
  // visible from any admin page, not just the dashboard. Resilient to a DB
  // hiccup so the whole admin doesn't 500 on a transient outage.
  let newCateringCount = 0;
  try {
    newCateringCount = await db.cateringRequest.count({ where: { status: "new" } });
  } catch {
    newCateringCount = 0;
  }

  // Today's numbers for the persistent live bar (same source as Sales). Resilient
  // to a DB hiccup so a transient outage never 500s the whole admin.
  let today = { salesTodayCents: 0, ordersToday: 0, newOrders: 0 };
  try {
    today = await getTodaySummary();
  } catch {
    /* keep zeros */
  }

  return (
    // The admin dashboard is ALWAYS light - the public dark theme is scoped to
    // the customer site only. `.admin-shell` (globals.css) re-declares the light
    // design tokens for this subtree, so admin stays light even when <html> has
    // the `dark` class set by the website's theme toggle.
    <div className="admin-shell min-h-screen bg-stone-50">
      {access.mode === "preview" && <PreviewBanner />}
      {/* Access tracking lives here (admin/dashboard) only, NOT on the public
          site - it emailed on every live-site visit and flooded the inbox.
          Preview-only so it pings when a lead opens their dashboard, never for
          a logged-in owner (also muted server-side in /api/visit-alert). */}
      {access.mode === "preview" && <VisitAlert source="dashboard" />}
      <div className="md:flex">
        {/* One-time branded splash on a fresh admin load. */}
        <LoadingScreen />
        <AdminNav newCateringCount={newCateringCount} logoUrl={logoUrl} />
        <main id="main-content" className="min-w-0 flex-1 overflow-auto">
          <LiveBar
            salesTodayCents={today.salesTodayCents}
            ordersToday={today.ordersToday}
            newOrders={today.newOrders}
          />
          {children}
        </main>
        <Toaster expand richColors closeButton duration={6000} />
      </div>
      {access.mode === "preview" && <PreviewCallCta />}
    </div>
  );
}
