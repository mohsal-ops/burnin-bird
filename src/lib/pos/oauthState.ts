// OAuth `state` for POS connects. Carries which site started the flow so a
// central relay (Square and Clover allow ONE redirect URL per app; see
// docs/pos/square.md) can bounce the browser back to the right client site.
// CSRF protection is the nonce, which must match the httpOnly cookie set when
// the owner clicked Connect.

export interface PosOAuthState {
  site: string; // origin of the client site, e.g. https://burnin-bird.vercel.app
  nonce: string;
  provider: string;
  env: "sandbox" | "production";
}

export const POS_STATE_COOKIE = "pos_oauth_nonce";

export function encodeState(s: PosOAuthState): string {
  return Buffer.from(JSON.stringify(s)).toString("base64url");
}

export function decodeState(raw: string | null): PosOAuthState | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (typeof s?.site !== "string" || typeof s?.nonce !== "string" || typeof s?.provider !== "string") return null;
    return { site: s.site, nonce: s.nonce, provider: s.provider, env: s.env === "production" ? "production" : "sandbox" };
  } catch {
    return null;
  }
}

/**
 * Where the POS sends the owner back after consent. With one agency app for
 * all restaurants this is the builder's relay (POS_OAUTH_REDIRECT_URL), which
 * forwards to the site named in `state`. Without it (a dedicated app, or
 * sandbox testing) the site's own callback is used.
 */
export function posRedirectUri(origin: string, provider: string): string {
  return process.env.POS_OAUTH_REDIRECT_URL?.trim() || `${origin}/api/pos/${provider}/callback`;
}
