import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import {
  STRAVA_STATE_COOKIE,
  buildHomeRedirectUrl,
  getStravaOAuthConfig,
  handleStravaCallback,
} from "@/server/strava/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<Response> {
  const status = await handleStravaCallback({
    requestUrl: request.url,
    config: getStravaOAuthConfig(),
    database: db,
    expectedState: request.cookies.get(STRAVA_STATE_COOKIE)?.value ?? null,
    errorLogger: (message) => {
      console.error(message);
    },
  });

  const response = NextResponse.redirect(buildHomeRedirectUrl(request.url, status));
  response.cookies.set({
    name: STRAVA_STATE_COOKIE,
    value: "",
    path: "/",
    maxAge: 0,
  });

  return response;
}
