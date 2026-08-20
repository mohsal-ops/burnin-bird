// The read-only boundary for the outreach "preview" session.
//
// assertWritable() is called at the TOP of every mutating admin server action
// and write API route. Because it runs on the server, it blocks the write no
// matter how the action is invoked - clicking a button, or POSTing to the
// action/route directly with devtools/curl. A real credentialed admin passes; a
// preview visitor is rejected. It intentionally does NOT wrap the Prisma client,
// so incidental read-path writes (e.g. lazy seedDefaults in getSiteImages) still
// work while a preview visitor is just looking around.
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, PREVIEW_COOKIE_NAME } from "./adminAuth";
import { verifyAdminSessionToken, verifyPreviewToken } from "./adminSession";

export class PreviewReadOnlyError extends Error {
  constructor() {
    super("This is a read-only preview - sign in with full access to make changes.");
    this.name = "PreviewReadOnlyError";
  }
}

/**
 * Throws PreviewReadOnlyError if the caller is a read-only preview visitor.
 * A real admin session always wins. Callers with no preview cookie are allowed
 * through (anonymous access to admin routes is already blocked by middleware).
 */
export async function assertWritable(): Promise<void> {
  const jar = await cookies();

  // A real credentialed admin beats everything.
  const real = await verifyAdminSessionToken(jar.get(ADMIN_COOKIE_NAME)?.value);
  if (real) return;

  // A preview visitor is read-only.
  const preview = await verifyPreviewToken(jar.get(PREVIEW_COOKIE_NAME)?.value);
  if (preview) throw new PreviewReadOnlyError();

  // No preview cookie → not a preview visitor; allow. (Route-level access is
  // already gated by src/middleware.ts.)
}
