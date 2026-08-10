import { NextRequest, NextResponse } from "next/server";
import db from "@/db/db";
import { sendTelegramMessage } from "@/lib/telegram";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const loginUrl = new URL("/login", req.url);

  if (!token) {
    loginUrl.searchParams.set("verify", "invalid");
    return NextResponse.redirect(loginUrl);
  }

  const admin = await db.admin.findUnique({ where: { verificationToken: token } });

  if (
    !admin ||
    admin.status !== "PENDING_VERIFICATION" ||
    !admin.verificationTokenExpiresAt ||
    admin.verificationTokenExpiresAt < new Date()
  ) {
    loginUrl.searchParams.set("verify", "invalid");
    return NextResponse.redirect(loginUrl);
  }

  const approvedAdminCount = await db.admin.count({ where: { status: "APPROVED" } });
  const isFirstAdmin = approvedAdminCount === 0;

  await db.admin.update({
    where: { id: admin.id },
    data: {
      emailVerifiedAt: new Date(),
      verificationToken: null,
      verificationTokenExpiresAt: null,
      status: isFirstAdmin ? "APPROVED" : "PENDING_APPROVAL",
      approvedAt: isFirstAdmin ? new Date() : null,
    },
  });

  if (isFirstAdmin) {
    loginUrl.searchParams.set("verify", "first-admin");
  } else {
    loginUrl.searchParams.set("verify", "pending-approval");
    sendTelegramMessage(
      `🔔 New admin signup awaiting approval: <b>${admin.name}</b> (${admin.email}). Approve in the dashboard under Team.`,
    ).catch(() => {});
  }

  return NextResponse.redirect(loginUrl);
}
