import { NextResponse, type NextRequest } from "next/server";

import { STRAVA_OAUTH_STATE_COOKIE } from "@/server/strava/constants";
import {
  exchangeCodeForTokens,
  saveStravaTokens,
  STRAVA_OAUTH_SCOPE,
  StravaOAuthError,
} from "@/server/strava/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redirectToConnect(
  request: NextRequest,
  status: "connected" | "error",
  reason?: string,
): NextResponse {
  const url = new URL("/connect", request.url);
  url.searchParams.set("status", status);
  if (reason) url.searchParams.set("reason", reason);

  const response = NextResponse.redirect(url, { status: 302 });
  response.cookies.set({
    name: STRAVA_OAUTH_STATE_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");
  const expectedState = request.cookies.get(STRAVA_OAUTH_STATE_COOKIE)?.value;

  if (oauthError) {
    return redirectToConnect(request, "error", `strava_${oauthError}`);
  }

  if (!code) {
    return redirectToConnect(request, "error", "missing_code");
  }

  if (!expectedState || !state || state !== expectedState) {
    return redirectToConnect(request, "error", "invalid_state");
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const grantedScope = tokens.scope ?? STRAVA_OAUTH_SCOPE;
    await saveStravaTokens(tokens, grantedScope);
    return redirectToConnect(request, "connected");
  } catch (err) {
    if (err instanceof StravaOAuthError) {
      console.error("[strava-oauth] callback failed:", err.message);
      return redirectToConnect(request, "error", "token_exchange_failed");
    }
    const message = err instanceof Error ? err.message : String(err);
    console.error("[strava-oauth] unexpected callback error:", message);
    return redirectToConnect(request, "error", "unexpected_error");
  }
}
