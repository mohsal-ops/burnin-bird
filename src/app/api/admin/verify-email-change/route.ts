import { NextRequest, NextResponse } from "next/server";
import db from "@/db/db";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const profileUrl = new URL("/admin/profile", req.url);

  if (!token) {
    profileUrl.searchParams.set("emailChange", "invalid");
    return NextResponse.redirect(profileUrl);
  }

  const admin = await db.admin.findUnique({ where: { verificationToken: token } });

  if (
    !admin ||
    !admin.pendingEmail ||
    !admin.verificationTokenExpiresAt ||
    admin.verificationTokenExpiresAt < new Date()
  ) {
    profileUrl.searchParams.set("emailChange", "invalid");
    return NextResponse.redirect(profileUrl);
  }

  await db.admin.update({
    where: { id: admin.id },
    data: {
      email: admin.pendingEmail,
      pendingEmail: null,
      verificationToken: null,
      verificationTokenExpiresAt: null,
    },
  });

  profileUrl.searchParams.set("emailChange", "success");
  return NextResponse.redirect(profileUrl);
}
