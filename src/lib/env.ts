/**
 * Environment variable validation.
 *
 * Call `env()` anywhere in server code to get a typed, validated env object.
 * Missing required variables will throw at startup rather than silently
 * producing undefined values at runtime.
 *
 * Note: CLAUDE_API_KEY is Phase 4 only and therefore optional.
 */

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
        `Copy .env.example to .env.local and fill in the value.`,
    );
  }
  return value;
}

function optionalEnv(key: string): string | undefined {
  return process.env[key] ?? undefined;
}

export interface AppEnv {
  STRAVA_CLIENT_ID: string;
  STRAVA_CLIENT_SECRET: string;
  STRAVA_REDIRECT_URI: string;
  /** Phase 4 only — may be undefined in earlier phases */
  CLAUDE_API_KEY: string | undefined;
}

/**
 * Returns validated environment variables.
 * Throws if any required variable is missing.
 */
export function env(): AppEnv {
  return {
    STRAVA_CLIENT_ID: requireEnv("STRAVA_CLIENT_ID"),
    STRAVA_CLIENT_SECRET: requireEnv("STRAVA_CLIENT_SECRET"),
    STRAVA_REDIRECT_URI:
      // Defaults to localhost:3000 — change port in .env.local if you run on a different port
      optionalEnv("STRAVA_REDIRECT_URI") ??
      "http://localhost:3000/api/strava/callback",
    CLAUDE_API_KEY: optionalEnv("CLAUDE_API_KEY"),
  };
}
