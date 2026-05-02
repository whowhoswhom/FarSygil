import { NextResponse } from "next/server";
import {
  STRAVA_OAUTH_STATE_COOKIE,
  STRAVA_OAUTH_STATE_MAX_AGE_SECONDS,
} from "@/server/strava/constants";
import {
  buildStravaAuthorizeUrl,
  getStravaOAuthConfig,
  generateOAuthState,
} from "@/server/strava/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(): NextResponse {
  try {
    const state = generateOAuthState();
    const response = NextResponse.redirect(
      buildStravaAuthorizeUrl(getStravaOAuthConfig(), state),
      {
        status: 302,
      },
    );

    response.cookies.set({
      name: STRAVA_OAUTH_STATE_COOKIE,
      value: state,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: STRAVA_OAUTH_STATE_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to build Strava authorize URL";

    return NextResponse.json(
      { error: "strava_config_error", message },
      { status: 500 },
    );
  }
}
