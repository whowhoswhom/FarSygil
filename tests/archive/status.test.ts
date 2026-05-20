import { readdirSync, readFileSync } from "node:fs";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { describe, expect, it } from "vitest";

import * as testSchema from "../../src/db/schema";
import { getArchiveStatusSnapshot } from "../../src/server/archive/status";
import type { FarSygilDatabase } from "../../src/server/strava/oauth";

const COMMITTED_MIGRATIONS = readCommittedMigrations();

describe("archive status snapshot", () => {
  it("reads local provenance counts, latest timestamps, and detail coverage", async () => {
    const { database, sqlite } = createTestDatabase();

    try {
      await database.insert(testSchema.activities).values([
        {
          stravaId: 7001,
          source: "strava",
          sportType: "Run",
          name: "Detailed Run",
          startDate: "2026-05-10T12:00:00.000Z",
          updatedAt: "2026-05-11 10:00:00",
        },
        {
          stravaId: 7002,
          source: "strava",
          sportType: "TrailRun",
          name: "Stream Run",
          startDate: "2026-05-11T12:00:00.000Z",
          updatedAt: "2026-05-11 11:00:00",
        },
        {
          source: "manual",
          sportType: "Run",
          name: "Manual Run",
          startDate: "2026-05-12T12:00:00.000Z",
          updatedAt: "2026-05-11 12:00:00",
        },
      ]);

      await database.insert(testSchema.activityRawJson).values([
        {
          stravaId: 7001,
          payloadType: "detailed_activity",
          rawJson: "{}",
          fetchedAt: "2026-05-12 08:00:00",
        },
        {
          stravaId: 7001,
          payloadType: "streams",
          rawJson: "{}",
          fetchedAt: "2026-05-12 08:01:00",
        },
        {
          stravaId: 7002,
          payloadType: "streams",
          rawJson: "{}",
          fetchedAt: "2026-05-12 08:02:00",
        },
      ]);

      await database.insert(testSchema.healthMetrics).values([
        {
          date: "2026-05-12",
          metricType: "hrv",
          value: 55,
          unit: "ms",
          source: "AppleHealth",
          createdAt: "2026-05-13 09:00:00",
        },
        {
          date: "2026-05-13",
          metricType: "resting_hr",
          value: 58,
          unit: "bpm",
          source: "AppleHealth",
          createdAt: "2026-05-13 10:00:00",
        },
      ]);

      await database.insert(testSchema.healthRawImports).values({
        filename: "export.xml",
        importedAt: "2026-05-14 07:00:00",
        recordCount: 200,
      });

      await database.insert(testSchema.trainingLoad).values([
        {
          date: "2026-05-14",
          dailyTrainingStress: 44,
          updatedAt: "2026-05-15 10:00:00",
        },
        {
          date: "2026-05-15",
          dailyTrainingStress: 52,
          updatedAt: "2026-05-16 10:00:00",
        },
      ]);

      await database.insert(testSchema.dataImportLogs).values([
        {
          source: "strava",
          eventType: "sync_complete",
          message: "Synced",
          startedAt: "2026-05-12 06:00:00",
          completedAt: "2026-05-12 06:05:00",
        },
        {
          source: "apple_health",
          eventType: "sync_complete",
          message: "Imported",
          startedAt: "2026-05-14 07:00:00",
          completedAt: "2026-05-14 07:05:00",
        },
      ]);

      const snapshot = await getArchiveStatusSnapshot(database, {
        databasePath: "C:\\data\\running.db",
      });

      expect(snapshot).toEqual({
        databasePath: "C:\\data\\running.db",
        counts: {
          activities: 3,
          stravaActivities: 2,
          healthMetricRows: 2,
          trainingLoadRows: 2,
        },
        latest: {
          stravaSyncAt: "2026-05-12 06:05:00",
          appleHealthImportAt: "2026-05-14 07:00:00",
          latestHealthMetricDate: "2026-05-13",
          latestDailyStressDate: "2026-05-15",
          latestLocalWriteAt: "2026-05-16 10:00:00",
        },
        coverage: {
          totalStravaActivities: 2,
          detailedActivities: 1,
          streamActivities: 2,
          detailCoveragePercent: 50,
          streamCoveragePercent: 100,
        },
      });
    } finally {
      sqlite.close();
    }
  });

  it("returns honest empty provenance for an empty archive", async () => {
    const { database, sqlite } = createTestDatabase();

    try {
      const snapshot = await getArchiveStatusSnapshot(database);

      expect(snapshot).toEqual({
        databasePath: null,
        counts: {
          activities: 0,
          stravaActivities: 0,
          healthMetricRows: 0,
          trainingLoadRows: 0,
        },
        latest: {
          stravaSyncAt: null,
          appleHealthImportAt: null,
          latestHealthMetricDate: null,
          latestDailyStressDate: null,
          latestLocalWriteAt: null,
        },
        coverage: {
          totalStravaActivities: 0,
          detailedActivities: 0,
          streamActivities: 0,
          detailCoveragePercent: null,
          streamCoveragePercent: null,
        },
      });
    } finally {
      sqlite.close();
    }
  });

  it("reports zero-percent coverage when Strava activities have no raw payloads", async () => {
    const { database, sqlite } = createTestDatabase();

    try {
      await database.insert(testSchema.activities).values([
        {
          stravaId: 7101,
          source: "strava",
          sportType: "Run",
          name: "Summary Only One",
          startDate: "2026-05-10T12:00:00.000Z",
        },
        {
          stravaId: 7102,
          source: "strava",
          sportType: "Run",
          name: "Summary Only Two",
          startDate: "2026-05-11T12:00:00.000Z",
        },
      ]);

      const snapshot = await getArchiveStatusSnapshot(database);

      expect(snapshot.coverage).toEqual({
        totalStravaActivities: 2,
        detailedActivities: 0,
        streamActivities: 0,
        detailCoveragePercent: 0,
        streamCoveragePercent: 0,
      });
    } finally {
      sqlite.close();
    }
  });

  it("keeps coverage percentages null when only manual activities exist", async () => {
    const { database, sqlite } = createTestDatabase();

    try {
      await database.insert(testSchema.activities).values({
        source: "manual",
        sportType: "Run",
        name: "Manual Only",
        startDate: "2026-05-10T12:00:00.000Z",
      });

      const snapshot = await getArchiveStatusSnapshot(database);

      expect(snapshot.counts).toMatchObject({
        activities: 1,
        stravaActivities: 0,
      });
      expect(snapshot.coverage).toEqual({
        totalStravaActivities: 0,
        detailedActivities: 0,
        streamActivities: 0,
        detailCoveragePercent: null,
        streamCoveragePercent: null,
      });
    } finally {
      sqlite.close();
    }
  });

  it("derives latest local write when only health and load rows exist", async () => {
    const { database, sqlite } = createTestDatabase();

    try {
      await database.insert(testSchema.healthMetrics).values({
        date: "2026-05-12",
        metricType: "hrv",
        value: 55,
        source: "AppleHealth",
        createdAt: "2026-05-13 09:00:00",
      });
      await database.insert(testSchema.trainingLoad).values({
        date: "2026-05-13",
        dailyTrainingStress: 42,
        updatedAt: "2026-05-14 09:00:00",
      });

      const snapshot = await getArchiveStatusSnapshot(database);

      expect(snapshot.latest.latestLocalWriteAt).toBe("2026-05-14 09:00:00");
      expect(snapshot.latest.latestHealthMetricDate).toBe("2026-05-12");
      expect(snapshot.latest.latestDailyStressDate).toBe("2026-05-13");
    } finally {
      sqlite.close();
    }
  });

  it("skips invalid latest timestamps when another local write is valid", async () => {
    const { database, sqlite } = createTestDatabase();

    try {
      await database.insert(testSchema.healthMetrics).values({
        date: "2026-05-12",
        metricType: "resting_hr",
        value: 58,
        source: "AppleHealth",
        createdAt: "2026-05-13 09:00:00",
      });
      await database.insert(testSchema.dataImportLogs).values({
        source: "strava",
        eventType: "sync_complete",
        message: "Bad timestamp",
        startedAt: "2026-05-14 09:00:00",
        completedAt: "not-a-date",
      });

      const snapshot = await getArchiveStatusSnapshot(database);

      expect(snapshot.latest.stravaSyncAt).toBe("not-a-date");
      expect(snapshot.latest.latestLocalWriteAt).toBe("2026-05-13 09:00:00");
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
