import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getCurrentAdmin } from "@/lib/getCurrentAdmin";
import { getAdapter, isPosProvider } from "@/lib/pos/registry";
import { encodeState, POS_STATE_COOKIE, posRedirectUri } from "@/lib/pos/oauthState";

export const dynamic = "force-dynamic";

// Owner clicks "Connect Square/Clover" in admin → POS consent screen.
export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  if (!(await getCurrentAdmin())) return NextResponse.redirect(new URL("/admin/login", req.url));
  if (!isPosProvider(provider)) return NextResponse.json({ error: "Unknown POS" }, { status: 404 });
  const adapter = getAdapter(provider);
  if (adapter.support === "scaffold") return NextResponse.redirect(new URL("/admin/pos?error=not_available", req.url));

  const env = req.nextUrl.searchParams.get("env") === "production" ? "production" : "sandbox";
  const nonce = randomBytes(16).toString("hex");
  const state = encodeState({ site: req.nextUrl.origin, nonce, provider, env });
  const url = adapter.authorizeUrl({ environment: env, state, redirectUri: posRedirectUri(req.nextUrl.origin, provider) });

  const res = NextResponse.redirect(url);
  res.cookies.set(POS_STATE_COOKIE, nonce, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" });
  return res;
}
