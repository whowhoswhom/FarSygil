import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db/client";
import { getStravaOAuthConfig } from "@/server/strava/oauth";
import {
  StravaDetailSyncError,
  syncStravaActivityDetails,
  type StravaDetailSyncMode,
} from "@/server/strava/detail-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const config = getSyncConfigOrNull();

  if (!config) {
    return NextResponse.json(
      {
        error: "strava_config_error",
        message: "Strava detail sync is not configured locally.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const mode = await getRequestedMode(request);

  try {
    const result = await syncStravaActivityDetails({
      database: db,
      config,
      mode,
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
    const detailSyncError =
      error instanceof StravaDetailSyncError
        ? error
        : new StravaDetailSyncError(
            error instanceof Error ? error.message : "Unknown detail sync failure",
            "storage_failed",
            error,
          );

    return NextResponse.json(
      {
        error: detailSyncError.code,
        message: detailSyncError.message,
      },
      {
        status: getStatusCode(detailSyncError.code),
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}

async function getRequestedMode(
  request: NextRequest,
): Promise<StravaDetailSyncMode> {
  const payload = (await request.json().catch(() => null)) as
    | { mode?: string }
    | null;

  return payload?.mode === "full" ? "full" : "incremental";
}

function getSyncConfigOrNull() {
  try {
    return getStravaOAuthConfig();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[strava-detail-sync] configuration failed:", message);
    return null;
  }
}

function getStatusCode(code: StravaDetailSyncError["code"]): number {
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
