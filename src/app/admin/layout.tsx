import { Toaster } from "@/components/ui/sonner";
import { AdminNav } from "./_components/nav";
import LoadingScreen from "@/components/LoadingScreen";
import PreviewBanner from "./_components/PreviewBanner";
import PreviewCallCta from "./_components/PreviewCallCta";
import { getAccess } from "@/lib/getAccess";
import { getLogoUrl } from "@/lib/siteSettings";
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

  return (
    <div className="min-h-screen bg-stone-50">
      {access.mode === "preview" && <PreviewBanner />}
      <div className="md:flex">
        {/* One-time branded splash on a fresh admin load. */}
        <LoadingScreen />
        <AdminNav newCateringCount={newCateringCount} logoUrl={logoUrl} />
        <main id="main-content" className="min-w-0 flex-1 overflow-auto">
          {children}
        </main>
        <Toaster expand richColors closeButton duration={6000} />
      </div>
      {access.mode === "preview" && <PreviewCallCta />}
    </div>
  );
}
