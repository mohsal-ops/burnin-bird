import { getUberDirect } from "@/lib/siteSettings";
import { isUberDirectConfigured } from "@/lib/uber";
import { DeliverySettingsForm } from "./_components/DeliverySettingsForm";
import PageHeader from "../_components/pageHeader";
import { isEnabled } from "@/lib/flags";
import { getDeliveryStrategy, getDoorDashSettings } from "@/lib/delivery/settings";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { CourierSettings } from "./_components/CourierSettings";

export const dynamic = "force-dynamic";

export default async function DeliverySettingsPage() {
  const settings = await getUberDirect();
  // Multi-courier settings only exist on sites with the delivery router on.
  const router = await isEnabled("delivery_router");
  const [dd, strategy, ddActive] = router
    ? await Promise.all([getDoorDashSettings(), getDeliveryStrategy(), isEnabled("doordash_drive")])
    : [null, "cheapest" as const, false];
  return (
    <div className="lg:flex justify-center">
      <div className="w-full lg:w-[80%] p-4 md:p-6 space-y-5">
        <div>
          <PageHeader>Delivery</PageHeader>
          <p className="mt-1 max-w-2xl text-sm text-stone-500">
            By default your site takes <span className="font-medium text-stone-700">pickup</span> orders
            only. Turn on delivery to have a real Uber courier bring orders to customers - straight from
            your own site, with no marketplace commission.
          </p>
        </div>
        <DeliverySettingsForm initial={settings} configured={isUberDirectConfigured()} />
        {router && (
          <CourierSettings
            uberConfigured={isUberDirectConfigured()}
            strategy={strategy}
            doordash={{
              saved: !!dd,
              active: ddActive,
              webhookUrl: `${SITE_CONFIG.siteUrl}/api/delivery/doordash/webhook`,
              webhookSecret: dd?.webhookSecret ?? "",
            }}
          />
        )}
      </div>
    </div>
  );
}
