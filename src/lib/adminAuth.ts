import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSessionToken } from "./adminSession";

export const ADMIN_COOKIE_NAME = "admin_session";
// Read-only "preview" session (outreach leads). Separate cookie so it can never
// be mistaken for a real credentialed session.
export const PREVIEW_COOKIE_NAME = "admin_preview";

/** Returns the signed-in admin's id, or null if the session cookie is missing/invalid/expired. */
export async function getAdminIdFromRequest(req: NextRequest): Promise<string | null> {
  const cookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const session = await verifyAdminSessionToken(cookie);
  return session?.id ?? null;
}

/** Returns a 401 response if the request isn't authenticated as admin, otherwise null. */
export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const adminId = await getAdminIdFromRequest(req);
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
