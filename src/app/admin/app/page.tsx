import db from "@/db/db";
import { getAllFlags } from "@/lib/flags";
import { getThemeColor } from "@/lib/siteSettings";
import { getIconVersion, iconUrl } from "@/lib/pwa/iconUrl";
import { AppIconUpload } from "./_components/AppIconUpload";
import { getSetting } from "@/lib/siteSettings";
import { SITE_CONFIG } from "@/lib/siteConfig";
import PageHeader from "../_components/pageHeader";
import { AppToggles } from "./_components/AppToggles";

export const dynamic = "force-dynamic";

// Admin → App: turn the installable app and notifications on/off and preview
// the home-screen icon + splash screen customers will see.
export default async function AppPage() {
  const [flags, color, owners, customers, iconV, appIcon] = await Promise.all([
    getAllFlags(),
    getThemeColor().catch(() => "#111111"),
    db.pushSubscription.count({ where: { audience: "owner" } }).catch(() => 0),
    db.pushSubscription.count({ where: { audience: "customer" } }).catch(() => 0),
    getIconVersion(),
    getSetting("app_icon_url", "").catch(() => ""),
  ]);
  const shortName = SITE_CONFIG.name.length > 12 ? SITE_CONFIG.name.split(/\s+/)[0].slice(0, 12) : SITE_CONFIG.name;

  return (
    <div className="lg:flex justify-center">
      <div className="w-full lg:w-[80%] p-4 md:p-6 space-y-5">
        <div>
          <PageHeader>App</PageHeader>
          <p className="mt-1 max-w-2xl text-sm text-stone-500">
            Customers can add your website to their home screen like an app (no app store), and get a notification when
            their order is ready.
          </p>
        </div>
        <AppToggles pwa={flags.pwa} push={flags.web_push} native={flags.native_app} accounts={flags.customer_accounts} owners={owners} customers={customers} />

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="mb-4 font-semibold text-stone-800">Preview</p>
          <div className="flex flex-wrap items-end gap-10">
            <div className="text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={iconUrl(192, { v: iconV })} alt="App icon" width={72} height={72} className="mx-auto rounded-[18px] shadow-md" />
              <p className="mt-1.5 text-xs text-stone-600">{shortName}</p>
              <p className="text-[11px] text-stone-400">Home screen icon</p>
            </div>
            <div className="text-center">
              <div
                className="flex h-56 w-28 flex-col items-center justify-center gap-3 rounded-[22px] border-4 border-stone-800 bg-white shadow-md"
                aria-label="Splash screen preview"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={iconUrl(192, { v: iconV })} alt="" width={48} height={48} className="rounded-xl" />
                <span className="px-2 text-[11px] font-medium text-stone-700">{SITE_CONFIG.name}</span>
              </div>
              <p className="mt-1.5 text-[11px] text-stone-400">Opening screen</p>
            </div>
            <div className="text-sm text-stone-500">
              <p>
                Colour: <span className="inline-block h-3 w-3 rounded-full align-middle" style={{ background: color }} /> {color}
              </p>
              <AppIconUpload hasCustom={!!appIcon} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
