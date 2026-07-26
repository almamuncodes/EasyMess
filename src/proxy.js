import { NextResponse } from "next/server";

/**
 * Proxy (middleware) — checks if system is in maintenance mode.
 * If maintenanceMode === true and the user is not an admin,
 * all non-admin, non-API, non-maintenance paths are redirected
 * to /maintenance.
 *
 * Admin bypass: if the request has a cookie "user_role" === "admin"
 * or tries to reach /signin or /api/*, it is allowed through.
 *
 * Note: We cannot hit MongoDB directly from the Edge Runtime,
 * so we call our own lightweight API route /api/maintenance-status
 * which is a Next.js Route Handler (runs in Node.js).
 */
// Global cache for warm Edge instances to avoid hammering the backend on every page request
let cachedMaintenance = null;
let cacheExpiry = 0;

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // Always allow: maintenance page itself, signin, API routes, static assets
  const alwaysAllow =
    pathname === "/maintenance" ||
    pathname.startsWith("/signin") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/apple-icon") ||
    pathname.startsWith("/manifest") ||
    pathname.startsWith("/robots");

  if (alwaysAllow) {
    return NextResponse.next();
  }

  // Check maintenance mode by calling the external API server directly
  // (Proxy runs in Edge Runtime — cannot access MongoDB, so we hit Express)
  let maintenanceMode = false;
  const now = Date.now();

  if (cachedMaintenance !== null && now < cacheExpiry) {
    maintenanceMode = cachedMaintenance;
  } else {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL;
      if (apiBase) {
        const statusRes = await fetch(`${apiBase}/api/system/settings`, {
          headers: { "x-internal-check": "1" },
          // Use a short timeout so proxy never stalls page loads
          signal: AbortSignal.timeout(3000),
        });

        if (statusRes.ok) {
          const body = await statusRes.json();
          maintenanceMode = body?.data?.maintenanceMode === true;
          cachedMaintenance = maintenanceMode;
          cacheExpiry = now + 10000; // Cache for 10 seconds inside warm Edge instances
        }
      }
    } catch {
      // Fail open — if API is unreachable, let the request through
    }
  }

  if (maintenanceMode) {
    // Allow admin users — identified by the em_user_role cookie
    const roleCookie = request.cookies.get("em_user_role")?.value;
    const isAdmin = roleCookie === "admin";

    if (!isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/maintenance";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except Next.js internals and static assets
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|manifest|robots).*)",
  ],
};
