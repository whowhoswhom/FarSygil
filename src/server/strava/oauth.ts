import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { desc, sql } from "drizzle-orm";
import * as schema from "@/db/schema";
import { stravaTokens } from "@/db/schema";
import { env } from "@/lib/env";

export const STRAVA_AUTHORIZE_URL = "https://www.strava.com/oauth/authorize";
export const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
export const STRAVA_REQUIRED_SCOPES = ["read", "activity:read_all"] as const;
export const STRAVA_SCOPE = STRAVA_REQUIRED_SCOPES.join(",");
export const STRAVA_STATE_COOKIE = "strava_oauth_state";

export type StravaCallbackStatus =
  | "connected"
  | "access_denied"
  | "missing_code"
  | "missing_scope"
  | "invalid_state"
  | "exchange_failed"
  | "storage_failed";

export interface StravaOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface StravaTokenExchangeResponse {
  token_type: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  athlete: {
    id: number;
  };
}

export interface StravaConnectionStatus {
  connected: boolean;
  athleteId: number | null;
  scope: string | null;
  expiresAt: number | null;
  expired: boolean;
}

export type FarSygilDatabase = BetterSQLite3Database<typeof schema>;

type FetchImplementation = typeof fetch;

export function getStravaOAuthConfig(): StravaOAuthConfig {
  const appEnv = env();

  return {
    clientId: appEnv.STRAVA_CLIENT_ID,
    clientSecret: appEnv.STRAVA_CLIENT_SECRET,
    redirectUri: appEnv.STRAVA_REDIRECT_URI,
  };
}

export function buildStravaAuthorizeUrl(
  config: StravaOAuthConfig,
  state?: string,
): string {
  const url = new URL(STRAVA_AUTHORIZE_URL);

  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("approval_prompt", "auto");
  url.searchParams.set("scope", STRAVA_SCOPE);

  if (state) {
    url.searchParams.set("state", state);
  }

  return url.toString();
}

export async function exchangeCodeForToken(
  code: string,
  config: StravaOAuthConfig,
  fetchImplementation: FetchImplementation = fetch,
): Promise<StravaTokenExchangeResponse> {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    grant_type: "authorization_code",
  });

  const response = await fetchImplementation(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Strava token exchange failed with status ${response.status}.`);
  }

  return parseStravaTokenExchangeResponse((await response.json()) as unknown);
}

export async function upsertStravaToken(
  database: FarSygilDatabase,
  token: StravaTokenExchangeResponse,
  acceptedScope: string | null,
): Promise<void> {
  await database
    .insert(stravaTokens)
    .values({
      athleteId: token.athlete.id,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt: token.expires_at,
      scope: acceptedScope,
    })
    .onConflictDoUpdate({
      target: stravaTokens.athleteId,
      set: {
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiresAt: token.expires_at,
        scope: acceptedScope,
        updatedAt: sql`(datetime('now'))`,
      },
    });
}

export async function getStravaConnectionStatus(
  database: FarSygilDatabase,
  nowUnix: number = Math.floor(Date.now() / 1000),
): Promise<StravaConnectionStatus> {
  const [token] = await database
    .select({
      athleteId: stravaTokens.athleteId,
      scope: stravaTokens.scope,
      expiresAt: stravaTokens.expiresAt,
    })
    .from(stravaTokens)
    .orderBy(desc(stravaTokens.updatedAt))
    .limit(1);

  if (!token) {
    return {
      connected: false,
      athleteId: null,
      scope: null,
      expiresAt: null,
      expired: false,
    };
  }

  return {
    connected: true,
    athleteId: token.athleteId,
    scope: token.scope ?? null,
    expiresAt: token.expiresAt,
    expired: token.expiresAt <= nowUnix,
  };
}

export async function handleStravaCallback(options: {
  requestUrl: string;
  config: StravaOAuthConfig;
  database: FarSygilDatabase;
  expectedState: string | null;
  fetchImplementation?: FetchImplementation;
  errorLogger?: (message: string) => void;
}): Promise<StravaCallbackStatus> {
  const {
    requestUrl,
    config,
    database,
    expectedState,
    fetchImplementation = fetch,
    errorLogger,
  } = options;
  const request = new URL(requestUrl);
  const code = request.searchParams.get("code");
  const error = request.searchParams.get("error");
  const acceptedScope = normalizeScope(request.searchParams.get("scope"));
  const returnedState = request.searchParams.get("state");

  if (error === "access_denied") {
    return "access_denied";
  }

  if (!code) {
    return "missing_code";
  }

  if (!acceptedScope || !hasRequiredScopes(acceptedScope)) {
    return "missing_scope";
  }

  if (!expectedState || !returnedState || returnedState !== expectedState) {
    return "invalid_state";
  }

  try {
    const token = await exchangeCodeForToken(code, config, fetchImplementation);

    try {
      await upsertStravaToken(database, token, acceptedScope);
    } catch (error) {
      errorLogger?.(
        `Strava token storage failed: ${getErrorMessage(error)}`,
      );
      return "storage_failed";
    }

    return "connected";
  } catch (error) {
    errorLogger?.(
      `Strava token exchange failed: ${getErrorMessage(error)}`,
    );
    return "exchange_failed";
  }
}

export function buildHomeRedirectUrl(
  requestUrl: string,
  status: StravaCallbackStatus,
): string {
  const redirectUrl = new URL("/", requestUrl);
  redirectUrl.searchParams.set("strava", status);

  return redirectUrl.toString();
}

function hasRequiredScopes(scope: string): boolean {
  const grantedScopes = new Set(
    scope
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );

  return STRAVA_REQUIRED_SCOPES.every((requiredScope) =>
    grantedScopes.has(requiredScope),
  );
}

function normalizeScope(scope: string | null): string | null {
  const trimmed = scope?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}

function parseStravaTokenExchangeResponse(
  payload: unknown,
): StravaTokenExchangeResponse {
  if (!isStravaTokenExchangeResponse(payload)) {
    throw new Error("Strava token exchange returned an invalid payload.");
  }

  return payload;
}

function isStravaTokenExchangeResponse(
  payload: unknown,
): payload is StravaTokenExchangeResponse {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const candidate = payload as Partial<StravaTokenExchangeResponse>;

  return (
    typeof candidate.token_type === "string" &&
    typeof candidate.access_token === "string" &&
    typeof candidate.refresh_token === "string" &&
    typeof candidate.expires_at === "number" &&
    typeof candidate.expires_in === "number" &&
    !!candidate.athlete &&
    typeof candidate.athlete === "object" &&
    typeof candidate.athlete.id === "number"
  );
}
