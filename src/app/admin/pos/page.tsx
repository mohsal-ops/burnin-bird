import db from "@/db/db";
import { getAllFlags } from "@/lib/flags";
import { POS_ADAPTERS, POS_LABELS } from "@/lib/pos/registry";
import type { PosProvider } from "@/lib/pos/types";
import PageHeader from "../_components/pageHeader";
import { PosPanel } from "./_components/PosPanel";

export const dynamic = "force-dynamic";

// Admin → POS. Reached at /admin/pos (no nav entry until a site has POS turned
// on — see docs/ROLLOUT.md). Only safe-to-show facts are sent to the browser.
export default async function PosPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const [conn, flags, syncs] = await Promise.all([
    db.posConnection.findFirst({ where: { status: { in: ["connected", "error"] } }, orderBy: { updatedAt: "desc" } }),
    getAllFlags(),
    db.posOrderSync.findMany({ orderBy: { createdAt: "desc" }, take: 25 }),
  ]);
  // Mapping health: site items not linked to anything in the POS yet.
  const unmapped = conn
    ? await db.item
        .findMany({
          where: { isAvailableForPurchase: true },
          select: { id: true, name: true },
        })
        .then(async (items) => {
          const linked = new Set(
            (await db.posMenuMap.findMany({ where: { provider: conn.provider, localType: "item" }, select: { localId: true } })).map(
              (m) => m.localId,
            ),
          );
          return items.filter((i) => !linked.has(i.id)).map((i) => i.name);
        })
        .catch(() => [])
    : [];

  const providers = (Object.keys(POS_ADAPTERS) as PosProvider[]).map((p) => ({
    id: p,
    label: POS_LABELS[p],
    support: POS_ADAPTERS[p].support,
    configured:
      p === "square"
        ? !!(process.env.SQUARE_APPLICATION_ID || process.env.SQUARE_SANDBOX_APPLICATION_ID)
        : p === "clover"
          ? !!process.env.CLOVER_APP_ID
          : false,
  }));

  return (
    <div className="lg:flex justify-center">
      <div className="w-full lg:w-[80%] p-4 md:p-6 space-y-5">
        <div>
          <PageHeader>POS</PageHeader>
          <p className="mt-1 max-w-2xl text-sm text-stone-500">
            Connect your point-of-sale so paid website orders print in your kitchen like any other ticket, and your
            menu prices and sold-out items stay in sync.
          </p>
        </div>
        <PosPanel
          notice={sp.connected ? { ok: true, text: "POS connected." } : sp.error ? { ok: false, text: sp.error } : null}
          providers={providers}
          connection={
            conn
              ? {
                  provider: conn.provider,
                  label: POS_LABELS[conn.provider as PosProvider] ?? conn.provider,
                  environment: conn.environment,
                  status: conn.status,
                  lastError: conn.lastError,
                  locationId: conn.locationId,
                  hasMerchant: !!conn.merchantId,
                  lastMenuSyncAt: conn.lastMenuSyncAt?.toISOString() ?? null,
                }
              : null
          }
          flags={{ pos_push: flags.pos_push, pos_menu_sync: flags.pos_menu_sync }}
          unmapped={unmapped}
          syncs={syncs.map((s) => ({
            id: s.id,
            cartId: s.cartId,
            provider: s.provider,
            status: s.status,
            attempts: s.attempts,
            lastError: s.lastError,
            posOrderId: s.posOrderId,
            createdAt: s.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
