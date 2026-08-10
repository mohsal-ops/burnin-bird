import PageHeader from "../_components/pageHeader";
import OrdersDashboard from "./_components/OrdersDashboard";
import { getOrderStats, getOrdersWithItems } from "./_actions/cartOrders";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const [orders, stats] = await Promise.all([getOrdersWithItems(), getOrderStats()]);

  return (
    <div className="lg:flex justify-center">
      <div className="p-5 space-y-3 w-full lg:w-[80%]">
        <PageHeader>Orders</PageHeader>
        <OrdersDashboard orders={orders} stats={stats} />
      </div>
    </div>
  );
}
