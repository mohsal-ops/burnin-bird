import PageHeader from "../_components/pageHeader";
import OrdersDashboard from "./_components/OrdersDashboard";
import { getOrderStats, getOrdersWithItems } from "./_actions/cartOrders";
import { isEnabled } from "@/lib/flags";
import PushOptIn from "@/components/pwa/PushOptIn";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const [orders, stats, pushOn] = await Promise.all([getOrdersWithItems(), getOrderStats(), isEnabled("web_push")]);

  return (
    <div className="lg:flex justify-center">
      <div className="p-5 space-y-3 w-full lg:w-[80%]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PageHeader>Orders</PageHeader>
          {pushOn && <PushOptIn audience="owner" label="New-order alerts on this device" className="text-stone-700" />}
        </div>
        <OrdersDashboard orders={orders} stats={stats} />
      </div>
    </div>
  );
}
