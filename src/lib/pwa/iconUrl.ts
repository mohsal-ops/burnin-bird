// App icon URLs carry a per-deploy version (?v=…) so phones and browsers never
// keep a stale icon: the icon response used to be cached "immutable" for a
// year, so an icon made before the logo was set stuck forever.
export const ICON_VERSION = (process.env.VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_DEPLOYMENT_ID || "dev").slice(0, 8);

export function iconUrl(size: 180 | 192 | 512, opts: { maskable?: boolean; v?: string } = {}) {
  const q = new URLSearchParams({ v: opts.v ?? ICON_VERSION });
  if (opts.maskable) q.set("maskable", "1");
  return `/api/pwa/icon/${size}?${q.toString()}`;
}
