import crypto from "node:crypto";
import { sql } from "drizzle-orm";

import { db } from "@/db/client";
import { stravaTokens } from "@/db/schema";
import { env } from "@/lib/env";

const STRAVA_AUTHORIZE_URL = "https://www.strava.com/oauth/authorize";
const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";

export const STRAVA_OAUTH_SCOPE = "read,activity:read_all";

export interface StravaTokenResponse {
  token_type: "Bearer";
  expires_at: number;
  expires_in: number;
  refresh_token: string;
  access_token: string;
  athlete?: {
    id: number;
    [key: string]: unknown;
  };
  scope?: string;
}

export interface StoredStravaToken {
  athleteId: number;
  expiresAt: number;
  scope: string | null;
  updatedAt: string;
}

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

export function buildAuthorizeUrl(state: string): string {
  const { STRAVA_CLIENT_ID, STRAVA_REDIRECT_URI } = env();
  const params = new URLSearchParams({
    client_id: STRAVA_CLIENT_ID,
    redirect_uri: STRAVA_REDIRECT_URI,
    response_type: "code",
    approval_prompt: "auto",
    scope: STRAVA_OAUTH_SCOPE,
    state,
  });
  return `${STRAVA_AUTHORIZE_URL}?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  code: string,
): Promise<StravaTokenResponse> {
  const { STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET } = env();

  let response: Response;
  try {
    response = await fetch(STRAVA_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
      }),
      cache: "no-store",
    });
  } catch (err) {
    throw new StravaOAuthError("Network error contacting Strava token endpoint", err);
  }

  if (!response.ok) {
    const status = response.status;
    let body = "";
    try {
      body = await response.text();
    } catch {
      // ignore body read failures
    }
    throw new StravaOAuthError(
      `Strava token exchange failed (HTTP ${status})${body ? `: ${body.slice(0, 200)}` : ""}`,
    );
  }

  let data: StravaTokenResponse;
  try {
    data = (await response.json()) as StravaTokenResponse;
  } catch (err) {
    throw new StravaOAuthError("Invalid JSON from Strava token endpoint", err);
  }

  if (
    !data.access_token ||
    !data.refresh_token ||
    typeof data.expires_at !== "number" ||
    !data.athlete?.id
  ) {
    throw new StravaOAuthError(
      "Strava token response missing required fields (access_token, refresh_token, expires_at, athlete.id)",
    );
  }

  return data;
}

export async function saveStravaTokens(
  tokens: StravaTokenResponse,
  scope: string,
): Promise<void> {
  const athleteId = tokens.athlete!.id;
  try {
    await db
      .insert(stravaTokens)
      .values({
        athleteId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expires_at,
        scope,
      })
      .onConflictDoUpdate({
        target: stravaTokens.athleteId,
        set: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: tokens.expires_at,
          scope,
          updatedAt: sql`(datetime('now'))`,
        },
      });
  } catch (err) {
    throw new StravaOAuthError("Failed to persist Strava tokens", err);
  }
}

export interface StravaConnectionStatus {
  connected: boolean;
  athleteId: number | null;
  scope: string | null;
  expiresAt: number | null;
  expired: boolean;
  updatedAt: string | null;
}

export async function getStravaConnectionStatus(): Promise<StravaConnectionStatus> {
  const rows = await db
    .select({
      athleteId: stravaTokens.athleteId,
      expiresAt: stravaTokens.expiresAt,
      scope: stravaTokens.scope,
      updatedAt: stravaTokens.updatedAt,
    })
    .from(stravaTokens)
    .limit(1);

  const row = rows[0];
  if (!row) {
    return {
      connected: false,
      athleteId: null,
      scope: null,
      expiresAt: null,
      expired: false,
      updatedAt: null,
    };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  return {
    connected: true,
    athleteId: row.athleteId,
    scope: row.scope,
    expiresAt: row.expiresAt,
    expired: row.expiresAt <= nowSeconds,
    updatedAt: row.updatedAt,
  };
}
