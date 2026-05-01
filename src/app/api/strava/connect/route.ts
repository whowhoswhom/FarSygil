import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import {
  STRAVA_STATE_COOKIE,
  buildStravaAuthorizeUrl,
  getStravaOAuthConfig,
} from "@/server/strava/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const state = randomBytes(32).toString("hex");
  const response = NextResponse.redirect(
    buildStravaAuthorizeUrl(getStravaOAuthConfig(), state),
  );

  response.cookies.set({
    name: STRAVA_STATE_COOKIE,
    value: state,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });

  return response;
}
