import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Retrieve token from request cookies
  const token =
    request.cookies.get("accessToken")?.value ||
    request.cookies.get("token")?.value;

  const isAuthRoute = pathname === "/login";
  const isProtectedRoute = pathname.startsWith("/admin");

  // 1. If user is logged in and tries to access /login, redirect to dashboard
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  // 2. If user is NOT logged in and tries to access protected /admin routes, redirect to login
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
