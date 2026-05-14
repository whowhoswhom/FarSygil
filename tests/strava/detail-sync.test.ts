import { readdirSync, readFileSync } from "node:fs";

import Database from "better-sqlite3";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { afterEach, describe, expect, it, vi } from "vitest";

import * as testSchema from "../../src/db/schema";
import {
  STRAVA_ACTIVITY_URL_BASE,
  STRAVA_DETAIL_STREAM_KEYS,
} from "../../src/server/strava/constants";
import type {
  FarSygilDatabase,
  StravaOAuthConfig,
} from "../../src/server/strava/oauth";
import {
  StravaDetailSyncError,
  syncStravaActivityDetails,
} from "../../src/server/strava/detail-sync";

const TEST_CONFIG: StravaOAuthConfig = {
  clientId: "12345",
  clientSecret: "secret-value",
  redirectUri: "http://localhost:3000/api/strava/callback",
};

const detailFixture = JSON.parse(
  readFixture("activity-detail-1001.json"),
) as Record<string, unknown>;
const streamsFixture = JSON.parse(
  readFixture("activity-streams-1001.json"),
) as Record<string, unknown>;
const COMMITTED_MIGRATIONS = readCommittedMigrations();

describe("Strava detail sync", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writes detailed activity payloads, splits, streams, and sync logs", async () => {
    const { database, sqlite } = createTestDatabase();
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse(detailFixture))
      .mockResolvedValueOnce(jsonResponse(streamsFixture));

    try {
      await insertStoredToken(database);
      await insertSummaryActivity(database, 1001);

      const result = await syncStravaActivityDetails({
        database,
        config: TEST_CONFIG,
        fetchImplementation: fetchMock,
        sleepImplementation: async () => undefined,
        nowUnix: 1767222000,
      });

      expect(result).toEqual({
        mode: "incremental",
        activitiesScanned: 1,
        activitiesSynced: 1,
        detailsFetched: 1,
        streamsFetched: 1,
        splitsWritten: 2,
        streamsWritten: STRAVA_DETAIL_STREAM_KEYS.length,
        rateLimitRetries: 0,
      });

      const detailUrl = fetchMock.mock.calls[0]?.[0] as string;
      expect(detailUrl).toBe(`${STRAVA_ACTIVITY_URL_BASE}/1001`);

      const streamsUrl = new URL(fetchMock.mock.calls[1]?.[0] as string);
      expect(streamsUrl.origin + streamsUrl.pathname).toBe(
        `${STRAVA_ACTIVITY_URL_BASE}/1001/streams`,
      );
      expect(streamsUrl.searchParams.get("key_by_type")).toBe("true");
      expect(streamsUrl.searchParams.get("keys")).toBe(
        STRAVA_DETAIL_STREAM_KEYS.join(","),
      );

      const rawRows = await database
        .select({
          payloadType: testSchema.activityRawJson.payloadType,
        })
        .from(testSchema.activityRawJson)
        .where(eq(testSchema.activityRawJson.stravaId, 1001));
      expect(rawRows).toEqual(
        expect.arrayContaining([
          { payloadType: "detailed_activity" },
          { payloadType: "streams" },
        ]),
      );

      const splitRows = await database
        .select()
        .from(testSchema.activitySplits)
        .orderBy(testSchema.activitySplits.splitIndex);
      expect(splitRows).toHaveLength(2);
      expect(splitRows[0]).toMatchObject({
        splitIndex: 1,
        distanceMeters: 1609.344,
        averageHeartrate: 148.4,
      });

      const streamRows = await database
        .select()
        .from(testSchema.activityStreams)
        .where(eq(testSchema.activityStreams.activityId, 1));
      expect(streamRows).toHaveLength(STRAVA_DETAIL_STREAM_KEYS.length);

      const logRows = await database
        .select()
        .from(testSchema.dataImportLogs)
        .orderBy(testSchema.dataImportLogs.id);
      expect(logRows).toHaveLength(2);
      expect(logRows[0]?.message).toContain("detail sync started");
      expect(logRows[1]?.message).toContain("detail sync completed");
      expect(logRows[1]?.activitiesUpdated).toBe(1);
    } finally {
      sqlite.close();
    }
  });

  it("skips activities that already have detail and stream payloads during incremental sync", async () => {
    const { database, sqlite } = createTestDatabase();
    const fetchMock = vi.fn<typeof fetch>();

    try {
      await insertStoredToken(database);
      await insertSummaryActivity(database, 1001);
      await database.insert(testSchema.activityRawJson).values([
        {
          stravaId: 1001,
          payloadType: "detailed_activity",
          rawJson: JSON.stringify(detailFixture),
        },
        {
          stravaId: 1001,
          payloadType: "streams",
          rawJson: JSON.stringify(streamsFixture),
        },
      ]);

      const result = await syncStravaActivityDetails({
        database,
        config: TEST_CONFIG,
        fetchImplementation: fetchMock,
        sleepImplementation: async () => undefined,
      });

      expect(result).toEqual({
        mode: "incremental",
        activitiesScanned: 0,
        activitiesSynced: 0,
        detailsFetched: 0,
        streamsFetched: 0,
        splitsWritten: 0,
        streamsWritten: 0,
        rateLimitRetries: 0,
      });
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      sqlite.close();
    }
  });

  it("retries rate-limited detail requests and supports full mode", async () => {
    const { database, sqlite } = createTestDatabase();
    const sleepMock = vi.fn(async () => undefined);
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response("{}", {
          status: 429,
          headers: {
            "Retry-After": "0",
          },
        }),
      )
      .mockResolvedValueOnce(jsonResponse(detailFixture))
      .mockResolvedValueOnce(jsonResponse(streamsFixture));

    try {
      await insertStoredToken(database);
      await insertSummaryActivity(database, 1001);
      await database.insert(testSchema.activityRawJson).values([
        {
          stravaId: 1001,
          payloadType: "detailed_activity",
          rawJson: JSON.stringify(detailFixture),
        },
        {
          stravaId: 1001,
          payloadType: "streams",
          rawJson: JSON.stringify(streamsFixture),
        },
      ]);

      const result = await syncStravaActivityDetails({
        database,
        config: TEST_CONFIG,
        mode: "full",
        fetchImplementation: fetchMock,
        sleepImplementation: sleepMock,
      });

      expect(result.mode).toBe("full");
      expect(result.activitiesScanned).toBe(1);
      expect(result.activitiesSynced).toBe(1);
      expect(result.rateLimitRetries).toBe(1);
      expect(sleepMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledTimes(3);
    } finally {
      sqlite.close();
    }
  });

  it("records an error when Strava streams return invalid JSON", async () => {
    const { database, sqlite } = createTestDatabase();
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse(detailFixture))
      .mockResolvedValueOnce(
        new Response("{", {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }),
      );

    try {
      await insertStoredToken(database);
      await insertSummaryActivity(database, 1001);

      await expect(
        syncStravaActivityDetails({
          database,
          config: TEST_CONFIG,
          fetchImplementation: fetchMock,
          sleepImplementation: async () => undefined,
        }),
      ).rejects.toMatchObject({
        name: "StravaDetailSyncError",
        code: "invalid_response",
      } satisfies Partial<StravaDetailSyncError>);

      const streamRows = await database.select().from(testSchema.activityStreams);
      expect(streamRows).toHaveLength(0);

      const logRows = await database
        .select()
        .from(testSchema.dataImportLogs)
        .orderBy(testSchema.dataImportLogs.id);
      expect(logRows).toHaveLength(2);
      expect(logRows[1]?.eventType).toBe("sync_error");
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

async function insertStoredToken(database: FarSygilDatabase): Promise<void> {
  await database.insert(testSchema.stravaTokens).values({
    athleteId: 424242,
    accessToken: "access-token-001",
    refreshToken: "refresh-token-001",
    expiresAt: 2_080_000_000,
    scope: "read,activity:read_all",
  });
}

async function insertSummaryActivity(
  database: FarSygilDatabase,
  stravaId: number,
): Promise<void> {
  await database.insert(testSchema.activities).values({
    id: 1,
    stravaId,
    name: "Morning Run",
    sportType: "Run",
    startDate: "2026-05-06T11:30:00Z",
    startDateLocal: "2026-05-06T07:30:00Z",
    distanceMeters: 16093.4,
    movingTimeSeconds: 4120,
    source: "strava",
  });
}

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
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
