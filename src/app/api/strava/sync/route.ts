import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { getStravaOAuthConfig } from "@/server/strava/oauth";
import { StravaSyncError, syncStravaActivities } from "@/server/strava/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(): Promise<NextResponse> {
  const config = getSyncConfigOrNull();

  if (!config) {
    return NextResponse.json(
      {
        error: "strava_config_error",
        message: "Strava sync is not configured locally.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  try {
    const result = await syncStravaActivities({
      database: db,
      config,
      errorLogger: (message) => {
        console.error(message);
      },
    });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const syncError =
      error instanceof StravaSyncError
        ? error
        : new StravaSyncError(
            error instanceof Error ? error.message : "Unknown sync failure",
            "storage_failed",
            error,
          );

    return NextResponse.json(
      {
        error: syncError.code,
        message: syncError.message,
      },
      {
        status: getStatusCode(syncError.code),
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}

function getSyncConfigOrNull() {
  try {
    return getStravaOAuthConfig();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[strava-sync] configuration failed:", message);
    return null;
  }
}

function getStatusCode(code: StravaSyncError["code"]): number {
  switch (code) {
    case "not_connected":
      return 401;
    case "fetch_failed":
    case "invalid_response":
      return 502;
    case "storage_failed":
    default:
      return 500;
  }
}
