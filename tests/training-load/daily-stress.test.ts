import { readdirSync, readFileSync } from "node:fs";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { describe, expect, it } from "vitest";

import * as testSchema from "../../src/db/schema";
import type { FarSygilDatabase } from "../../src/server/strava/oauth";
import {
  calculateActivityTrainingStress,
  getDailyTrainingStressSnapshot,
  recomputeDailyTrainingStress,
} from "../../src/server/training-load/daily-stress";

const COMMITTED_MIGRATIONS = readCommittedMigrations();

describe("training load daily stress", () => {
  it("prefers Strava suffer score and falls back to HR-duration stress", async () => {
    const { database, sqlite } = createTestDatabase();

    try {
      await database.insert(testSchema.activities).values([
        {
          stravaId: 5001,
          source: "strava",
          sportType: "Run",
          name: "Relative Effort Run",
          startDate: "2026-05-11T12:00:00.000Z",
          startDateLocal: "2026-05-11T08:00:00.000-04:00",
          movingTimeSeconds: 3600,
          averageHeartrate: 140,
          sufferScore: 42,
        },
        {
          stravaId: 5002,
          source: "strava",
          sportType: "TrailRun",
          name: "HR Fallback Run",
          startDate: "2026-05-11T13:00:00.000Z",
          startDateLocal: "2026-05-11T09:00:00.000-04:00",
          movingTimeSeconds: 3600,
          averageHeartrate: 150,
        },
        {
          stravaId: 5003,
          source: "strava",
          sportType: "Ride",
          name: "Ignored Ride",
          startDate: "2026-05-11T14:00:00.000Z",
          startDateLocal: "2026-05-11T10:00:00.000-04:00",
          movingTimeSeconds: 3600,
          averageHeartrate: 150,
          sufferScore: 99,
        },
        {
          stravaId: 5004,
          source: "manual",
          sportType: "Run",
          name: "Ignored Manual Run",
          startDate: "2026-05-11T15:00:00.000Z",
          startDateLocal: "2026-05-11T11:00:00.000-04:00",
          movingTimeSeconds: 3600,
          averageHeartrate: 150,
          sufferScore: 99,
        },
      ]);

      const result = await recomputeDailyTrainingStress(database);
      const rows = await database.select().from(testSchema.trainingLoad);

      expect(result).toEqual({
        activitiesScanned: 2,
        activitiesUsed: 2,
        daysWritten: 1,
        startDate: "2026-05-11",
        endDate: "2026-05-11",
      });
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        date: "2026-05-11",
        dailyTrainingStress: 125.3,
        acuteLoad: null,
        chronicLoad: null,
        trainingStressBalance: null,
      });
    } finally {
      sqlite.close();
    }
  });

  it("does not write fake zero rows when no activity has enough stress inputs", async () => {
    const { database, sqlite } = createTestDatabase();

    try {
      await database.insert(testSchema.trainingLoad).values({
        date: "2026-05-12",
        acuteLoad: 12,
        dailyTrainingStress: 99,
      });
      await database.insert(testSchema.activities).values([
        {
          stravaId: 5101,
          source: "strava",
          sportType: "Run",
          name: "No HR",
          startDate: "2026-05-12T12:00:00.000Z",
          startDateLocal: "2026-05-12T08:00:00.000-04:00",
          movingTimeSeconds: 3600,
        },
        {
          stravaId: 5102,
          source: "strava",
          sportType: "Run",
          name: "No Time",
          startDate: "2026-05-13T12:00:00.000Z",
          startDateLocal: "2026-05-13T08:00:00.000-04:00",
          averageHeartrate: 150,
        },
      ]);

      const result = await recomputeDailyTrainingStress(database);
      const rows = await database.select().from(testSchema.trainingLoad);
      const snapshot = await getDailyTrainingStressSnapshot(database);

      expect(result).toEqual({
        activitiesScanned: 2,
        activitiesUsed: 0,
        daysWritten: 0,
        startDate: null,
        endDate: null,
      });
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        date: "2026-05-12",
        acuteLoad: 12,
        dailyTrainingStress: null,
      });
      expect(snapshot).toEqual({
        latest: null,
        series: [],
      });
    } finally {
      sqlite.close();
    }
  });

  it("updates daily stress while preserving future ATL and CTL values", async () => {
    const { database, sqlite } = createTestDatabase();

    try {
      await database.insert(testSchema.trainingLoad).values({
        date: "2026-05-14",
        acuteLoad: 40,
        chronicLoad: 55,
        trainingStressBalance: 15,
        dailyTrainingStress: 10,
      });
      await database.insert(testSchema.activities).values({
        stravaId: 5201,
        source: "strava",
        sportType: "Run",
        name: "Updated Stress",
        startDate: "2026-05-14T12:00:00.000Z",
        startDateLocal: "2026-05-14T08:00:00.000-04:00",
        sufferScore: 77,
      });

      await recomputeDailyTrainingStress(database);
      const [row] = await database.select().from(testSchema.trainingLoad);

      expect(row).toMatchObject({
        date: "2026-05-14",
        acuteLoad: 40,
        chronicLoad: 55,
        trainingStressBalance: 15,
        dailyTrainingStress: 77,
      });
    } finally {
      sqlite.close();
    }
  });

  it("reads a bounded latest daily stress snapshot in chronological order", async () => {
    const { database, sqlite } = createTestDatabase();

    try {
      await database.insert(testSchema.trainingLoad).values([
        {
          date: "2026-05-10",
          dailyTrainingStress: 10,
        },
        {
          date: "2026-05-11",
          dailyTrainingStress: 20,
        },
        {
          date: "2026-05-12",
          dailyTrainingStress: 30,
        },
      ]);

      const snapshot = await getDailyTrainingStressSnapshot(database, 2);

      expect(snapshot).toEqual({
        latest: {
          date: "2026-05-12",
          dailyTrainingStress: 30,
        },
        series: [
          {
            date: "2026-05-11",
            dailyTrainingStress: 20,
          },
          {
            date: "2026-05-12",
            dailyTrainingStress: 30,
          },
        ],
      });
    } finally {
      sqlite.close();
    }
  });

  it("calculates standalone activity stress from real fields only", () => {
    expect(
      calculateActivityTrainingStress({
        sufferScore: 35,
        movingTimeSeconds: null,
        averageHeartrate: null,
      }),
    ).toBe(35);
    expect(
      calculateActivityTrainingStress({
        sufferScore: null,
        movingTimeSeconds: 1800,
        averageHeartrate: 144,
      }),
    ).toBe(40);
    expect(
      calculateActivityTrainingStress({
        sufferScore: null,
        movingTimeSeconds: 1800,
        averageHeartrate: null,
      }),
    ).toBeNull();
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
