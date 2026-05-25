import { NextResponse } from "next/server";

import { db } from "@/db/client";
import { StravaDetailSyncError } from "@/server/strava/detail-sync";
import { syncStravaFreshData } from "@/server/strava/fresh-sync";
import { getStravaOAuthConfig } from "@/server/strava/oauth";
import { StravaSyncError } from "@/server/strava/sync";

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
    const result = await syncStravaFreshData({
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
    const mappedError = mapFreshSyncError(error);

    return NextResponse.json(
      {
        error: mappedError.code,
        message: mappedError.message,
      },
      {
        status: mappedError.status,
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
    console.error("[strava-fresh-sync] configuration failed:", message);
    return null;
  }
}

function mapFreshSyncError(error: unknown): {
  code: string;
  message: string;
  status: number;
} {
  if (error instanceof StravaSyncError || hasStravaSyncErrorCode(error)) {
    const code = error.code;
    return {
      code,
      message: error.message,
      status: getStatusCode(code),
    };
  }

  if (error instanceof StravaDetailSyncError || hasStravaSyncErrorCode(error)) {
    const code = error.code;
    return {
      code,
      message: error.message,
      status: getStatusCode(code),
    };
  }

  return {
    code: "fresh_sync_failed",
    message: error instanceof Error ? error.message : "Unknown sync failure",
    status: 500,
  };
}

function hasStravaSyncErrorCode(error: unknown): error is {
  code: string;
  message: string;
} {
  return (
    !!error &&
    typeof error === "object" &&
    "code" in error &&
    "message" in error &&
    typeof error.code === "string" &&
    typeof error.message === "string"
  );
}

function getStatusCode(code: string): number {
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
