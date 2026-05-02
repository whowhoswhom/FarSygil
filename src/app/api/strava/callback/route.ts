import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { STRAVA_OAUTH_STATE_COOKIE } from "@/server/strava/constants";
import {
  buildHomeRedirectUrl,
  getStravaOAuthConfig,
  handleStravaCallback,
  type StravaCallbackStatus,
  type StravaOAuthConfig,
} from "@/server/strava/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<Response> {
  const config = getCallbackConfigOrNull();

  if (!config) {
    return createCallbackRedirectResponse(request, "config_error");
  }

  // Expected OAuth failures are translated to StravaCallbackStatus inside
  // handleStravaCallback; this route only maps local config lookup failures.
  const status = await handleStravaCallback({
    requestUrl: request.url,
    config,
    database: db,
    expectedState: request.cookies.get(STRAVA_OAUTH_STATE_COOKIE)?.value ?? null,
    errorLogger: (message) => {
      console.error("[strava-oauth] callback failed:", message);
    },
  });

  return createCallbackRedirectResponse(request, status);
}

function getCallbackConfigOrNull(): StravaOAuthConfig | null {
  try {
    return getStravaOAuthConfig();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[strava-oauth] callback configuration failed:", message);
    return null;
  }
}

function createCallbackRedirectResponse(
  request: NextRequest,
  status: StravaCallbackStatus,
): NextResponse {
  const response = NextResponse.redirect(buildHomeRedirectUrl(request.url, status), {
    status: 302,
  });

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
