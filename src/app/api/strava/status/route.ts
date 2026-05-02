import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { getStravaConnectionStatus } from "@/server/strava/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const status = await getStravaConnectionStatus(db);

    return NextResponse.json(status, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[strava-status] failed to read connection status:", message);

    return NextResponse.json(
      { error: "status_read_failed", message },
      { status: 500 },
    );
  }
}
