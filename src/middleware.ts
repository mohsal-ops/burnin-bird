import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/adminAuth";
import { verifyAdminSessionToken } from "@/lib/adminSession";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) return NextResponse.next();

  const cookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const session = await verifyAdminSessionToken(cookie);

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
