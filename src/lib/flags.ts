import "server-only";
import db from "@/db/db";

// Feature flags for the platform build. Every flag is a SiteSetting row
// ("flag:<name>" = "1") and is OFF unless an owner/agency turns it on, so no
// existing client site changes behaviour when this code ships.
//
// Two extra safety layers:
//   • env kill switch  STARVEGA_KILL_<NAME>=1  forces a flag OFF on a site
//     without touching its database (e.g. POS push misbehaving → kill it).
//   • STARVEGA_KILL_ALL=1 turns every platform flag off at once.

export const FLAGS = {
  /** Send paid orders to the connected POS (Square/Clover). */
  pos_push: "POS order push",
  /** Pull menu/prices/86'd status from the POS on a schedule. */
  pos_menu_sync: "POS menu sync",
  /** Multi-provider delivery router (Uber Direct + DoorDash Drive). */
  delivery_router: "Delivery router",
  /** DoorDash Drive as a delivery provider. */
  doordash_drive: "DoorDash Drive",
  /** Installable web app (manifest + service worker + install prompt). */
  pwa: "Installable app (PWA)",
  /** Web push: order updates to customers, new-order alerts to owners. */
  web_push: "Web push notifications",
  /** Monthly "you saved" email + dashboard card. */
  savings_report: "Monthly savings report",
  /** /admin/health page + daily self-check digest. */
  ops_health: "Ops health checks",
  /** /api/app/* endpoints used by the restaurant's native iOS/Android app. */
  native_app: "Native app API",
  /** Optional customer sign-in (emailed code) + "My account" page. Guest checkout stays. */
  customer_accounts: "Customer accounts",
} as const;

export type FlagName = keyof typeof FLAGS;

const settingKey = (f: FlagName) => `flag:${f}`;

function killed(f: FlagName): boolean {
  return process.env.STARVEGA_KILL_ALL === "1" || process.env[`STARVEGA_KILL_${f.toUpperCase()}`] === "1";
}

export async function isEnabled(f: FlagName): Promise<boolean> {
  if (killed(f)) return false;
  try {
    const row = await db.siteSetting.findUnique({ where: { key: settingKey(f) } });
    return row?.value === "1";
  } catch {
    return false; // DB hiccup → behave like today (flag off)
  }
}

export async function getAllFlags(): Promise<Record<FlagName, { on: boolean; killed: boolean; label: string }>> {
  const rows = await db.siteSetting
    .findMany({ where: { key: { startsWith: "flag:" } } })
    .catch(() => [] as { key: string; value: string }[]);
  const on = new Set(rows.filter((r) => r.value === "1").map((r) => r.key.slice(5)));
  return Object.fromEntries(
    (Object.keys(FLAGS) as FlagName[]).map((f) => [f, { on: on.has(f) && !killed(f), killed: killed(f), label: FLAGS[f] }]),
  ) as Record<FlagName, { on: boolean; killed: boolean; label: string }>;
}

export async function setFlag(f: FlagName, on: boolean): Promise<void> {
  await db.siteSetting.upsert({
    where: { key: settingKey(f) },
    update: { value: on ? "1" : "0" },
    create: { key: settingKey(f), value: on ? "1" : "0" },
  });
}
