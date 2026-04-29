import { NextResponse } from "next/server";

import { getStravaConnectionStatus } from "@/server/strava/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const status = await getStravaConnectionStatus();
    return NextResponse.json(status, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[strava-status] failed to read connection status:", message);
    return NextResponse.json(
      { error: "status_read_failed", message },
      { status: 500 },
    );
  }
}
