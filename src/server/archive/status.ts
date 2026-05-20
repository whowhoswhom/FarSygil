import { and, desc, eq, sql } from "drizzle-orm";

import {
  activities,
  activityRawJson,
  dataImportLogs,
  healthMetrics,
  healthRawImports,
  trainingLoad,
} from "@/db/schema";
import type { FarSygilDatabase } from "@/server/strava/oauth";

export interface ArchiveStatusSnapshot {
  databasePath: string | null;
  counts: {
    activities: number;
    stravaActivities: number;
    healthMetricRows: number;
    trainingLoadRows: number;
  };
  latest: {
    stravaSyncAt: string | null;
    appleHealthImportAt: string | null;
    latestHealthMetricDate: string | null;
    latestDailyStressDate: string | null;
    latestLocalWriteAt: string | null;
  };
  coverage: {
    totalStravaActivities: number;
    detailedActivities: number;
    streamActivities: number;
    detailCoveragePercent: number | null;
    streamCoveragePercent: number | null;
  };
}

/**
 * Reads the local archive provenance snapshot without triggering sync/import
 * work. Detail coverage is the share of Strava-sourced activity rows with a
 * stored `activity_raw_json` detailed payload; stream coverage is the share
 * with a stored `activity_raw_json` streams payload.
 */
export async function getArchiveStatusSnapshot(
  database: FarSygilDatabase,
  options: { databasePath?: string | null } = {},
): Promise<ArchiveStatusSnapshot> {
  const [
    activityCount,
    stravaActivityCount,
    healthMetricCount,
    trainingLoadCount,
    latestStravaSync,
    latestAppleHealthImport,
    latestHealthMetric,
    latestDailyStress,
    detailedActivityCount,
    streamActivityCount,
    latestActivityWrite,
    latestHealthWrite,
    latestLoadWrite,
    latestImportLog,
  ] = await Promise.all([
    readCount(database.select({ count: sql<number>`count(*)` }).from(activities)),
    readCount(
      database
        .select({ count: sql<number>`count(*)` })
        .from(activities)
        .where(eq(activities.source, "strava")),
    ),
    readCount(
      database.select({ count: sql<number>`count(*)` }).from(healthMetrics),
    ),
    readCount(
      database.select({ count: sql<number>`count(*)` }).from(trainingLoad),
    ),
    database
      .select({
        startedAt: dataImportLogs.startedAt,
        completedAt: dataImportLogs.completedAt,
      })
      .from(dataImportLogs)
      .where(
        and(
          eq(dataImportLogs.source, "strava"),
          eq(dataImportLogs.eventType, "sync_complete"),
        ),
      )
      .orderBy(desc(dataImportLogs.id))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    database
      .select({
        importedAt: healthRawImports.importedAt,
      })
      .from(healthRawImports)
      .orderBy(desc(healthRawImports.importedAt), desc(healthRawImports.id))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    database
      .select({
        date: healthMetrics.date,
        createdAt: healthMetrics.createdAt,
      })
      .from(healthMetrics)
      .orderBy(desc(healthMetrics.date), desc(healthMetrics.id))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    database
      .select({
        date: trainingLoad.date,
        updatedAt: trainingLoad.updatedAt,
      })
      .from(trainingLoad)
      .where(sql`${trainingLoad.dailyTrainingStress} is not null`)
      .orderBy(desc(trainingLoad.date), desc(trainingLoad.id))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    readCount(
      database
        .select({ count: sql<number>`count(distinct ${activities.id})` })
        .from(activities)
        .innerJoin(
          activityRawJson,
          eq(activities.stravaId, activityRawJson.stravaId),
        )
        .where(
          and(
            eq(activities.source, "strava"),
            eq(activityRawJson.payloadType, "detailed_activity"),
          ),
        ),
    ),
    readCount(
      database
        .select({ count: sql<number>`count(distinct ${activities.id})` })
        .from(activities)
        .innerJoin(
          activityRawJson,
          eq(activities.stravaId, activityRawJson.stravaId),
        )
        .where(
          and(
            eq(activities.source, "strava"),
            eq(activityRawJson.payloadType, "streams"),
          ),
        ),
    ),
    database
      .select({
        updatedAt: activities.updatedAt,
      })
      .from(activities)
      .orderBy(desc(activities.updatedAt), desc(activities.id))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    database
      .select({
        createdAt: healthMetrics.createdAt,
      })
      .from(healthMetrics)
      .orderBy(desc(healthMetrics.createdAt), desc(healthMetrics.id))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    database
      .select({
        updatedAt: trainingLoad.updatedAt,
      })
      .from(trainingLoad)
      .orderBy(desc(trainingLoad.updatedAt), desc(trainingLoad.id))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    database
      .select({
        startedAt: dataImportLogs.startedAt,
        completedAt: dataImportLogs.completedAt,
      })
      .from(dataImportLogs)
      .orderBy(desc(dataImportLogs.id))
      .limit(1)
      .then((rows) => rows[0] ?? null),
  ]);

  const latestLocalWriteAt = latestTimestamp([
    latestActivityWrite?.updatedAt ?? null,
    latestHealthWrite?.createdAt ?? null,
    latestLoadWrite?.updatedAt ?? null,
    latestImportLog?.completedAt ?? latestImportLog?.startedAt ?? null,
    latestAppleHealthImport?.importedAt ?? null,
  ]);

  return {
    databasePath: options.databasePath ?? null,
    counts: {
      activities: activityCount,
      stravaActivities: stravaActivityCount,
      healthMetricRows: healthMetricCount,
      trainingLoadRows: trainingLoadCount,
    },
    latest: {
      stravaSyncAt:
        latestStravaSync?.completedAt ?? latestStravaSync?.startedAt ?? null,
      appleHealthImportAt: latestAppleHealthImport?.importedAt ?? null,
      latestHealthMetricDate: latestHealthMetric?.date ?? null,
      latestDailyStressDate: latestDailyStress?.date ?? null,
      latestLocalWriteAt,
    },
    coverage: {
      totalStravaActivities: stravaActivityCount,
      detailedActivities: detailedActivityCount,
      streamActivities: streamActivityCount,
      detailCoveragePercent: percent(detailedActivityCount, stravaActivityCount),
      streamCoveragePercent: percent(streamActivityCount, stravaActivityCount),
    },
  };
}

async function readCount(
  query: Promise<Array<{ count: number }>>,
): Promise<number> {
  const [row] = await query;
  return Number(row?.count ?? 0);
}

function percent(value: number, total: number): number | null {
  if (total <= 0) {
    return null;
  }

  return Math.round((value / total) * 100);
}

function latestTimestamp(values: Array<string | null>): string | null {
  let latest: { value: string; time: number } | null = null;

  for (const value of values) {
    if (!value) {
      continue;
    }

    const time = new Date(value).getTime();

    if (Number.isNaN(time)) {
      continue;
    }

    if (!latest || time > latest.time) {
      latest = { value, time };
    }
  }

  return latest?.value ?? null;
}
