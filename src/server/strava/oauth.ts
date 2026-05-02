import crypto from "node:crypto";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { desc, sql } from "drizzle-orm";
import * as schema from "@/db/schema";
import { stravaTokens } from "@/db/schema";
import { env } from "@/lib/env";
import {
  STRAVA_AUTHORIZE_URL,
  STRAVA_OAUTH_SCOPE,
  STRAVA_REQUIRED_SCOPES,
  STRAVA_TOKEN_URL,
} from "@/server/strava/constants";

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
    [key: string]: unknown;
  };
  scope?: string;
}

export interface StravaConnectionStatus {
  connected: boolean;
  athleteId: number | null;
  scope: string | null;
  expiresAt: number | null;
  expired: boolean;
  updatedAt: string | null;
}

export type FarSygilDatabase = BetterSQLite3Database<typeof schema>;

type FetchImplementation = typeof fetch;

export class StravaOAuthError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "StravaOAuthError";
  }
}

export function generateOAuthState(): string {
  return crypto.randomBytes(32).toString("hex");
}

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
  state: string,
): string {
  const url = new URL(STRAVA_AUTHORIZE_URL);

  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("approval_prompt", "auto");
  url.searchParams.set("scope", STRAVA_OAUTH_SCOPE);

  url.searchParams.set("state", state);

  return url.toString();
}

export async function exchangeCodeForToken(
  code: string,
  config: StravaOAuthConfig,
  fetchImplementation: FetchImplementation = fetch,
): Promise<StravaTokenExchangeResponse> {
  let response: Response;

  try {
    response = await fetchImplementation(STRAVA_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        grant_type: "authorization_code",
      }),
      cache: "no-store",
    });
  } catch (error) {
    throw new StravaOAuthError(
      "Network error contacting Strava token endpoint",
      error,
    );
  }

  if (!response.ok) {
    const status = response.status;
    let body = "";

    try {
      body = await response.text();
    } catch {
      body = "";
    }

    throw new StravaOAuthError(
      `Strava token exchange failed (HTTP ${status})${body ? `: ${body.slice(0, 200)}` : ""}`,
    );
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch (error) {
    throw new StravaOAuthError(
      "Invalid JSON from Strava token endpoint",
      error,
    );
  }

  return parseStravaTokenExchangeResponse(payload);
}

export async function upsertStravaToken(
  database: FarSygilDatabase,
  token: StravaTokenExchangeResponse,
  acceptedScope: string | null,
): Promise<void> {
  try {
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
  } catch (error) {
    throw new StravaOAuthError("Failed to persist Strava tokens", error);
  }
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
      updatedAt: stravaTokens.updatedAt,
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
      updatedAt: null,
    };
  }

  return {
    connected: true,
    athleteId: token.athleteId,
    scope: token.scope ?? null,
    expiresAt: token.expiresAt,
    expired: token.expiresAt <= nowUnix,
    updatedAt: token.updatedAt,
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
  const callbackError = request.searchParams.get("error");
  const acceptedScope = normalizeScope(request.searchParams.get("scope"));
  const returnedState = request.searchParams.get("state");

  if (callbackError === "access_denied") {
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
    await upsertStravaToken(database, token, acceptedScope);
    return "connected";
  } catch (callbackFailure) {
    const message = getErrorMessage(callbackFailure);

    if (
      callbackFailure instanceof StravaOAuthError &&
      callbackFailure.message === "Failed to persist Strava tokens"
    ) {
      errorLogger?.(`Strava token storage failed: ${message}`);
      return "storage_failed";
    }

    errorLogger?.(`Strava token exchange failed: ${message}`);
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
    throw new StravaOAuthError(
      "Strava token response missing required fields (access_token, refresh_token, expires_at, athlete.id)",
    );
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
