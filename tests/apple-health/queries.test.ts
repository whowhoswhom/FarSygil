import { readdirSync, readFileSync } from "node:fs";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { describe, expect, it } from "vitest";

import * as testSchema from "../../src/db/schema";
import {
  getAppleHealthImportSummary,
  getAppleHealthMetricTrendSeries,
  getLatestAppleHealthMetrics,
} from "../../src/server/apple-health/queries";
import type { FarSygilDatabase } from "../../src/server/strava/oauth";

const COMMITTED_MIGRATIONS = readCommittedMigrations();

describe("Apple Health queries", () => {
  it("reads the latest row for every requested metric even when one metric is sparse", async () => {
    const { database, sqlite } = createTestDatabase();

    try {
      await database.insert(testSchema.healthMetrics).values([
        {
          date: "2024-01-01",
          metricType: "vo2_max",
          value: 52.4,
          unit: "mL/kg/min",
          source: "AppleHealth",
        },
        ...Array.from({ length: 600 }, (_, index) => {
          const date = new Date(Date.UTC(2025, 0, index + 1))
            .toISOString()
            .slice(0, 10);

          return {
            date,
            metricType: "steps",
            value: index,
            unit: "count",
            source: "AppleHealth",
          };
        }),
      ]);

      const metrics = await getLatestAppleHealthMetrics(database, [
        "vo2_max",
        "steps",
      ]);

      expect(metrics).toEqual([
        expect.objectContaining({
          date: "2024-01-01",
          metricType: "vo2_max",
          value: 52.4,
        }),
        expect.objectContaining({
          date: "2026-08-23",
          metricType: "steps",
          value: 599,
        }),
      ]);
    } finally {
      sqlite.close();
    }
  });

  it("summarizes imported Apple Health rows for shell status", async () => {
    const { database, sqlite } = createTestDatabase();

    try {
      await database.insert(testSchema.healthMetrics).values([
        {
          date: "2026-05-15",
          metricType: "steps",
          value: 1000,
          unit: "count",
          source: "AppleHealth",
        },
        {
          date: "2026-05-16",
          metricType: "resting_hr",
          value: 53,
          unit: "bpm",
          source: "AppleHealth",
        },
      ]);
      await database.insert(testSchema.healthRawImports).values({
        filename: "export.xml",
        recordCount: 2,
        notes: "2 rows written",
      });
      await database.insert(testSchema.dataImportLogs).values({
        source: "apple_health",
        eventType: "sync_complete",
        message: "Apple Health import completed.",
        completedAt: "2026-05-16 10:00:00",
      });

      const summary = await getAppleHealthImportSummary(database);

      expect(summary).toMatchObject({
        metricRows: 2,
        latestMetricDate: "2026-05-16",
        latestImport: {
          filename: "export.xml",
          recordCount: 2,
        },
        latestLog: {
          eventType: "sync_complete",
          message: "Apple Health import completed.",
        },
      });
    } finally {
      sqlite.close();
    }
  });

  it("builds bounded latest trend series for requested Apple Health metrics", async () => {
    const { database, sqlite } = createTestDatabase();

    try {
      await database.insert(testSchema.healthMetrics).values([
        {
          date: "2024-01-01",
          metricType: "vo2_max",
          value: 51.1,
          unit: "mL/kg/min",
          source: "AppleHealth",
        },
        {
          date: "2024-02-01",
          metricType: "vo2_max",
          value: 52.4,
          unit: "mL/kg/min",
          source: "AppleHealth",
        },
        {
          date: "2025-02-05",
          metricType: "steps",
          value: null,
          unit: "count",
          source: "AppleHealth",
        },
        ...Array.from({ length: 35 }, (_, index) => {
          const date = new Date(Date.UTC(2025, 0, index + 1))
            .toISOString()
            .slice(0, 10);

          return {
            date,
            metricType: "steps",
            value: index + 1,
            unit: "count",
            source: "AppleHealth",
          };
        }),
        {
          date: "2025-02-06",
          metricType: "distance",
          value: 100,
          unit: "m",
          source: "Strava",
        },
      ]);

      const series = await getAppleHealthMetricTrendSeries(database, [
        "vo2_max",
        "steps",
      ]);

      expect(series).toEqual([
        {
          metricType: "vo2_max",
          points: [
            {
              date: "2024-01-01",
              value: 51.1,
            },
            {
              date: "2024-02-01",
              value: 52.4,
            },
          ],
        },
        {
          metricType: "steps",
          points: expect.arrayContaining([
            {
              date: "2025-01-06",
              value: 6,
            },
            {
              date: "2025-02-04",
              value: 35,
            },
          ]),
        },
      ]);
      expect(series[1]?.points).toHaveLength(30);
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
