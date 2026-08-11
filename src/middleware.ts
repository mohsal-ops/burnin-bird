import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, PREVIEW_COOKIE_NAME } from "@/lib/adminAuth";
import { verifyAdminSessionToken, verifyPreviewToken } from "@/lib/adminSession";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) return NextResponse.next();

  // A real credentialed admin, or a read-only preview visitor, may view /admin.
  // (Preview writes are blocked separately by assertWritable().)
  const session = await verifyAdminSessionToken(request.cookies.get(ADMIN_COOKIE_NAME)?.value);
  if (session) return NextResponse.next();

  const preview = await verifyPreviewToken(request.cookies.get(PREVIEW_COOKIE_NAME)?.value);
  if (preview) return NextResponse.next();

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/admin/:path*"],
};
