import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { STRAVA_OAUTH_STATE_COOKIE } from "@/server/strava/constants";
import {
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
    expectedState: request.cookies.get(STRAVA_OAUTH_STATE_COOKIE)?.value ?? null,
    errorLogger: (message) => {
      console.error("[strava-oauth] callback failed:", message);
    },
  });

  const response = NextResponse.redirect(
    buildHomeRedirectUrl(request.url, status),
    { status: 302 },
  );

  response.cookies.set({
    name: STRAVA_OAUTH_STATE_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
