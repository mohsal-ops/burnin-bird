import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/getCurrentAdmin";
import { getAdapter, isPosProvider } from "@/lib/pos/registry";
import { decodeState, POS_STATE_COOKIE, posRedirectUri } from "@/lib/pos/oauthState";
import { saveConnection } from "@/lib/pos/connection";

export const dynamic = "force-dynamic";

const back = (req: NextRequest, q: string) => {
  const res = NextResponse.redirect(new URL(`/admin/pos?${q}`, req.url));
  res.cookies.delete(POS_STATE_COOKIE);
  return res;
};

// POS consent → (builder relay) → here. Exchanges the code and stores the
// tokens encrypted. Must be the same signed-in owner who started the flow.
export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  if (!(await getCurrentAdmin())) return NextResponse.redirect(new URL("/admin/login", req.url));
  if (!isPosProvider(provider)) return back(req, "error=unknown_pos");

  const sp = req.nextUrl.searchParams;
  const state = decodeState(sp.get("state"));
  const cookieNonce = req.cookies.get(POS_STATE_COOKIE)?.value;
  if (!state || !cookieNonce || state.nonce !== cookieNonce || state.provider !== provider) {
    return back(req, "error=state_mismatch");
  }
  const code = sp.get("code");
  if (!code) return back(req, `error=${encodeURIComponent(sp.get("error") || "denied")}`);

  try {
    const adapter = getAdapter(provider);
    const { creds, merchantId } = await adapter.exchangeCode({
      environment: state.env,
      code,
      redirectUri: posRedirectUri(req.nextUrl.origin, provider),
      merchantId: sp.get("merchant_id") ?? undefined,
    });
    const locations = await adapter.listLocations({ environment: state.env, merchantId, creds }).catch(() => []);
    await saveConnection({
      provider,
      environment: state.env,
      creds,
      merchantId,
      locationId: locations.length === 1 ? locations[0].id : null,
    });
    return back(req, "connected=1");
  } catch (e) {
    console.error(`POS connect failed (${provider}):`, (e as Error).message);
    return back(req, `error=${encodeURIComponent((e as Error).message.slice(0, 120))}`);
  }
}
