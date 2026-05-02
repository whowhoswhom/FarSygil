import { readdirSync, readFileSync } from "node:fs";
import Database from "better-sqlite3";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as testSchema from "../../src/db/schema";
import { STRAVA_TOKEN_URL } from "../../src/server/strava/constants";
import {
  buildStravaAuthorizeUrl,
  getStravaConnectionStatus,
  handleStravaCallback,
  type FarSygilDatabase,
  type StravaOAuthConfig,
  type StravaTokenExchangeResponse,
} from "../../src/server/strava/oauth";

const TEST_CONFIG: StravaOAuthConfig = {
  clientId: "12345",
  clientSecret: "secret-value",
  redirectUri: "http://localhost:3000/api/strava/callback",
};

const tokenFixture = JSON.parse(
  readFixture("token-exchange-success.json"),
) as StravaTokenExchangeResponse;
const COMMITTED_MIGRATIONS = readCommittedMigrations();

describe("Strava OAuth", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("builds the Strava authorize URL with the required scope and state", () => {
    const url = new URL(buildStravaAuthorizeUrl(TEST_CONFIG, "state-123"));

    expect(url.origin + url.pathname).toBe(
      "https://www.strava.com/oauth/authorize",
    );
    expect(url.searchParams.get("client_id")).toBe(TEST_CONFIG.clientId);
    expect(url.searchParams.get("redirect_uri")).toBe(TEST_CONFIG.redirectUri);
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("approval_prompt")).toBe("auto");
    expect(url.searchParams.get("scope")).toBe("read,activity:read_all");
    expect(url.searchParams.get("state")).toBe("state-123");
  });

  it("exchanges the code and upserts one token row", async () => {
    const { database, sqlite } = createTestDatabase();
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(tokenFixture), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    try {
      const firstStatus = await handleStravaCallback({
        requestUrl:
          "http://localhost:3000/api/strava/callback?code=test-code&scope=read,activity:read_all&state=state-123",
        config: TEST_CONFIG,
        database,
        expectedState: "state-123",
        fetchImplementation: fetchMock,
      });

      expect(firstStatus).toBe("connected");
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(
        STRAVA_TOKEN_URL,
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: expect.any(URLSearchParams),
        }),
      );

      const rows = await database.select().from(testSchema.stravaTokens);

      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        athleteId: tokenFixture.athlete.id,
        accessToken: tokenFixture.access_token,
        refreshToken: tokenFixture.refresh_token,
        expiresAt: tokenFixture.expires_at,
        scope: "read,activity:read_all",
      });

      const statusResult = await getStravaConnectionStatus(
        database,
        tokenFixture.expires_at - 1,
      );

      expect(statusResult).toMatchObject({
        connected: true,
        athleteId: tokenFixture.athlete.id,
        scope: "read,activity:read_all",
        expiresAt: tokenFixture.expires_at,
        expired: false,
      });

      fetchMock.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ...tokenFixture,
            access_token: "access-token-002",
            refresh_token: "refresh-token-002",
            expires_at: tokenFixture.expires_at + 3600,
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          },
        ),
      );

      const secondStatus = await handleStravaCallback({
        requestUrl:
          "http://localhost:3000/api/strava/callback?code=test-code-2&scope=read,activity:read_all&state=state-123",
        config: TEST_CONFIG,
        database,
        expectedState: "state-123",
        fetchImplementation: fetchMock,
      });

      expect(secondStatus).toBe("connected");

      const updatedRows = await database
        .select()
        .from(testSchema.stravaTokens)
        .where(eq(testSchema.stravaTokens.athleteId, tokenFixture.athlete.id));

      expect(updatedRows).toHaveLength(1);
      expect(updatedRows[0]?.accessToken).toBe("access-token-002");
      expect(updatedRows[0]?.refreshToken).toBe("refresh-token-002");
    } finally {
      sqlite.close();
    }
  });

  it("replaces the previous token row when a different Strava athlete connects", async () => {
    const { database, sqlite } = createTestDatabase();
    const replacementFixture: StravaTokenExchangeResponse = {
      ...tokenFixture,
      access_token: "access-token-003",
      refresh_token: "refresh-token-003",
      expires_at: tokenFixture.expires_at + 7200,
      athlete: {
        id: 525252,
      },
    };
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(tokenFixture), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(replacementFixture), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }),
      );

    try {
      await handleStravaCallback({
        requestUrl:
          "http://localhost:3000/api/strava/callback?code=test-code-1&scope=read,activity:read_all&state=state-123",
        config: TEST_CONFIG,
        database,
        expectedState: "state-123",
        fetchImplementation: fetchMock,
      });

      const replacementStatus = await handleStravaCallback({
        requestUrl:
          "http://localhost:3000/api/strava/callback?code=test-code-2&scope=read,activity:read_all&state=state-123",
        config: TEST_CONFIG,
        database,
        expectedState: "state-123",
        fetchImplementation: fetchMock,
      });

      expect(replacementStatus).toBe("connected");

      const rows = await database.select().from(testSchema.stravaTokens);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        athleteId: replacementFixture.athlete.id,
        accessToken: replacementFixture.access_token,
        refreshToken: replacementFixture.refresh_token,
        expiresAt: replacementFixture.expires_at,
        scope: "read,activity:read_all",
      });

      const currentStatus = await getStravaConnectionStatus(
        database,
        replacementFixture.expires_at - 1,
      );
      expect(currentStatus).toMatchObject({
        connected: true,
        athleteId: replacementFixture.athlete.id,
        scope: "read,activity:read_all",
        expiresAt: replacementFixture.expires_at,
        expired: false,
      });
    } finally {
      sqlite.close();
    }
  });

  it("returns missing_code when the callback is missing a code", async () => {
    const { database, sqlite } = createTestDatabase();

    try {
      const status = await handleStravaCallback({
        requestUrl: "http://localhost:3000/api/strava/callback",
        config: TEST_CONFIG,
        database,
        expectedState: "state-123",
        fetchImplementation: vi.fn<typeof fetch>(),
      });

      expect(status).toBe("missing_code");
    } finally {
      sqlite.close();
    }
  });

  it("returns access_denied and skips token exchange when Strava denies the OAuth request", async () => {
    const { database, sqlite } = createTestDatabase();
    const fetchMock = vi.fn<typeof fetch>();

    try {
      const status = await handleStravaCallback({
        requestUrl:
          "http://localhost:3000/api/strava/callback?error=access_denied&code=ignored-code&scope=read,activity:read_all&state=state-123",
        config: TEST_CONFIG,
        database,
        expectedState: "state-123",
        fetchImplementation: fetchMock,
      });

      expect(status).toBe("access_denied");
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      sqlite.close();
    }
  });

  it("returns missing_scope when required scopes are missing or omitted", async () => {
    const { database, sqlite } = createTestDatabase();
    const fetchMock = vi.fn<typeof fetch>();

    try {
      const missingScopeStatus = await handleStravaCallback({
        requestUrl:
          "http://localhost:3000/api/strava/callback?code=test-code&scope=read&state=state-123",
        config: TEST_CONFIG,
        database,
        expectedState: "state-123",
        fetchImplementation: fetchMock,
      });

      const omittedScopeStatus = await handleStravaCallback({
        requestUrl:
          "http://localhost:3000/api/strava/callback?code=test-code&state=state-123",
        config: TEST_CONFIG,
        database,
        expectedState: "state-123",
        fetchImplementation: fetchMock,
      });

      expect(missingScopeStatus).toBe("missing_scope");
      expect(omittedScopeStatus).toBe("missing_scope");
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      sqlite.close();
    }
  });

  it("returns invalid_state when the callback state is missing or wrong", async () => {
    const { database, sqlite } = createTestDatabase();

    try {
      const wrongStateStatus = await handleStravaCallback({
        requestUrl:
          "http://localhost:3000/api/strava/callback?code=test-code&scope=read,activity:read_all&state=wrong-state",
        config: TEST_CONFIG,
        database,
        expectedState: "state-123",
        fetchImplementation: vi.fn<typeof fetch>(),
      });

      const missingStateStatus = await handleStravaCallback({
        requestUrl:
          "http://localhost:3000/api/strava/callback?code=test-code&scope=read,activity:read_all",
        config: TEST_CONFIG,
        database,
        expectedState: "state-123",
        fetchImplementation: vi.fn<typeof fetch>(),
      });

      expect(wrongStateStatus).toBe("invalid_state");
      expect(missingStateStatus).toBe("invalid_state");
    } finally {
      sqlite.close();
    }
  });

  it("returns exchange_failed when token exchange fails", async () => {
    const { database, sqlite } = createTestDatabase();
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ message: "bad_request" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    try {
      const errorLogger = vi.fn();
      const status = await handleStravaCallback({
        requestUrl:
          "http://localhost:3000/api/strava/callback?code=test-code&scope=read,activity:read_all&state=state-123",
        config: TEST_CONFIG,
        database,
        expectedState: "state-123",
        fetchImplementation: fetchMock,
        errorLogger,
      });

      expect(status).toBe("exchange_failed");
      expect(errorLogger).toHaveBeenCalledTimes(1);
      expect(errorLogger.mock.calls[0]?.[0]).toContain(
        "Strava token exchange failed",
      );
    } finally {
      sqlite.close();
    }
  });

  it("returns storage_failed when writing the token row fails", async () => {
    const { database, sqlite } = createTestDatabase();
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(tokenFixture), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    sqlite.exec("DROP TABLE strava_tokens;");

    try {
      const errorLogger = vi.fn();
      const status = await handleStravaCallback({
        requestUrl:
          "http://localhost:3000/api/strava/callback?code=test-code&scope=read,activity:read_all&state=state-123",
        config: TEST_CONFIG,
        database,
        expectedState: "state-123",
        fetchImplementation: fetchMock,
        errorLogger,
      });

      expect(status).toBe("storage_failed");
      expect(errorLogger).toHaveBeenCalledTimes(1);
      expect(errorLogger.mock.calls[0]?.[0]).toContain(
        "Strava token storage failed",
      );
    } finally {
      sqlite.close();
    }
  });

  it("reports disconnected when no token row exists", async () => {
    const { database, sqlite } = createTestDatabase();

    try {
      const status = await getStravaConnectionStatus(database);

      expect(status).toEqual({
        connected: false,
        athleteId: null,
        scope: null,
        expiresAt: null,
        expired: false,
        updatedAt: null,
      });
    } finally {
      sqlite.close();
    }
  });
});

function createTestDatabase(): {
  database: FarSygilDatabase;
  sqlite: Database.Database;
} {
  const sqlite = new Database(":memory:");
  sqlite.exec(COMMITTED_MIGRATIONS);

  return {
    database: drizzle(sqlite, {
      schema: testSchema,
    }) as FarSygilDatabase,
    sqlite,
  };
}

function readFixture(fileName: string): string {
  return readFileSync(
    new URL(`../fixtures/strava/${fileName}`, import.meta.url),
    "utf8",
  );
}

function readCommittedMigrations(): string {
  const migrationsDirectory = new URL("../../drizzle/", import.meta.url);
  const migrationFileNames = readdirSync(migrationsDirectory)
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort();

  if (migrationFileNames.length === 0) {
    throw new Error("No committed Drizzle SQL migrations were found in drizzle/.");
  }

  return migrationFileNames
    .map((fileName) =>
      readFileSync(new URL(fileName, migrationsDirectory), "utf8"),
    )
    .join("\n");
}
