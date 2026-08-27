import { getUberDirect } from "@/lib/siteSettings";
import { DeliverySettingsForm } from "./_components/DeliverySettingsForm";

export const dynamic = "force-dynamic";

export default async function DeliverySettingsPage() {
  const settings = await getUberDirect();
  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold text-foreground">Delivery</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Dispatch a real Uber courier for delivery orders placed on your own site — no marketplace,
        no commission. Off by default. Requires your Uber Direct credentials to be set in the
        environment; delivery only dispatches when a courier is available, and any failure falls
        back to pickup so orders never get stuck.
      </p>
      <DeliverySettingsForm initial={settings} />
    </div>
  );
}
