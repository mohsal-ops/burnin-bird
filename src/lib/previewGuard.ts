// The access boundary for admin server actions and write API routes.
//
// assertWritable() is called at the TOP of every mutating admin server action
// and write API route. Because it runs on the server, it blocks the write no
// matter how the action is invoked - clicking a button, or POSTing the action id
// to ANY path with devtools/curl (server actions are not covered by the
// /admin middleware matcher, so this check is the real gate). Only a signed-in,
// APPROVED admin passes; a preview visitor gets the read-only error; anyone
// else is rejected. It intentionally does NOT wrap the Prisma client, so
// incidental read-path writes (e.g. lazy seedDefaults in getSiteImages) still
// work while a preview visitor is just looking around.
import { cookies } from "next/headers";
import db from "@/db/db";
import { ADMIN_COOKIE_NAME, PREVIEW_COOKIE_NAME } from "./adminAuth";
import { verifyAdminSessionToken, verifyPreviewToken } from "./adminSession";

export class PreviewReadOnlyError extends Error {
  constructor() {
    super("This is a read-only preview - sign in with full access to make changes.");
    this.name = "PreviewReadOnlyError";
  }
}

export class NotSignedInError extends Error {
  constructor() {
    super("Please sign in again.");
    this.name = "NotSignedInError";
  }
}

/** A signed-in admin whose account is still APPROVED (removed admins lose access at once). */
async function realAdmin(): Promise<boolean> {
  const jar = await cookies();
  const session = await verifyAdminSessionToken(jar.get(ADMIN_COOKIE_NAME)?.value);
  if (!session) return false;
  const a = await db.admin.findUnique({ where: { id: session.id }, select: { status: true } });
  return a?.status === "APPROVED";
}

async function isPreview(): Promise<boolean> {
  const jar = await cookies();
  return !!(await verifyPreviewToken(jar.get(PREVIEW_COOKIE_NAME)?.value));
}

/** Writes: real approved admin only. Preview → read-only error; anyone else → not signed in. */
export async function assertWritable(): Promise<void> {
  if (await realAdmin()) return;
  if (await isPreview()) throw new PreviewReadOnlyError();
  throw new NotSignedInError();
}

/** Reads of private admin data (orders, customers): real admin OR the read-only preview. */
export async function assertAdminRead(): Promise<void> {
  if (await realAdmin()) return;
  if (await isPreview()) return;
  throw new NotSignedInError();
}
