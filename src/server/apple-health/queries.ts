import { and, desc, eq, inArray, sql } from "drizzle-orm";

import {
  dataImportLogs,
  healthMetrics,
  healthRawImports,
} from "@/db/schema";
import type { FarSygilDatabase } from "@/server/strava/oauth";

export interface AppleHealthMetricSnapshot {
  date: string;
  metricType: string;
  value: number | null;
  unit: string | null;
  source: string | null;
}

export interface AppleHealthImportSummary {
  metricRows: number;
  latestMetricDate: string | null;
  latestImport: {
    filename: string;
    importedAt: string;
    recordCount: number | null;
    notes: string | null;
  } | null;
  latestLog: {
    eventType: string;
    message: string | null;
    startedAt: string;
    completedAt: string | null;
  } | null;
}

export async function getLatestAppleHealthMetrics(
  database: FarSygilDatabase,
  metricTypes: string[],
): Promise<AppleHealthMetricSnapshot[]> {
  if (metricTypes.length === 0) {
    return [];
  }

  const rows = await database
    .select({
      date: healthMetrics.date,
      metricType: healthMetrics.metricType,
      value: healthMetrics.value,
      unit: healthMetrics.unit,
      source: healthMetrics.source,
    })
    .from(healthMetrics)
    .where(
      and(
        eq(healthMetrics.source, "AppleHealth"),
        inArray(healthMetrics.metricType, metricTypes),
      ),
    )
    .orderBy(desc(healthMetrics.date), desc(healthMetrics.id));
  const requestedTypes = new Set(metricTypes);
  const seenTypes = new Set<string>();
  const snapshots: AppleHealthMetricSnapshot[] = [];

  for (const row of rows) {
    if (!requestedTypes.has(row.metricType) || seenTypes.has(row.metricType)) {
      continue;
    }

    seenTypes.add(row.metricType);
    snapshots.push(row);

    if (seenTypes.size === requestedTypes.size) {
      break;
    }
  }

  return snapshots.sort(
    (left, right) =>
      metricTypes.indexOf(left.metricType) - metricTypes.indexOf(right.metricType),
  );
}

export async function getAppleHealthImportSummary(
  database: FarSygilDatabase,
): Promise<AppleHealthImportSummary> {
  const [[metricCount], [latestMetric], [latestImport], [latestLog]] =
    await Promise.all([
      database
        .select({
          count: sql<number>`count(*)`,
        })
        .from(healthMetrics)
        .where(eq(healthMetrics.source, "AppleHealth")),
      database
        .select({
          date: healthMetrics.date,
        })
        .from(healthMetrics)
        .where(eq(healthMetrics.source, "AppleHealth"))
        .orderBy(desc(healthMetrics.date))
        .limit(1),
      database
        .select({
          filename: healthRawImports.filename,
          importedAt: healthRawImports.importedAt,
          recordCount: healthRawImports.recordCount,
          notes: healthRawImports.notes,
        })
        .from(healthRawImports)
        .orderBy(desc(healthRawImports.importedAt), desc(healthRawImports.id))
        .limit(1),
      database
        .select({
          eventType: dataImportLogs.eventType,
          message: dataImportLogs.message,
          startedAt: dataImportLogs.startedAt,
          completedAt: dataImportLogs.completedAt,
        })
        .from(dataImportLogs)
        .where(eq(dataImportLogs.source, "apple_health"))
        .orderBy(desc(dataImportLogs.id))
        .limit(1),
    ]);

  return {
    metricRows: metricCount?.count ?? 0,
    latestMetricDate: latestMetric?.date ?? null,
    latestImport: latestImport ?? null,
    latestLog: latestLog ?? null,
  };
}
