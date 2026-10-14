// App icon URLs carry a version (?v=…) so phones and browsers never keep a
// stale icon: the deploy (commit) plus the time the owner last uploaded an app
// icon. The icon response itself is only cached for an hour.
export const ICON_VERSION = (process.env.VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_DEPLOYMENT_ID || "dev").slice(0, 8);

export function iconUrl(size: 180 | 192 | 512, opts: { maskable?: boolean; v?: string } = {}) {
  const q = new URLSearchParams({ v: opts.v ?? ICON_VERSION });
  if (opts.maskable) q.set("maskable", "1");
  return `/api/pwa/icon/${size}?${q.toString()}`;
}

/** Full version string: deploy + last app-icon upload (server only). */
export async function getIconVersion(): Promise<string> {
  try {
    const { getSetting } = await import("@/lib/siteSettings");
    const up = await getSetting("app_icon_v", "");
    return up ? `${ICON_VERSION}-${up}` : ICON_VERSION;
  } catch {
    return ICON_VERSION;
  }
}
