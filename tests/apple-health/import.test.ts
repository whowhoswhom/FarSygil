import {
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { describe, expect, it } from "vitest";

import * as testSchema from "../../src/db/schema";
import type { FarSygilDatabase } from "../../src/server/strava/oauth";
import {
  AppleHealthImportError,
  importAppleHealthExport,
} from "../../src/server/apple-health/import";

const COMMITTED_MIGRATIONS = readCommittedMigrations();

describe("Apple Health import", () => {
  it("streams Apple Health export records into daily metric rows and logs the import", async () => {
    const { database, sqlite } = createTestDatabase();

    try {
      const result = await importAppleHealthExport({
        database,
        filePath: readFixturePath("export.xml"),
      });

      expect(result).toEqual({
        fileName: "export.xml",
        recordsScanned: 11,
        recordsMatched: 9,
        metricsWritten: 7,
        startDate: "2026-05-14",
        endDate: "2026-05-15",
      });

      const metricRows = await database
        .select()
        .from(testSchema.healthMetrics)
        .orderBy(testSchema.healthMetrics.date, testSchema.healthMetrics.metricType);

      expect(metricRows).toHaveLength(7);
      expect(metricRows).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            date: "2026-05-15",
            metricType: "steps",
            value: 1500,
            unit: "count",
            source: "AppleHealth",
          }),
          expect.objectContaining({
            date: "2026-05-15",
            metricType: "resting_hr",
            value: 53,
            unit: "bpm",
          }),
          expect.objectContaining({
            date: "2026-05-15",
            metricType: "hrv",
            value: 42,
            unit: "ms",
          }),
          expect.objectContaining({
            date: "2026-05-15",
            metricType: "vo2_max",
            value: 48.6,
            unit: "mL/kg/min",
          }),
          expect.objectContaining({
            date: "2026-05-15",
            metricType: "active_energy",
            value: 540,
            unit: "kcal",
          }),
          expect.objectContaining({
            date: "2026-05-14",
            metricType: "sleep_hours",
            value: 2.5,
            unit: "hr",
          }),
          expect.objectContaining({
            date: "2026-05-15",
            metricType: "sleep_hours",
            value: 1.5,
            unit: "hr",
          }),
        ]),
      );

      const rawImports = await database.select().from(testSchema.healthRawImports);
      expect(rawImports).toHaveLength(1);
      expect(rawImports[0]).toMatchObject({
        filename: "export.xml",
        recordCount: 7,
      });
      expect(rawImports[0]?.notes).toContain("9 matched");
      expect(rawImports[0]?.notes).toContain("7 daily metric rows written");
      expect(rawImports[0]?.notes).toContain(
        "matched range 2026-05-14 to 2026-05-15",
      );

      const logRows = await database
        .select()
        .from(testSchema.dataImportLogs)
        .orderBy(testSchema.dataImportLogs.id);
      expect(logRows).toHaveLength(2);
      expect(logRows[0]).toMatchObject({
        source: "apple_health",
        eventType: "sync_start",
      });
      expect(logRows[1]).toMatchObject({
        source: "apple_health",
        eventType: "sync_complete",
        errorsCount: 0,
      });
    } finally {
      sqlite.close();
    }
  });

  it("upserts daily metrics when an export is imported again", async () => {
    const { database, sqlite } = createTestDatabase();
    const filePath = readFixturePath("export.xml");

    try {
      await importAppleHealthExport({ database, filePath });
      await importAppleHealthExport({ database, filePath });

      const metricRows = await database.select().from(testSchema.healthMetrics);
      expect(metricRows).toHaveLength(7);

      const rawImports = await database.select().from(testSchema.healthRawImports);
      expect(rawImports).toHaveLength(2);
    } finally {
      sqlite.close();
    }
  });

  it("chunks large metric writes so real exports do not exceed SQLite variable limits", async () => {
    const { database, sqlite } = createTestDatabase();
    const fixtureDirectory = mkdtempSync(path.join(tmpdir(), "farsygil-health-"));
    const filePath = path.join(fixtureDirectory, "large-export.xml");

    try {
      const records = Array.from({ length: 260 }, (_, index) => {
        const date = new Date(Date.UTC(2026, 0, index + 1))
          .toISOString()
          .slice(0, 10);

        return `<Record type="HKQuantityTypeIdentifierStepCount" sourceName="Apple Watch" startDate="${date} 08:00:00 -0400" endDate="${date} 09:00:00 -0400" value="1000" unit="count" />`;
      }).join("\n");
      writeFileSync(
        filePath,
        `<?xml version="1.0" encoding="UTF-8"?><HealthData>${records}</HealthData>`,
      );

      const result = await importAppleHealthExport({ database, filePath });
      const metricRows = await database.select().from(testSchema.healthMetrics);

      expect(result.metricsWritten).toBe(260);
      expect(metricRows).toHaveLength(260);
    } finally {
      sqlite.close();
      rmSync(fixtureDirectory, { recursive: true, force: true });
    }
  });

  it("updates Apple Health-owned rows without overwriting rows owned by another source", async () => {
    const { database, sqlite } = createTestDatabase();

    try {
      await database.insert(testSchema.healthMetrics).values([
        {
          date: "2026-05-15",
          metricType: "steps",
          value: 999,
          unit: "count",
          source: "Manual",
        },
        {
          date: "2026-05-15",
          metricType: "resting_hr",
          value: 61,
          unit: "bpm",
          source: "AppleHealth",
        },
      ]);

      const result = await importAppleHealthExport({
        database,
        filePath: readFixturePath("export.xml"),
      });

      expect(result).toMatchObject({
        recordsMatched: 9,
        metricsWritten: 6,
      });

      const metricRows = await database
        .select()
        .from(testSchema.healthMetrics)
        .orderBy(testSchema.healthMetrics.metricType);
      const stepsRow = metricRows.find((row) => row.metricType === "steps");
      const restingHrRow = metricRows.find(
        (row) => row.metricType === "resting_hr",
      );

      expect(stepsRow).toMatchObject({
        date: "2026-05-15",
        metricType: "steps",
        value: 999,
        unit: "count",
        source: "Manual",
      });
      expect(restingHrRow).toMatchObject({
        date: "2026-05-15",
        metricType: "resting_hr",
        value: 53,
        unit: "bpm",
        source: "AppleHealth",
      });
      expect(metricRows).toHaveLength(7);

      const [rawImport] = await database.select().from(testSchema.healthRawImports);
      expect(rawImport).toMatchObject({
        recordCount: 6,
      });
      expect(rawImport?.notes).toContain("9 matched");
      expect(rawImport?.notes).toContain("6 daily metric rows written");
    } finally {
      sqlite.close();
    }
  });

  it("logs a completed import when source ownership blocks every metric write", async () => {
    const { database, sqlite } = createTestDatabase();

    try {
      await database.insert(testSchema.healthMetrics).values([
        {
          date: "2026-05-14",
          metricType: "sleep_hours",
          value: 8,
          unit: "hr",
          source: "Manual",
        },
        {
          date: "2026-05-15",
          metricType: "active_energy",
          value: 700,
          unit: "kcal",
          source: "Manual",
        },
        {
          date: "2026-05-15",
          metricType: "hrv",
          value: 60,
          unit: "ms",
          source: "Manual",
        },
        {
          date: "2026-05-15",
          metricType: "resting_hr",
          value: 50,
          unit: "bpm",
          source: "Manual",
        },
        {
          date: "2026-05-15",
          metricType: "sleep_hours",
          value: 6,
          unit: "hr",
          source: "Manual",
        },
        {
          date: "2026-05-15",
          metricType: "steps",
          value: 10000,
          unit: "count",
          source: "Manual",
        },
        {
          date: "2026-05-15",
          metricType: "vo2_max",
          value: 45,
          unit: "mL/kg/min",
          source: "Manual",
        },
      ]);

      const result = await importAppleHealthExport({
        database,
        filePath: readFixturePath("export.xml"),
      });

      expect(result).toMatchObject({
        recordsMatched: 9,
        metricsWritten: 0,
        startDate: "2026-05-14",
        endDate: "2026-05-15",
      });

      const metricRows = await database.select().from(testSchema.healthMetrics);
      expect(metricRows).toHaveLength(7);
      expect(metricRows.every((row) => row.source === "Manual")).toBe(true);

      const [rawImport] = await database.select().from(testSchema.healthRawImports);
      expect(rawImport).toMatchObject({
        recordCount: 0,
      });
      expect(rawImport?.notes).toContain("9 matched");
      expect(rawImport?.notes).toContain("0 daily metric rows written");
      expect(rawImport?.notes).toContain(
        "matched range 2026-05-14 to 2026-05-15",
      );

      const logRows = await database
        .select()
        .from(testSchema.dataImportLogs)
        .orderBy(testSchema.dataImportLogs.id);
      expect(logRows).toHaveLength(2);
      expect(logRows[1]).toMatchObject({
        eventType: "sync_complete",
        message: "Apple Health import completed with 0 daily metric rows.",
        errorsCount: 0,
      });
    } finally {
      sqlite.close();
    }
  });

  it("records an import error when the export file is missing", async () => {
    const { database, sqlite } = createTestDatabase();

    try {
      await expect(
        importAppleHealthExport({
          database,
          filePath: readFixturePath("missing.xml"),
        }),
      ).rejects.toMatchObject({
        name: "AppleHealthImportError",
        code: "file_not_found",
      } satisfies Partial<AppleHealthImportError>);

      const metricRows = await database.select().from(testSchema.healthMetrics);
      expect(metricRows).toHaveLength(0);

      const logRows = await database
        .select()
        .from(testSchema.dataImportLogs)
        .where(eq(testSchema.dataImportLogs.source, "apple_health"));
      expect(logRows).toHaveLength(1);
      expect(logRows[0]).toMatchObject({
        eventType: "sync_error",
        errorsCount: 1,
      });
    } finally {
      sqlite.close();
    }
  });

  it("records an import error when the export XML is invalid", async () => {
    const { database, sqlite } = createTestDatabase();

    try {
      await expect(
        importAppleHealthExport({
          database,
          filePath: readFixturePath("invalid.xml"),
        }),
      ).rejects.toMatchObject({
        name: "AppleHealthImportError",
        code: "invalid_xml",
      } satisfies Partial<AppleHealthImportError>);

      const metricRows = await database.select().from(testSchema.healthMetrics);
      expect(metricRows).toHaveLength(0);

      const rawImports = await database.select().from(testSchema.healthRawImports);
      expect(rawImports).toHaveLength(0);

      const logRows = await database
        .select()
        .from(testSchema.dataImportLogs)
        .where(eq(testSchema.dataImportLogs.source, "apple_health"))
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

function readFixturePath(fileName: string): string {
  return fileURLToPath(
    new URL(`../fixtures/apple-health/${fileName}`, import.meta.url),
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
