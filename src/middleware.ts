import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as jose from "jose";

const ADMIN_LOGIN = "/admin/login";
const ADMIN_COOKIE = "admin_token";

const VOLUNTEER_LOGIN = "/volunteer/login";
const VOLUNTEER_COOKIE = "volunteer_token";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const secret = process.env.JWT_SECRET;

  // ── Admin routes ──
  if (pathname.startsWith("/admin")) {
    if (pathname === ADMIN_LOGIN) return NextResponse.next();

    const token = request.cookies.get(ADMIN_COOKIE)?.value;
    if (!token || !secret) {
      return NextResponse.redirect(new URL(ADMIN_LOGIN, request.url));
    }
    try {
      await jose.jwtVerify(token, new TextEncoder().encode(secret));
      return NextResponse.next();
    } catch {
      const res = NextResponse.redirect(new URL(ADMIN_LOGIN, request.url));
      res.cookies.delete(ADMIN_COOKIE);
      return res;
    }
  }

  // ── Volunteer routes ──
  if (pathname.startsWith("/volunteer")) {
    if (pathname === VOLUNTEER_LOGIN) return NextResponse.next();

    // Allow volunteer API auth routes without a token
    if (pathname.startsWith("/api/volunteer/auth")) return NextResponse.next();

    const token = request.cookies.get(VOLUNTEER_COOKIE)?.value;
    if (!token || !secret) {
      return NextResponse.redirect(new URL(VOLUNTEER_LOGIN, request.url));
    }
    try {
      await jose.jwtVerify(token, new TextEncoder().encode(secret));
      return NextResponse.next();
    } catch {
      const res = NextResponse.redirect(new URL(VOLUNTEER_LOGIN, request.url));
      res.cookies.delete(VOLUNTEER_COOKIE);
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/volunteer", "/volunteer/:path*"],
};
