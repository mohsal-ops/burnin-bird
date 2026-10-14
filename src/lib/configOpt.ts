import { SITE_CONFIG } from "@/lib/siteConfig";

// Safe read of an OPTIONAL siteConfig setting. siteConfig.ts is per-client and
// never overwritten by "Update from template", so older sites can be missing
// settings that newer template code uses. Reading through this helper (instead
// of `SITE_CONFIG.newKey`) keeps their builds green: a missing key is just
// undefined, never a type error.
export function cfg<T = string>(key: string): T | undefined {
  return (SITE_CONFIG as unknown as Record<string, T | undefined>)[key];
}
