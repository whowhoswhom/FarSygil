import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { activities, activitySplits, activityStreams } from "@/db/schema";
import { buildNormalizedRoutePath } from "@/lib/activities/polyline";
import type { ArchiveActivity } from "@/lib/activities/types";
import type { FarSygilDatabase } from "@/server/strava/oauth";

const RUN_SPORTS = ["Run", "TrailRun", "VirtualRun"] as const;

export interface RunSplitSnapshot {
  splitIndex: number;
  distanceMeters: number | null;
  elapsedTimeSeconds: number | null;
  movingTimeSeconds: number | null;
  elevationDifference: number | null;
  averageSpeed: number | null;
  averageHeartrate: number | null;
}

export interface RunDetailSnapshot {
  activity: ArchiveActivity;
  splits: RunSplitSnapshot[];
  heartrateSeries: number[];
}

type ActivityRow = Omit<ArchiveActivity, "routePathData"> & {
  mapPolyline: string | null;
};

export async function getArchivedRuns(
  database: FarSygilDatabase,
): Promise<ArchiveActivity[]> {
  const rows = await database
    .select({
      id: activities.id,
      stravaId: activities.stravaId,
      name: activities.name,
      sportType: activities.sportType,
      startDate: activities.startDate,
      startDateLocal: activities.startDateLocal,
      timezone: activities.timezone,
      distanceMeters: activities.distanceMeters,
      movingTimeSeconds: activities.movingTimeSeconds,
      elapsedTimeSeconds: activities.elapsedTimeSeconds,
      totalElevationGain: activities.totalElevationGain,
      averageSpeed: activities.averageSpeed,
      maxSpeed: activities.maxSpeed,
      averageHeartrate: activities.averageHeartrate,
      maxHeartrate: activities.maxHeartrate,
      averageCadence: activities.averageCadence,
      averageWatts: activities.averageWatts,
      sufferScore: activities.sufferScore,
      perceivedExertion: activities.perceivedExertion,
      startLatitude: activities.startLatitude,
      startLongitude: activities.startLongitude,
      mapPolyline: activities.mapPolyline,
      source: activities.source,
    })
    .from(activities)
    .where(
      and(
        eq(activities.source, "strava"),
        inArray(activities.sportType, [...RUN_SPORTS]),
      ),
    )
    .orderBy(desc(activities.startDate));

  return rows.map(mapActivityRow);
}

export async function getRunDetailSnapshot(
  database: FarSygilDatabase,
  activityId: number,
): Promise<RunDetailSnapshot | null> {
  const [row] = await database
    .select({
      id: activities.id,
      stravaId: activities.stravaId,
      name: activities.name,
      sportType: activities.sportType,
      startDate: activities.startDate,
      startDateLocal: activities.startDateLocal,
      timezone: activities.timezone,
      distanceMeters: activities.distanceMeters,
      movingTimeSeconds: activities.movingTimeSeconds,
      elapsedTimeSeconds: activities.elapsedTimeSeconds,
      totalElevationGain: activities.totalElevationGain,
      averageSpeed: activities.averageSpeed,
      maxSpeed: activities.maxSpeed,
      averageHeartrate: activities.averageHeartrate,
      maxHeartrate: activities.maxHeartrate,
      averageCadence: activities.averageCadence,
      averageWatts: activities.averageWatts,
      sufferScore: activities.sufferScore,
      perceivedExertion: activities.perceivedExertion,
      startLatitude: activities.startLatitude,
      startLongitude: activities.startLongitude,
      mapPolyline: activities.mapPolyline,
      source: activities.source,
    })
    .from(activities)
    .where(
      and(
        eq(activities.id, activityId),
        eq(activities.source, "strava"),
        inArray(activities.sportType, [...RUN_SPORTS]),
      ),
    )
    .limit(1);

  if (!row) {
    return null;
  }

  const [splits, streams] = await Promise.all([
    database
      .select({
        splitIndex: activitySplits.splitIndex,
        distanceMeters: activitySplits.distanceMeters,
        elapsedTimeSeconds: activitySplits.elapsedTimeSeconds,
        movingTimeSeconds: activitySplits.movingTimeSeconds,
        elevationDifference: activitySplits.elevationDifference,
        averageSpeed: activitySplits.averageSpeed,
        averageHeartrate: activitySplits.averageHeartrate,
      })
      .from(activitySplits)
      .where(eq(activitySplits.activityId, activityId))
      .orderBy(activitySplits.splitIndex),
    database
      .select({
        streamType: activityStreams.streamType,
        data: activityStreams.data,
      })
      .from(activityStreams)
      .where(eq(activityStreams.activityId, activityId)),
  ]);

  return {
    activity: mapActivityRow(row),
    splits,
    heartrateSeries: buildHeartrateSeries(streams, splits),
  };
}

export async function getRunsCount(
  database: FarSygilDatabase,
): Promise<number> {
  const [row] = await database
    .select({
      count: sql<number>`count(*)`,
    })
    .from(activities)
    .where(
      and(
        eq(activities.source, "strava"),
        inArray(activities.sportType, [...RUN_SPORTS]),
      ),
    );

  return row?.count ?? 0;
}

function mapActivityRow(row: ActivityRow): ArchiveActivity {
  return {
    id: row.id,
    stravaId: row.stravaId,
    name: row.name,
    sportType: row.sportType,
    startDate: row.startDate,
    startDateLocal: row.startDateLocal,
    timezone: row.timezone,
    distanceMeters: row.distanceMeters,
    movingTimeSeconds: row.movingTimeSeconds,
    elapsedTimeSeconds: row.elapsedTimeSeconds,
    totalElevationGain: row.totalElevationGain,
    averageSpeed: row.averageSpeed,
    maxSpeed: row.maxSpeed,
    averageHeartrate: row.averageHeartrate,
    maxHeartrate: row.maxHeartrate,
    averageCadence: row.averageCadence,
    averageWatts: row.averageWatts,
    sufferScore: row.sufferScore,
    perceivedExertion: row.perceivedExertion,
    startLatitude: row.startLatitude,
    startLongitude: row.startLongitude,
    source: row.source ?? "strava",
    routePathData: buildNormalizedRoutePath(row.mapPolyline),
  };
}

function buildHeartrateSeries(
  streams: Array<{ streamType: string; data: string }>,
  splits: RunSplitSnapshot[],
): number[] {
  const heartrateStream = streams.find((stream) => stream.streamType === "heartrate");

  if (heartrateStream) {
    const parsed = parseNumericArray(heartrateStream.data);

    if (parsed.length >= 2) {
      return parsed;
    }
  }

  const splitSeries = splits
    .map((split) => split.averageHeartrate)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

  return splitSeries.length >= 2 ? splitSeries : [];
}

function parseNumericArray(value: string): number[] {
  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (entry): entry is number => typeof entry === "number" && Number.isFinite(entry),
    );
  } catch {
    return [];
  }
}

