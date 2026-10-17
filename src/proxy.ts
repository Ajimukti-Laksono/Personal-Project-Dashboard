import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

/**
 * Global Next.js proxy implementing Hybrid Access Mode:
 *
 * 1. Public Endpoints:
 * - / (Dashboard portfolio viewable by anyone in read-only mode)
 * - /login (Admin login page)
 * - /api/auth/login, /api/auth/logout, /api/auth/me
 * - /api/dashboard (Aggregated metrics, charts, activity feed)
 * - /api/events (Server-Sent Events for real-time live updates)
 * - /api/repos/* (Read-only repository details)
 * - /api/webhook (GitHub incoming webhook with HMAC signature)
 * - /api/health (Uptime & health check)
 * - Static assets & Next.js bundles
 *
 * 2. Protected Admin Endpoints:
 * - /api/sync (Manual backfill trigger)
 * - /api/webhook/history (Diagnostic history & event simulator)
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Allow static Next.js assets, icons, and public folder
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/public") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".ico")
  ) {
    return NextResponse.next();
  }

  // 2. Allow explicitly public endpoints (Hybrid read-only access)
  const isPublicPage = pathname === "/" || pathname === "/login";
  const isPublicApi =
    pathname === "/api/auth/login" ||
    pathname === "/api/auth/logout" ||
    pathname === "/api/auth/me" ||
    pathname === "/api/dashboard" ||
    pathname === "/api/events" ||
    pathname.startsWith("/api/repos") ||
    pathname === "/api/webhook" ||
    pathname === "/api/health";

  if (isPublicPage || isPublicApi) {
    return NextResponse.next();
  }

  // 3. Verify session cookie for protected admin actions
  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME);
  const isValid = sessionCookie ? await verifySessionToken(sessionCookie.value) : false;

  if (isValid) {
    return NextResponse.next();
  }

  // 4. Handle unauthenticated access for protected endpoints
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Unauthorized. Admin authentication required." },
      { status: 401 },
    );
  }

  // Fallback for non-public web pages: redirect to /login
  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     */
    "/((?!_next/static|_next/image).*)",
  ],
};
