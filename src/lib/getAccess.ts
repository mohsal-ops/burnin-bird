// Tells server components / pages which mode the current request is in:
//   - "admin"   : a real credentialed admin (full write access)
//   - "preview" : a read-only outreach preview visitor
//   - "none"    : neither (middleware would have redirected /admin routes)
// UI uses this to show the preview banner + section framing and to swap in
// simulated demo data; the actual write boundary is assertWritable() (previewGuard).
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, PREVIEW_COOKIE_NAME } from "./adminAuth";
import { verifyAdminSessionToken, verifyPreviewToken } from "./adminSession";

export type Access =
  | { mode: "admin"; adminId: string }
  | { mode: "preview" }
  | { mode: "none" };

export async function getAccess(): Promise<Access> {
  const jar = await cookies();

  const real = await verifyAdminSessionToken(jar.get(ADMIN_COOKIE_NAME)?.value);
  if (real) return { mode: "admin", adminId: real.id };

  const preview = await verifyPreviewToken(jar.get(PREVIEW_COOKIE_NAME)?.value);
  if (preview) return { mode: "preview" };

  return { mode: "none" };
}

export async function isPreview(): Promise<boolean> {
  return (await getAccess()).mode === "preview";
}
