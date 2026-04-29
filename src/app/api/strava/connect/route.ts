import { NextResponse } from "next/server";

import {
  STRAVA_OAUTH_STATE_COOKIE,
  STRAVA_OAUTH_STATE_MAX_AGE_SECONDS,
} from "@/server/strava/constants";
import {
  buildAuthorizeUrl,
  generateOAuthState,
} from "@/server/strava/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(): NextResponse {
  let authorizeUrl: string;
  let state: string;
  try {
    state = generateOAuthState();
    authorizeUrl = buildAuthorizeUrl(state);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to build Strava authorize URL";
    return NextResponse.json(
      { error: "strava_config_error", message },
      { status: 500 },
    );
  }

  const response = NextResponse.redirect(authorizeUrl, { status: 302 });
  response.cookies.set({
    name: STRAVA_OAUTH_STATE_COOKIE,
    value: state,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: STRAVA_OAUTH_STATE_MAX_AGE_SECONDS,
  });
  return response;
}
