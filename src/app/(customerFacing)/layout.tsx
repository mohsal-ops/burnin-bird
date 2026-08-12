import { SidebarProvider } from "@/components/ui/sidebar";
import { TopNavBar } from "./_components/navBar";
import { Footer } from "./_components/Footer";
import { Toaster } from "sonner";
import { cookies } from "next/headers";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { getLogoUrl } from "@/lib/siteSettings";
import VisitAlert from "./_components/VisitAlert";
import LoadingScreen from "@/components/LoadingScreen";
import TrialPopup from "./_components/TrialPopup";
import DashboardBubble from "./_components/DashboardBubble";

export default async function Customerlayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const dynamic = "force-dynamic";
  const cartId = (await cookies()).get("cart_id")?.value ?? null;
  const logoUrl = await getLogoUrl();

  return (
    <SidebarProvider>
      {/* One-time branded intro on the public site (once per browser session) */}
      <LoadingScreen />
      <VisitAlert />
      <TrialPopup />
      <DashboardBubble />
      <main className="flex relative flex-col w-full  pb- ">
        <div className="fixed top-0 left-0 right-0 z-50">
          <TopNavBar initialCartId={cartId} logoUrl={logoUrl} />
        </div>
        <div id="main-content" className="flex flex-col md:items-center   ">{children}</div>
        <div className="flex flex-col w-full items-center ">
          <Footer logoUrl={logoUrl} />
          <div className="relative text-xs  mt-2 text-black text-center p-4 md:py-3 bg-stone-200 w-full border-t border-white/10">
            {SITE_CONFIG.footer.copyright}
            {" "}Website by{" "}
            <a
              href="https://www.instagram.com/vegastar.digital/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary"
            >
              Vega Star Digital
            </a>{" "}
            - MOHAMMED BSL.
            {/* <Link
            href="/login"
            className="absolute right-1 text-xs text-stone-400 hover:text-stone-600"
          >
            Admin
          </Link> */}
          </div>
          
        </div>
      </main>
      <Toaster
        position="top-center"
        theme="light"
        expand
        richColors
        closeButton
        duration={4000}
      />
    </SidebarProvider>
  );
}
