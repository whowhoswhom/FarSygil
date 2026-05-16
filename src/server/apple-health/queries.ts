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

export interface AppleHealthMetricTrendPoint {
  date: string;
  value: number;
}

export interface AppleHealthMetricTrendSeries {
  metricType: string;
  points: AppleHealthMetricTrendPoint[];
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

export async function getAppleHealthMetricTrendSeries(
  database: FarSygilDatabase,
  metricTypes: string[],
  pointsPerMetric = 30,
): Promise<AppleHealthMetricTrendSeries[]> {
  const safePointLimit = Math.max(0, Math.floor(pointsPerMetric));

  if (metricTypes.length === 0 || safePointLimit === 0) {
    return [];
  }

  const rows = await database
    .select({
      date: healthMetrics.date,
      metricType: healthMetrics.metricType,
      value: healthMetrics.value,
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
  const pointsByType = new Map<string, AppleHealthMetricTrendPoint[]>();
  const seenDatesByType = new Map<string, Set<string>>();

  for (const row of rows) {
    if (!requestedTypes.has(row.metricType)) {
      continue;
    }

    if (typeof row.value !== "number" || !Number.isFinite(row.value)) {
      continue;
    }

    const points = pointsByType.get(row.metricType) ?? [];

    if (points.length >= safePointLimit) {
      continue;
    }

    const seenDates = seenDatesByType.get(row.metricType) ?? new Set<string>();

    if (seenDates.has(row.date)) {
      continue;
    }

    seenDates.add(row.date);
    seenDatesByType.set(row.metricType, seenDates);
    points.push({
      date: row.date,
      value: row.value,
    });
    pointsByType.set(row.metricType, points);
  }

  return metricTypes.map((metricType) => ({
    metricType,
    points: (pointsByType.get(metricType) ?? []).reverse(),
  }));
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
