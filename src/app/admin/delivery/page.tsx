import { getUberDirect } from "@/lib/siteSettings";
import { DeliverySettingsForm } from "./_components/DeliverySettingsForm";
import PageHeader from "../_components/pageHeader";

export const dynamic = "force-dynamic";

export default async function DeliverySettingsPage() {
  const settings = await getUberDirect();
  return (
    <div className="lg:flex justify-center">
      <div className="w-full lg:w-[80%] p-4 md:p-6 space-y-5">
        <div>
          <PageHeader>Delivery</PageHeader>
          <p className="mt-1 max-w-2xl text-sm text-stone-500">
            By default your site takes <span className="font-medium text-stone-700">pickup</span> orders
            only. Turn on delivery to have a real Uber courier bring orders to customers — straight from
            your own site, with no marketplace commission.
          </p>
        </div>
        <DeliverySettingsForm initial={settings} />
      </div>
    </div>
  );
}
