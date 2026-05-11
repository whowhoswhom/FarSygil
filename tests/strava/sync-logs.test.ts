import { readdirSync, readFileSync } from "node:fs";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { describe, expect, it } from "vitest";
import * as testSchema from "../../src/db/schema";
import type { FarSygilDatabase } from "../../src/server/strava/oauth";
import { getRecentStravaSyncLogs } from "../../src/server/strava/sync-logs";

const COMMITTED_MIGRATIONS = readCommittedMigrations();

describe("Strava sync logs", () => {
  it("returns recent Strava sync logs in descending order and filters non-Strava rows", async () => {
    const { database, sqlite } = createTestDatabase();

    try {
      await database.insert(testSchema.dataImportLogs).values([
        {
          source: "strava",
          eventType: "sync_start",
          message: "First",
          activitiesAdded: 0,
          activitiesUpdated: 0,
          errorsCount: 0,
        },
        {
          source: "apple_health",
          eventType: "sync_complete",
          message: "Ignore me",
          activitiesAdded: 0,
          activitiesUpdated: 0,
          errorsCount: 0,
        },
        {
          source: "strava",
          eventType: "sync_complete",
          message: "Second",
          activitiesAdded: 2,
          activitiesUpdated: 1,
          errorsCount: 0,
        },
      ]);

      const rows = await getRecentStravaSyncLogs(database, 5);

      expect(rows).toHaveLength(2);
      expect(rows[0]).toMatchObject({
        source: "strava",
        eventType: "sync_complete",
        message: "Second",
        activitiesAdded: 2,
        activitiesUpdated: 1,
      });
      expect(rows[1]).toMatchObject({
        source: "strava",
        eventType: "sync_start",
        message: "First",
      });
    } finally {
      sqlite.close();
    }
  });

  it("honors the requested limit", async () => {
    const { database, sqlite } = createTestDatabase();

    try {
      await database.insert(testSchema.dataImportLogs).values([
        {
          source: "strava",
          eventType: "sync_start",
          message: "One",
        },
        {
          source: "strava",
          eventType: "sync_complete",
          message: "Two",
        },
        {
          source: "strava",
          eventType: "sync_error",
          message: "Three",
          errorsCount: 1,
        },
      ]);

      const rows = await getRecentStravaSyncLogs(database, 2);

      expect(rows).toHaveLength(2);
      expect(rows.map((row) => row.message)).toEqual(["Three", "Two"]);
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
