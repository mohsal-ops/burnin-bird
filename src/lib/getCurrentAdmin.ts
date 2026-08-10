// Node-only (uses the Prisma/pg client) - import this from Server
// Components and Server Actions, never from middleware (Edge runtime).
import { cookies } from "next/headers";
import db from "@/db/db";
import { ADMIN_COOKIE_NAME } from "./adminAuth";
import { verifyAdminSessionToken } from "./adminSession";

export async function getCurrentAdmin() {
  const cookie = (await cookies()).get(ADMIN_COOKIE_NAME)?.value;
  const session = await verifyAdminSessionToken(cookie);
  if (!session) return null;

  const admin = await db.admin.findUnique({ where: { id: session.id } });
  if (!admin || admin.status !== "APPROVED") return null;

  return admin;
}
