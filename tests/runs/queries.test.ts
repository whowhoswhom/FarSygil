import { readdirSync, readFileSync } from "node:fs";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { describe, expect, it } from "vitest";

import * as testSchema from "../../src/db/schema";
import type { FarSygilDatabase } from "../../src/server/strava/oauth";
import {
  getArchivedRuns,
  getRunDetailSnapshot,
  getRunsCount,
} from "../../src/server/runs/queries";

const COMMITTED_MIGRATIONS = readCommittedMigrations();

describe("run queries", () => {
  it("returns archived runs in descending order and filters non-run sports", async () => {
    const { database, sqlite } = createTestDatabase();

    try {
      await database.insert(testSchema.activities).values([
        {
          stravaId: 3001,
          source: "strava",
          sportType: "Run",
          name: "Latest Run",
          startDate: "2026-05-12T12:00:00.000Z",
          startDateLocal: "2026-05-12T08:00:00.000-04:00",
          distanceMeters: 16_093.44,
          movingTimeSeconds: 3_600,
          mapPolyline: "_p~iF~ps|U_ulLnnqC_mqNvxq`@",
        },
        {
          stravaId: 3002,
          source: "strava",
          sportType: "Ride",
          name: "Ignore Ride",
          startDate: "2026-05-13T12:00:00.000Z",
          startDateLocal: "2026-05-13T08:00:00.000-04:00",
          distanceMeters: 20_000,
          movingTimeSeconds: 3_000,
        },
        {
          stravaId: 3003,
          source: "strava",
          sportType: "TrailRun",
          name: "Older Trail Run",
          startDate: "2026-05-10T12:00:00.000Z",
          startDateLocal: "2026-05-10T08:00:00.000-04:00",
          distanceMeters: 8_046.72,
          movingTimeSeconds: 2_400,
        },
      ]);

      const runs = await getArchivedRuns(database);

      expect(runs).toHaveLength(2);
      expect(runs.map((run) => run.name)).toEqual([
        "Latest Run",
        "Older Trail Run",
      ]);
      expect(runs[0].routePathData).not.toBeNull();
    } finally {
      sqlite.close();
    }
  });

  it("returns detailed run data with splits and heartrate streams", async () => {
    const { database, sqlite } = createTestDatabase();

    try {
      const [activity] = await database
        .insert(testSchema.activities)
        .values({
          stravaId: 3101,
          source: "strava",
          sportType: "Run",
          name: "Long Run",
          startDate: "2026-05-12T12:00:00.000Z",
          startDateLocal: "2026-05-12T08:00:00.000-04:00",
          distanceMeters: 19_312.128,
          movingTimeSeconds: 5_400,
          totalElevationGain: 243.84,
          averageHeartrate: 149,
          mapPolyline: "_p~iF~ps|U_ulLnnqC_mqNvxq`@",
        })
        .returning({ id: testSchema.activities.id });

      await database.insert(testSchema.activitySplits).values([
        {
          activityId: activity.id,
          splitIndex: 1,
          distanceMeters: 1_609.344,
          movingTimeSeconds: 450,
          elevationDifference: 10,
          averageSpeed: 3.57632,
          averageHeartrate: 145,
        },
        {
          activityId: activity.id,
          splitIndex: 2,
          distanceMeters: 1_609.344,
          movingTimeSeconds: 465,
          elevationDifference: 12,
          averageSpeed: 3.4609548387096777,
          averageHeartrate: 148,
        },
      ]);

      await database.insert(testSchema.activityStreams).values({
        activityId: activity.id,
        streamType: "heartrate",
        data: JSON.stringify([140, 145, 150, 148]),
      });

      const snapshot = await getRunDetailSnapshot(database, activity.id);

      expect(snapshot).not.toBeNull();
      expect(snapshot?.activity.name).toBe("Long Run");
      expect(snapshot?.splits).toHaveLength(2);
      expect(snapshot?.heartrateSeries).toEqual([140, 145, 150, 148]);
    } finally {
      sqlite.close();
    }
  });

  it("falls back to split heartrate data when no heartrate stream exists", async () => {
    const { database, sqlite } = createTestDatabase();

    try {
      const [activity] = await database
        .insert(testSchema.activities)
        .values({
          stravaId: 3201,
          source: "strava",
          sportType: "VirtualRun",
          name: "Indoor Session",
          startDate: "2026-05-12T12:00:00.000Z",
          startDateLocal: "2026-05-12T08:00:00.000-04:00",
          movingTimeSeconds: 2_400,
        })
        .returning({ id: testSchema.activities.id });

      await database.insert(testSchema.activitySplits).values([
        {
          activityId: activity.id,
          splitIndex: 1,
          averageHeartrate: 150,
        },
        {
          activityId: activity.id,
          splitIndex: 2,
          averageHeartrate: 153,
        },
      ]);

      const snapshot = await getRunDetailSnapshot(database, activity.id);

      expect(snapshot?.heartrateSeries).toEqual([150, 153]);
    } finally {
      sqlite.close();
    }
  });

  it("counts runs and rejects non-run detail ids", async () => {
    const { database, sqlite } = createTestDatabase();

    try {
      const [ride] = await database
        .insert(testSchema.activities)
        .values({
          stravaId: 3301,
          source: "strava",
          sportType: "Ride",
          name: "Indoor Ride",
          startDate: "2026-05-12T12:00:00.000Z",
        })
        .returning({ id: testSchema.activities.id });

      await database.insert(testSchema.activities).values([
        {
          stravaId: 3302,
          source: "strava",
          sportType: "Run",
          name: "Run One",
          startDate: "2026-05-11T12:00:00.000Z",
        },
        {
          stravaId: 3303,
          source: "strava",
          sportType: "TrailRun",
          name: "Run Two",
          startDate: "2026-05-10T12:00:00.000Z",
        },
      ]);

      expect(await getRunsCount(database)).toBe(2);
      expect(await getRunDetailSnapshot(database, ride.id)).toBeNull();
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

