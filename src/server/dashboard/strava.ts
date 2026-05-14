import {
  and,
  desc,
  eq,
  gte,
  inArray,
  lt,
} from "drizzle-orm";
import { activities } from "@/db/schema";
import { RUN_SPORTS } from "@/lib/strava/run-sports";
import { metersToFeet, metersToMiles } from "@/lib/units";
import type { FarSygilDatabase } from "@/server/strava/oauth";
import { getStravaConnectionStatus } from "@/server/strava/oauth";
import { getRecentStravaSyncLogs } from "@/server/strava/sync-logs";

type DashboardStatusState =
  | "connected"
  | "disconnected"
  | "pending"
  | "unavailable";

interface DashboardRunRow {
  id: number;
  name: string | null;
  sportType: string | null;
  startDate: string | null;
  startDateLocal: string | null;
  distanceMeters: number | null;
  movingTimeSeconds: number | null;
  totalElevationGain: number | null;
  averageHeartrate: number | null;
  averageCadence: number | null;
}

export interface DashboardHeaderSnapshot {
  statusLabel: string;
  statusState: DashboardStatusState;
  lastSyncedAt: string | null;
}

export interface DashboardRunSnapshot {
  id: number;
  name: string | null;
  sportType: string | null;
  startDate: string | null;
  startDateLocal: string | null;
  distanceMeters: number | null;
  movingTimeSeconds: number | null;
  totalElevationGain: number | null;
  averageHeartrate: number | null;
  averageCadence: number | null;
}

export interface DashboardRunningSnapshot {
  weekStartDate: string;
  weekEndDate: string;
  runCount: number;
  totalDistanceMeters: number;
  totalMovingTimeSeconds: number;
  totalElevationGain: number;
  averagePaceSecondsPerMile: number | null;
  averageCadence: number | null;
  averageHeartrate: number | null;
  distanceSeriesMiles: number[];
  movingTimeSeriesMinutes: number[];
  elevationSeriesFeet: number[];
  paceSeriesSecondsPerMile: number[];
  cadenceSeries: number[];
  heartrateSeries: number[];
  recentRun: DashboardRunSnapshot | null;
  longestRun: DashboardRunSnapshot | null;
}

export async function getDashboardHeaderSnapshot(
  database: FarSygilDatabase,
  nowUnix: number = Math.floor(Date.now() / 1000),
): Promise<DashboardHeaderSnapshot> {
  const status = await getStravaConnectionStatus(database, nowUnix);
  const logs = await getRecentStravaSyncLogs(database, 8);
  const latestSuccessfulSync =
    logs.find((row) => row.eventType === "sync_complete") ?? null;

  if (!status.connected) {
    return {
      statusLabel: "Strava not connected",
      statusState: "disconnected",
      lastSyncedAt:
        latestSuccessfulSync?.completedAt ?? latestSuccessfulSync?.startedAt ?? null,
    };
  }

  if (status.expired) {
    return {
      statusLabel: "Strava token expired",
      statusState: "disconnected",
      lastSyncedAt:
        latestSuccessfulSync?.completedAt ?? latestSuccessfulSync?.startedAt ?? null,
    };
  }

  return {
    statusLabel: "Strava connected",
    statusState: "connected",
    lastSyncedAt:
      latestSuccessfulSync?.completedAt ?? latestSuccessfulSync?.startedAt ?? null,
  };
}

export async function getDashboardRunningSnapshot(
  database: FarSygilDatabase,
  now: Date = new Date(),
): Promise<DashboardRunningSnapshot> {
  const { start, endExclusive, weekStartDate, weekEndDate } = getWeekWindow(now);
  const recentRun = await getMostRecentRun(database);
  const weeklyRows = await database
    .select({
      id: activities.id,
      name: activities.name,
      sportType: activities.sportType,
      startDate: activities.startDate,
      startDateLocal: activities.startDateLocal,
      distanceMeters: activities.distanceMeters,
      movingTimeSeconds: activities.movingTimeSeconds,
      totalElevationGain: activities.totalElevationGain,
      averageHeartrate: activities.averageHeartrate,
      averageCadence: activities.averageCadence,
    })
    .from(activities)
    .where(
      and(
        eq(activities.source, "strava"),
        inArray(activities.sportType, [...RUN_SPORTS]),
        gte(activities.startDate, start.toISOString()),
        lt(activities.startDate, endExclusive.toISOString()),
      ),
    )
    .orderBy(desc(activities.startDate));

  const longestRun = getLongestRun(weeklyRows);
  const totalDistanceMeters = sumNumber(
    weeklyRows.map((row) => row.distanceMeters).filter(isNumber),
  );
  const totalMovingTimeSeconds = sumNumber(
    weeklyRows.map((row) => row.movingTimeSeconds).filter(isNumber),
  );
  const totalElevationGain = sumNumber(
    weeklyRows.map((row) => row.totalElevationGain).filter(isNumber),
  );

  const averagePaceSecondsPerMile =
    totalDistanceMeters > 0 && totalMovingTimeSeconds > 0
      ? totalMovingTimeSeconds / metersToMiles(totalDistanceMeters)
      : null;

  const averageCadence = weightedAverage(
    weeklyRows,
    (row) => row.averageCadence,
    (row) => row.movingTimeSeconds,
  );
  const averageHeartrate = weightedAverage(
    weeklyRows,
    (row) => row.averageHeartrate,
    (row) => row.movingTimeSeconds,
  );

  const dailyBuckets = createDailyBuckets(start);

  for (const row of weeklyRows) {
    const key = getLocalDateKey(row.startDateLocal ?? row.startDate);

    if (!key) {
      continue;
    }

    const bucket = dailyBuckets.get(key);

    if (!bucket) {
      continue;
    }

    if (isNumber(row.distanceMeters)) {
      bucket.distanceMeters += row.distanceMeters;
    }

    if (isNumber(row.movingTimeSeconds)) {
      bucket.movingTimeSeconds += row.movingTimeSeconds;
    }

    if (isNumber(row.totalElevationGain)) {
      bucket.totalElevationGain += row.totalElevationGain;
    }

    if (isNumber(row.averageCadence) && isPositiveNumber(row.movingTimeSeconds)) {
      bucket.cadenceWeighted += row.averageCadence * row.movingTimeSeconds;
      bucket.cadenceWeight += row.movingTimeSeconds;
    }

    if (isNumber(row.averageHeartrate) && isPositiveNumber(row.movingTimeSeconds)) {
      bucket.heartrateWeighted += row.averageHeartrate * row.movingTimeSeconds;
      bucket.heartrateWeight += row.movingTimeSeconds;
    }
  }

  const orderedBuckets = [...dailyBuckets.values()];
  const distanceSeriesMiles = buildDistanceSeriesMiles(orderedBuckets);
  const movingTimeSeriesMinutes = buildMovingTimeSeriesMinutes(orderedBuckets);
  const elevationSeriesFeet = buildElevationSeriesFeet(orderedBuckets);
  const paceSeriesSecondsPerMile = buildPaceSeries(orderedBuckets);
  const cadenceSeries = buildWeightedSeries(
    orderedBuckets.map((bucket) => ({
      weighted: bucket.cadenceWeighted,
      weight: bucket.cadenceWeight,
    })),
  );
  const heartrateSeries = buildWeightedSeries(
    orderedBuckets.map((bucket) => ({
      weighted: bucket.heartrateWeighted,
      weight: bucket.heartrateWeight,
    })),
  );

  return {
    weekStartDate,
    weekEndDate,
    runCount: weeklyRows.length,
    totalDistanceMeters,
    totalMovingTimeSeconds,
    totalElevationGain,
    averagePaceSecondsPerMile,
    averageCadence,
    averageHeartrate,
    distanceSeriesMiles,
    movingTimeSeriesMinutes,
    elevationSeriesFeet,
    paceSeriesSecondsPerMile,
    cadenceSeries,
    heartrateSeries,
    recentRun,
    longestRun,
  };
}

async function getMostRecentRun(
  database: FarSygilDatabase,
): Promise<DashboardRunSnapshot | null> {
  const [row] = await database
    .select({
      id: activities.id,
      name: activities.name,
      sportType: activities.sportType,
      startDate: activities.startDate,
      startDateLocal: activities.startDateLocal,
      distanceMeters: activities.distanceMeters,
      movingTimeSeconds: activities.movingTimeSeconds,
      totalElevationGain: activities.totalElevationGain,
      averageHeartrate: activities.averageHeartrate,
      averageCadence: activities.averageCadence,
    })
    .from(activities)
    .where(
      and(
        eq(activities.source, "strava"),
        inArray(activities.sportType, [...RUN_SPORTS]),
      ),
    )
    .orderBy(desc(activities.startDate))
    .limit(1);

  return row ?? null;
}

function getLongestRun(
  rows: DashboardRunRow[],
): DashboardRunSnapshot | null {
  let longest: DashboardRunRow | null = null;

  for (const row of rows) {
    if (!longest) {
      longest = row;
      continue;
    }

    const nextDistance = row.distanceMeters ?? -1;
    const longestDistance = longest.distanceMeters ?? -1;

    if (nextDistance > longestDistance) {
      longest = row;
    }
  }

  return longest;
}

function getWeekWindow(now: Date) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const day = start.getDay();
  const daysFromMonday = (day + 6) % 7;
  start.setDate(start.getDate() - daysFromMonday);

  const endExclusive = new Date(start);
  endExclusive.setDate(endExclusive.getDate() + 7);

  const inclusiveEnd = new Date(endExclusive);
  inclusiveEnd.setDate(inclusiveEnd.getDate() - 1);

  return {
    start,
    endExclusive,
    weekStartDate: getDateOnly(start),
    weekEndDate: getDateOnly(inclusiveEnd),
  };
}

function createDailyBuckets(start: Date) {
  const buckets = new Map<
    string,
    {
      key: string;
      distanceMeters: number;
      movingTimeSeconds: number;
      cadenceWeighted: number;
      cadenceWeight: number;
      heartrateWeighted: number;
      heartrateWeight: number;
      totalElevationGain: number;
    }
  >();

  for (let index = 0; index < 7; index += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = getDateOnly(date);

    buckets.set(key, {
      key,
      distanceMeters: 0,
      movingTimeSeconds: 0,
      cadenceWeighted: 0,
      cadenceWeight: 0,
      heartrateWeighted: 0,
      heartrateWeight: 0,
      totalElevationGain: 0,
    });
  }

  return buckets;
}

function buildDistanceSeriesMiles(
  buckets: Array<{ distanceMeters: number }>,
): number[] {
  const values = buckets.map((bucket) => metersToMiles(bucket.distanceMeters));
  return values.some((value) => value > 0) ? values : [];
}

function buildPaceSeries(
  buckets: Array<{ distanceMeters: number; movingTimeSeconds: number }>,
): number[] {
  const values = buckets
    .filter(
      (bucket) => bucket.distanceMeters > 0 && bucket.movingTimeSeconds > 0,
    )
    .map(
      (bucket) =>
        bucket.movingTimeSeconds / metersToMiles(bucket.distanceMeters),
    );

  return values.length >= 2 ? values : [];
}

function buildMovingTimeSeriesMinutes(
  buckets: Array<{ movingTimeSeconds: number }>,
): number[] {
  const values = buckets.map((bucket) => Math.round(bucket.movingTimeSeconds / 60));
  return values.some((value) => value > 0) ? values : [];
}

function buildElevationSeriesFeet(
  buckets: Array<{ totalElevationGain: number }>,
): number[] {
  const values = buckets.map((bucket) =>
    Math.round(metersToFeet(bucket.totalElevationGain)),
  );
  return values.some((value) => value > 0) ? values : [];
}

function buildWeightedSeries(
  values: Array<{ weighted: number; weight: number }>,
): number[] {
  const resolved = values
    .filter((value) => value.weight > 0)
    .map((value) => value.weighted / value.weight);

  return resolved.length >= 2 ? resolved : [];
}

function weightedAverage<T>(
  rows: T[],
  valueSelector: (row: T) => number | null,
  weightSelector: (row: T) => number | null,
): number | null {
  let weightedTotal = 0;
  let weightTotal = 0;

  for (const row of rows) {
    const value = valueSelector(row);
    const weight = weightSelector(row);

    if (!isNumber(value) || !isPositiveNumber(weight)) {
      continue;
    }

    weightedTotal += value * weight;
    weightTotal += weight;
  }

  return weightTotal > 0 ? weightedTotal / weightTotal : null;
}

function sumNumber(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function getLocalDateKey(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return getDateOnly(date);
}

function getDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isNumber(value: number | null): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isPositiveNumber(value: number | null): value is number {
  return isNumber(value) && value > 0;
}

