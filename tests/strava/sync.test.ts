import { readdirSync, readFileSync } from "node:fs";
import Database from "better-sqlite3";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as testSchema from "../../src/db/schema";
import { STRAVA_ACTIVITIES_URL } from "../../src/server/strava/constants";
import type { FarSygilDatabase, StravaOAuthConfig } from "../../src/server/strava/oauth";
import { StravaSyncError, syncStravaActivities } from "../../src/server/strava/sync";

const TEST_CONFIG: StravaOAuthConfig = {
  clientId: "12345",
  clientSecret: "secret-value",
  redirectUri: "http://localhost:3000/api/strava/callback",
};

const pageOneFixture = JSON.parse(
  readFixture("activities-page-1.json"),
) as Array<Record<string, unknown>>;
const pageTwoFixture = JSON.parse(
  readFixture("activities-page-2.json"),
) as Array<Record<string, unknown>>;
const emptyPageFixture = JSON.parse(
  readFixture("activities-page-empty.json"),
) as Array<Record<string, unknown>>;
const COMMITTED_MIGRATIONS = readCommittedMigrations();

describe("Strava sync", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("imports paginated Strava activity summaries into the local archive and logs the run", async () => {
    const { database, sqlite } = createTestDatabase();
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse(pageOneFixture))
      .mockResolvedValueOnce(jsonResponse(pageTwoFixture))
      .mockResolvedValueOnce(jsonResponse(emptyPageFixture));

    try {
      await insertStoredToken(database);

      const result = await syncStravaActivities({
        database,
        config: TEST_CONFIG,
        fetchImplementation: fetchMock,
        nowUnix: 1767222000,
      });

      expect(result).toEqual({
        mode: "initial",
        afterUnix: null,
        activitiesFetched: 3,
        activitiesAdded: 3,
        activitiesUpdated: 0,
        pagesFetched: 2,
      });
      expect(fetchMock).toHaveBeenCalledTimes(3);

      const firstUrl = new URL(fetchMock.mock.calls[0]?.[0] as string);
      expect(firstUrl.origin + firstUrl.pathname).toBe(STRAVA_ACTIVITIES_URL);
      expect(firstUrl.searchParams.get("page")).toBe("1");
      expect(firstUrl.searchParams.get("per_page")).toBe("200");
      expect(firstUrl.searchParams.has("after")).toBe(false);

      const secondUrl = new URL(fetchMock.mock.calls[1]?.[0] as string);
      expect(secondUrl.searchParams.get("page")).toBe("2");

      const thirdUrl = new URL(fetchMock.mock.calls[2]?.[0] as string);
      expect(thirdUrl.searchParams.get("page")).toBe("3");

      const rows = await database
        .select()
        .from(testSchema.activities)
        .orderBy(testSchema.activities.stravaId);

      expect(rows).toHaveLength(3);
      expect(rows[0]).toMatchObject({
        stravaId: 1001,
        name: "Morning Run",
        sportType: "Run",
        distanceMeters: 16093.4,
        movingTimeSeconds: 4120,
        totalElevationGain: 182.4,
        averageHeartrate: 154.2,
        startLatitude: 38.2527,
        startLongitude: -85.7585,
        mapPolyline: "abcd1234",
        source: "strava",
      });
      expect(rows[1]).toMatchObject({
        stravaId: 1002,
        sportType: "VirtualRide",
        distanceMeters: null,
        averageWatts: 208.4,
      });

      const rawRows = await database
        .select()
        .from(testSchema.activityRawJson)
        .orderBy(testSchema.activityRawJson.stravaId);
      expect(rawRows).toHaveLength(3);
      expect(rawRows[0]).toMatchObject({
        stravaId: 1001,
        payloadType: "summary_activity",
      });

      const logRows = await database
        .select()
        .from(testSchema.dataImportLogs)
        .orderBy(testSchema.dataImportLogs.id);
      expect(logRows).toHaveLength(2);
      expect(logRows[0]).toMatchObject({
        source: "strava",
        eventType: "sync_start",
        message: "Strava initial sync started.",
      });
      expect(logRows[1]).toMatchObject({
        source: "strava",
        eventType: "sync_complete",
        message: "Strava initial sync completed.",
        activitiesAdded: 3,
        activitiesUpdated: 0,
      });
    } finally {
      sqlite.close();
    }
  });

  it("uses the latest local Strava timestamp for incremental sync and updates existing rows", async () => {
    const { database, sqlite } = createTestDatabase();
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse(pageOneFixture))
      .mockResolvedValueOnce(jsonResponse(emptyPageFixture));

    try {
      await insertStoredToken(database);
      await database.insert(testSchema.activities).values({
        stravaId: 1001,
        name: "Old Morning Run",
        sportType: "Run",
        startDate: "2026-05-01T00:00:00Z",
        source: "strava",
      });

      const result = await syncStravaActivities({
        database,
        config: TEST_CONFIG,
        fetchImplementation: fetchMock,
        nowUnix: 1767222000,
      });

      expect(result).toEqual({
        mode: "incremental",
        afterUnix: Math.floor(Date.parse("2026-05-01T00:00:00Z") / 1000),
        activitiesFetched: 2,
        activitiesAdded: 1,
        activitiesUpdated: 1,
        pagesFetched: 1,
      });

      const requestUrl = new URL(fetchMock.mock.calls[0]?.[0] as string);
      expect(requestUrl.searchParams.get("after")).toBe(
        String(Math.floor(Date.parse("2026-05-01T00:00:00Z") / 1000)),
      );

      const updatedActivity = await database
        .select()
        .from(testSchema.activities)
        .where(eq(testSchema.activities.stravaId, 1001));
      expect(updatedActivity[0]).toMatchObject({
        name: "Morning Run",
        distanceMeters: 16093.4,
      });

      const rows = await database.select().from(testSchema.activities);
      expect(rows).toHaveLength(2);
    } finally {
      sqlite.close();
    }
  });

  it("fails cleanly when no stored Strava connection exists", async () => {
    const { database, sqlite } = createTestDatabase();
    const fetchMock = vi.fn<typeof fetch>();

    try {
      await expect(
        syncStravaActivities({
          database,
          config: TEST_CONFIG,
          fetchImplementation: fetchMock,
        }),
      ).rejects.toMatchObject({
        name: "StravaSyncError",
        code: "not_connected",
      } satisfies Partial<StravaSyncError>);

      expect(fetchMock).not.toHaveBeenCalled();

      const logRows = await database.select().from(testSchema.dataImportLogs);
      expect(logRows).toHaveLength(1);
      expect(logRows[0]).toMatchObject({
        eventType: "sync_error",
        errorsCount: 1,
      });
    } finally {
      sqlite.close();
    }
  });

  it("records a sync error when Strava returns an invalid activities payload", async () => {
    const { database, sqlite } = createTestDatabase();
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({ message: "not an array" }),
    );

    try {
      await insertStoredToken(database);

      await expect(
        syncStravaActivities({
          database,
          config: TEST_CONFIG,
          fetchImplementation: fetchMock,
          nowUnix: 1767222000,
        }),
      ).rejects.toMatchObject({
        name: "StravaSyncError",
        code: "invalid_response",
      } satisfies Partial<StravaSyncError>);

      const activityRows = await database.select().from(testSchema.activities);
      expect(activityRows).toHaveLength(0);

      const logRows = await database
        .select()
        .from(testSchema.dataImportLogs)
        .orderBy(testSchema.dataImportLogs.id);
      expect(logRows).toHaveLength(2);
      expect(logRows[0]?.eventType).toBe("sync_start");
      expect(logRows[1]).toMatchObject({
        eventType: "sync_error",
        errorsCount: 1,
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

async function insertStoredToken(database: FarSygilDatabase): Promise<void> {
  await database.insert(testSchema.stravaTokens).values({
    athleteId: 424242,
    accessToken: "access-token-001",
    refreshToken: "refresh-token-001",
    expiresAt: 1767230000,
    scope: "read,activity:read_all",
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
