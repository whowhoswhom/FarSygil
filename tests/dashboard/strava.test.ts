import { readdirSync, readFileSync } from "node:fs";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { describe, expect, it } from "vitest";

import * as testSchema from "../../src/db/schema";
import {
  getDashboardHeaderSnapshot,
  getDashboardRunningSnapshot,
} from "../../src/server/dashboard/strava";
import { metersToFeet, metersToMiles } from "../../src/lib/units";
import type { FarSygilDatabase } from "../../src/server/strava/oauth";

const COMMITTED_MIGRATIONS = readCommittedMigrations();

describe("dashboard Strava snapshots", () => {
  it("reads connected header state and the latest successful sync timestamp", async () => {
    const { database, sqlite } = createTestDatabase();

    try {
      await database.insert(testSchema.stravaTokens).values({
        athleteId: 42,
        accessToken: "access-token",
        refreshToken: "refresh-token",
        expiresAt: 1_900_000_000,
        scope: "read,activity:read_all",
      });

      await database.insert(testSchema.dataImportLogs).values([
        {
          source: "strava",
          eventType: "sync_start",
          message: "Started",
        },
        {
          source: "strava",
          eventType: "sync_complete",
          message: "Completed",
          completedAt: "2026-05-13 14:20:00",
        },
        {
          source: "strava",
          eventType: "sync_error",
          message: "Errored",
          errorsCount: 1,
        },
      ]);

      const snapshot = await getDashboardHeaderSnapshot(
        database,
        1_800_000_000,
      );

      expect(snapshot).toEqual({
        statusLabel: "Strava connected",
        statusState: "connected",
        lastSyncedAt: "2026-05-13 14:20:00",
        autoSyncBlockedUntil: null,
        autoSyncBlockedReason: null,
      });
    } finally {
      sqlite.close();
    }
  });

  it("reads disconnected header state when no stored token exists", async () => {
    const { database, sqlite } = createTestDatabase();

    try {
      await database.insert(testSchema.dataImportLogs).values({
        source: "strava",
        eventType: "sync_complete",
        message: "Completed",
        completedAt: "2026-05-12 10:00:00",
      });

      const snapshot = await getDashboardHeaderSnapshot(database);

      expect(snapshot).toEqual({
        statusLabel: "Strava not connected",
        statusState: "disconnected",
        lastSyncedAt: "2026-05-12 10:00:00",
        autoSyncBlockedUntil: null,
        autoSyncBlockedReason: null,
      });
    } finally {
      sqlite.close();
    }
  });

  it("keeps an expired access token visually connected because sync can refresh it", async () => {
    const { database, sqlite } = createTestDatabase();

    try {
      await database.insert(testSchema.stravaTokens).values({
        athleteId: 42,
        accessToken: "expired-access-token",
        refreshToken: "refresh-token",
        expiresAt: 1_700_000_000,
        scope: "read,activity:read_all",
      });

      const snapshot = await getDashboardHeaderSnapshot(
        database,
        1_800_000_000,
      );

      expect(snapshot).toEqual({
        statusLabel: "Strava connected",
        statusState: "connected",
        lastSyncedAt: null,
        autoSyncBlockedUntil: null,
        autoSyncBlockedReason: null,
      });
    } finally {
      sqlite.close();
    }
  });

  it("blocks app-shell auto sync after a newer Strava rate-limit error", async () => {
    const { database, sqlite } = createTestDatabase();

    try {
      await database.insert(testSchema.stravaTokens).values({
        athleteId: 42,
        accessToken: "access-token",
        refreshToken: "refresh-token",
        expiresAt: 1_900_000_000,
        scope: "read,activity:read_all",
      });

      await database.insert(testSchema.dataImportLogs).values([
        {
          source: "strava",
          eventType: "sync_complete",
          message: "Completed",
          completedAt: "2026-05-25 16:00:00",
        },
        {
          source: "strava",
          eventType: "sync_error",
          message: "Strava activities fetch failed (HTTP 429): Rate Limit Exceeded",
          errorsCount: 1,
          completedAt: "2026-05-25 16:30:00",
        },
      ]);

      const snapshot = await getDashboardHeaderSnapshot(
        database,
        Math.floor(Date.parse("2026-05-25T16:45:00Z") / 1000),
      );

      expect(snapshot).toMatchObject({
        statusLabel: "Strava connected",
        statusState: "connected",
        lastSyncedAt: "2026-05-25 16:00:00",
        autoSyncBlockedUntil: "2026-05-25T17:30:00.000Z",
        autoSyncBlockedReason: "Recent Strava rate-limit response",
      });
    } finally {
      sqlite.close();
    }
  });

  it("builds current-week running aggregates, trends, and recent-run summaries", async () => {
    const { database, sqlite } = createTestDatabase();

    try {
      await database.insert(testSchema.activities).values([
        {
          stravaId: 1001,
          source: "strava",
          sportType: "VirtualRun",
          name: "Monday Shakeout",
          startDate: "2026-05-11T12:00:00.000Z",
          startDateLocal: "2026-05-11T08:00:00.000-04:00",
          distanceMeters: 4_828.032,
          movingTimeSeconds: 1_620,
          totalElevationGain: 30.48,
        },
        {
          stravaId: 1002,
          source: "strava",
          sportType: "Run",
          name: "Tuesday Tempo",
          startDate: "2026-05-12T12:00:00.000Z",
          startDateLocal: "2026-05-12T08:00:00.000-04:00",
          distanceMeters: 16_093.44,
          movingTimeSeconds: 3_600,
          totalElevationGain: 304.8,
          averageCadence: 170,
          averageHeartrate: 150,
          averageWatts: 220,
        },
        {
          stravaId: 1003,
          source: "strava",
          sportType: "TrailRun",
          name: "Wednesday Hills",
          startDate: "2026-05-13T12:00:00.000Z",
          startDateLocal: "2026-05-13T08:00:00.000-04:00",
          distanceMeters: 8_046.72,
          movingTimeSeconds: 2_100,
          totalElevationGain: 152.4,
          averageCadence: 176,
          averageHeartrate: 158,
          averageWatts: 200,
        },
        {
          stravaId: 1004,
          source: "strava",
          sportType: "Ride",
          name: "Indoor Ride",
          startDate: "2026-05-13T13:00:00.000Z",
          startDateLocal: "2026-05-13T09:00:00.000-04:00",
          distanceMeters: 40_000,
          movingTimeSeconds: 3_600,
        },
        {
          stravaId: 1005,
          source: "strava",
          sportType: "Run",
          name: "Old Long Run",
          startDate: "2026-05-03T12:00:00.000Z",
          startDateLocal: "2026-05-03T08:00:00.000-04:00",
          distanceMeters: 24_140.16,
          movingTimeSeconds: 6_300,
          totalElevationGain: 365.76,
          averageCadence: 168,
          averageHeartrate: 148,
        },
      ]);

      const snapshot = await getDashboardRunningSnapshot(
        database,
        new Date("2026-05-13T12:00:00.000Z"),
      );

      expect(snapshot.weekStartDate).toBe("2026-05-11");
      expect(snapshot.weekEndDate).toBe("2026-05-17");
      expect(snapshot.runCount).toBe(3);
      expect(snapshot.totalDistanceMeters).toBeCloseTo(28_968.192, 3);
      expect(snapshot.totalMovingTimeSeconds).toBe(7_320);
      expect(snapshot.totalElevationGain).toBeCloseTo(487.68, 3);
      expect(snapshot.averagePaceSecondsPerMile).toBeCloseTo(406.667, 3);
      expect(snapshot.averageCadence).toBeCloseTo(172.211, 3);
      expect(snapshot.averageHeartrate).toBeCloseTo(152.947, 3);
      expect(snapshot.averagePowerWatts).toBeCloseTo(212.632, 3);
      expect(snapshot.distanceSeriesMiles).toEqual([3, 10, 5, 0, 0, 0, 0]);
      expect(snapshot.movingTimeSeriesMinutes).toEqual([27, 60, 35, 0, 0, 0, 0]);
      expect(snapshot.elevationSeriesFeet).toEqual([100, 1000, 500, 0, 0, 0, 0]);
      expect(snapshot.paceSeriesSecondsPerMile).toEqual([540, 360, 420]);
      expect(snapshot.cadenceSeries).toEqual([170, 176]);
      expect(snapshot.heartrateSeries).toEqual([150, 158]);
      expect(snapshot.powerSeries).toEqual([220, 200]);
      expect(snapshot.recentRun).toMatchObject({
        id: expect.any(Number),
        name: "Wednesday Hills",
        sportType: "TrailRun",
      });
      expect(snapshot.longestRun).toMatchObject({
        id: expect.any(Number),
        name: "Tuesday Tempo",
        distanceMeters: 16_093.44,
      });
      expect(metersToMiles(snapshot.totalDistanceMeters)).toBeCloseTo(18, 5);
      expect(metersToFeet(snapshot.totalElevationGain)).toBeCloseTo(1_600, 0);
    } finally {
      sqlite.close();
    }
  });

  it("returns honest zero/empty outputs when the current week has no runs", async () => {
    const { database, sqlite } = createTestDatabase();

    try {
      await database.insert(testSchema.activities).values({
        stravaId: 2001,
        source: "strava",
        sportType: "Run",
        name: "Previous Week Run",
        startDate: "2026-05-02T12:00:00.000Z",
        startDateLocal: "2026-05-02T08:00:00.000-04:00",
        distanceMeters: 8_046.72,
        movingTimeSeconds: 2_520,
      });

      const snapshot = await getDashboardRunningSnapshot(
        database,
        new Date("2026-05-13T12:00:00.000Z"),
      );

      expect(snapshot.runCount).toBe(0);
      expect(snapshot.totalDistanceMeters).toBe(0);
      expect(snapshot.totalMovingTimeSeconds).toBe(0);
      expect(snapshot.totalElevationGain).toBe(0);
      expect(snapshot.averagePaceSecondsPerMile).toBeNull();
      expect(snapshot.averageCadence).toBeNull();
      expect(snapshot.averageHeartrate).toBeNull();
      expect(snapshot.averagePowerWatts).toBeNull();
      expect(snapshot.distanceSeriesMiles).toEqual([]);
      expect(snapshot.movingTimeSeriesMinutes).toEqual([]);
      expect(snapshot.elevationSeriesFeet).toEqual([]);
      expect(snapshot.paceSeriesSecondsPerMile).toEqual([]);
      expect(snapshot.cadenceSeries).toEqual([]);
      expect(snapshot.heartrateSeries).toEqual([]);
      expect(snapshot.powerSeries).toEqual([]);
      expect(snapshot.recentRun).toMatchObject({
        name: "Previous Week Run",
      });
      expect(snapshot.longestRun).toBeNull();
    } finally {
      sqlite.close();
    }
  });

  it("weights weekly power only across runs with real watts", async () => {
    const { database, sqlite } = createTestDatabase();

    try {
      await database.insert(testSchema.activities).values([
        {
          stravaId: 3001,
          source: "strava",
          sportType: "Run",
          name: "Power Run",
          startDate: "2026-05-11T12:00:00.000Z",
          startDateLocal: "2026-05-11T08:00:00.000-04:00",
          movingTimeSeconds: 1800,
          averageWatts: 250,
        },
        {
          stravaId: 3002,
          source: "strava",
          sportType: "Run",
          name: "No Power Run",
          startDate: "2026-05-12T12:00:00.000Z",
          startDateLocal: "2026-05-12T08:00:00.000-04:00",
          movingTimeSeconds: 3600,
        },
      ]);

      const snapshot = await getDashboardRunningSnapshot(
        database,
        new Date("2026-05-13T12:00:00.000Z"),
      );

      expect(snapshot.averagePowerWatts).toBe(250);
      expect(snapshot.powerSeries).toEqual([]);
    } finally {
      sqlite.close();
    }
  });

  it("excludes zero-time power rows from weekly power", async () => {
    const { database, sqlite } = createTestDatabase();

    try {
      await database.insert(testSchema.activities).values({
        stravaId: 3101,
        source: "strava",
        sportType: "Run",
        name: "Zero Time Power",
        startDate: "2026-05-11T12:00:00.000Z",
        startDateLocal: "2026-05-11T08:00:00.000-04:00",
        movingTimeSeconds: 0,
        averageWatts: 300,
      });

      const snapshot = await getDashboardRunningSnapshot(
        database,
        new Date("2026-05-13T12:00:00.000Z"),
      );

      expect(snapshot.averagePowerWatts).toBeNull();
      expect(snapshot.powerSeries).toEqual([]);
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
