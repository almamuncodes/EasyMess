import { NextResponse } from "next/server";

/**
 * Lightweight internal Route Handler used by proxy.js (middleware)
 * to check maintenance mode without hitting MongoDB directly from
 * the Edge Runtime.
 *
 * GET /api/maintenance-status
 * Returns: { maintenanceMode: boolean }
 */
export async function GET() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      return NextResponse.json({ maintenanceMode: false });
    }

    const res = await fetch(`${apiUrl}/api/system/settings`, {
      // Cache for 30 seconds to avoid hammering the server on every request
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      return NextResponse.json({ maintenanceMode: false });
    }

    const data = await res.json();
    const maintenanceMode = data?.data?.maintenanceMode === true;

    return NextResponse.json({ maintenanceMode });
  } catch {
    // If we can't reach the API server, fail open
    return NextResponse.json({ maintenanceMode: false });
  }
}
