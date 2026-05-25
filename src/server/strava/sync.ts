import { desc, eq, inArray, sql } from "drizzle-orm";
import { activities, activityRawJson, dataImportLogs } from "@/db/schema";
import {
  STRAVA_ACTIVITIES_PER_PAGE,
  STRAVA_ACTIVITIES_URL,
  STRAVA_SUMMARY_SYNC_MAX_RETRIES,
  STRAVA_SUMMARY_SYNC_RETRY_BASE_MS,
  STRAVA_SYNC_REFRESH_LEEWAY_SECONDS,
} from "@/server/strava/constants";
import {
  getValidStravaAccessToken,
  StravaOAuthError,
  type FarSygilDatabase,
  type StravaOAuthConfig,
} from "@/server/strava/oauth";

type FetchImplementation = typeof fetch;
type SleepImplementation = (milliseconds: number) => Promise<void>;

interface StravaSummaryActivity {
  id: number;
  name?: unknown;
  sport_type?: unknown;
  start_date?: unknown;
  start_date_local?: unknown;
  timezone?: unknown;
  distance?: unknown;
  moving_time?: unknown;
  elapsed_time?: unknown;
  total_elevation_gain?: unknown;
  average_speed?: unknown;
  max_speed?: unknown;
  average_heartrate?: unknown;
  max_heartrate?: unknown;
  average_cadence?: unknown;
  average_watts?: unknown;
  suffer_score?: unknown;
  perceived_exertion?: unknown;
  start_latlng?: unknown;
  map?: unknown;
  gear_id?: unknown;
}

export interface StravaSyncResult {
  mode: "initial" | "incremental";
  afterUnix: number | null;
  activitiesFetched: number;
  activitiesAdded: number;
  activitiesUpdated: number;
  pagesFetched: number;
}

export type StravaSyncErrorCode =
  | "not_connected"
  | "fetch_failed"
  | "invalid_response"
  | "storage_failed";

export class StravaSyncError extends Error {
  constructor(
    message: string,
    public readonly code: StravaSyncErrorCode,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "StravaSyncError";
  }
}

export async function syncStravaActivities(options: {
  database: FarSygilDatabase;
  config: StravaOAuthConfig;
  fetchImplementation?: FetchImplementation;
  sleepImplementation?: SleepImplementation;
  nowUnix?: number;
  errorLogger?: (message: string) => void;
}): Promise<StravaSyncResult> {
  const {
    database,
    config,
    fetchImplementation = fetch,
    sleepImplementation = sleep,
    nowUnix = Math.floor(Date.now() / 1000),
    errorLogger,
  } = options;
  const afterUnix = await getLatestStravaActivityTimestamp(database);
  const mode = afterUnix ? "incremental" : "initial";
  const result: StravaSyncResult = {
    mode,
    afterUnix,
    activitiesFetched: 0,
    activitiesAdded: 0,
    activitiesUpdated: 0,
    pagesFetched: 0,
  };

  try {
    const { accessToken } = await getValidStravaAccessToken({
      database,
      config,
      fetchImplementation,
      nowUnix,
      leewaySeconds: STRAVA_SYNC_REFRESH_LEEWAY_SECONDS,
      errorLogger,
    });

    await insertSyncLog(database, {
      eventType: "sync_start",
      message: `Strava ${mode} sync started.`,
    });

    for (let page = 1; ; page += 1) {
      const summaries = await fetchStravaActivityPage({
        accessToken,
        page,
        afterUnix,
        fetchImplementation,
        sleepImplementation,
      });

      if (summaries.length === 0) {
        break;
      }

      const pageResult = await upsertActivitySummaries(database, summaries);
      result.activitiesFetched += summaries.length;
      result.activitiesAdded += pageResult.activitiesAdded;
      result.activitiesUpdated += pageResult.activitiesUpdated;
      result.pagesFetched += 1;
    }

    await insertSyncLog(database, {
      eventType: "sync_complete",
      message: `Strava ${mode} sync completed.`,
      activitiesAdded: result.activitiesAdded,
      activitiesUpdated: result.activitiesUpdated,
      completedAtNow: true,
    });

    return result;
  } catch (error) {
    const syncError = toStravaSyncError(error);
    errorLogger?.(`[strava-sync] ${syncError.message}`);

    try {
      await insertSyncLog(database, {
        eventType: "sync_error",
        message: syncError.message,
        activitiesAdded: result.activitiesAdded,
        activitiesUpdated: result.activitiesUpdated,
        errorsCount: 1,
        completedAtNow: true,
      });
    } catch (logError) {
      errorLogger?.(
        `[strava-sync] failed to write sync error log: ${getErrorMessage(logError)}`,
      );
    }

    throw syncError;
  }
}

async function fetchStravaActivityPage(options: {
  accessToken: string;
  page: number;
  afterUnix: number | null;
  fetchImplementation: FetchImplementation;
  sleepImplementation: SleepImplementation;
}): Promise<StravaSummaryActivity[]> {
  const { accessToken, page, afterUnix, fetchImplementation, sleepImplementation } =
    options;
  const url = new URL(STRAVA_ACTIVITIES_URL);
  url.searchParams.set("per_page", String(STRAVA_ACTIVITIES_PER_PAGE));
  url.searchParams.set("page", String(page));

  if (afterUnix) {
    url.searchParams.set("after", String(afterUnix));
  }

  let response: Response | null = null;

  for (let attempt = 0; attempt < STRAVA_SUMMARY_SYNC_MAX_RETRIES; attempt += 1) {
    try {
      response = await fetchImplementation(url.toString(), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      });
    } catch (error) {
      if (attempt === STRAVA_SUMMARY_SYNC_MAX_RETRIES - 1) {
        throw new StravaSyncError(
          "Failed to reach Strava activities endpoint",
          "fetch_failed",
          error,
        );
      }

      await sleepImplementation(getRetryDelayMilliseconds(null, attempt));
      continue;
    }

    if (
      !response.ok &&
      isRetryableStatus(response.status) &&
      attempt < STRAVA_SUMMARY_SYNC_MAX_RETRIES - 1
    ) {
      await sleepImplementation(
        getRetryDelayMilliseconds(response.headers.get("Retry-After"), attempt),
      );
      continue;
    }

    break;
  }

  if (!response) {
    throw new StravaSyncError(
      "Failed to reach Strava activities endpoint",
      "fetch_failed",
    );
  }

  if (!response.ok) {
    let body = "";

    try {
      body = await response.text();
    } catch {
      body = "";
    }

    throw new StravaSyncError(
      `Strava activities fetch failed (HTTP ${response.status})${body ? `: ${body.slice(0, 200)}` : ""}`,
      "fetch_failed",
    );
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch (error) {
    throw new StravaSyncError(
      "Invalid JSON from Strava activities endpoint",
      "invalid_response",
      error,
    );
  }

  return parseStravaActivityPage(payload);
}

function isRetryableStatus(status: number): boolean {
  return (
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
}

function getRetryDelayMilliseconds(
  retryAfterHeader: string | null,
  attempt: number,
): number {
  const retryAfterSeconds = parseRetryAfterHeader(retryAfterHeader);

  if (retryAfterSeconds !== null) {
    return retryAfterSeconds * 1000;
  }

  return STRAVA_SUMMARY_SYNC_RETRY_BASE_MS * 2 ** attempt;
}

function parseRetryAfterHeader(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const seconds = Number(value);

  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds;
  }

  const dateMilliseconds = Date.parse(value);

  if (!Number.isNaN(dateMilliseconds)) {
    return Math.max(0, Math.ceil((dateMilliseconds - Date.now()) / 1000));
  }

  return null;
}

async function upsertActivitySummaries(
  database: FarSygilDatabase,
  summaries: StravaSummaryActivity[],
): Promise<{ activitiesAdded: number; activitiesUpdated: number }> {
  const stravaIds = summaries.map((summary) => summary.id);
  const existingRows = await database
    .select({
      stravaId: activities.stravaId,
    })
    .from(activities)
    .where(inArray(activities.stravaId, stravaIds));
  const existingIds = new Set(
    existingRows
      .map((row) => row.stravaId)
      .filter((value): value is number => typeof value === "number"),
  );
  const normalizedRows = summaries.map(normalizeActivitySummary);
  const rawRows = summaries.map((summary) => ({
    stravaId: summary.id,
    payloadType: "summary_activity" as const,
    rawJson: JSON.stringify(summary),
  }));

  try {
    await database.transaction(async (transaction) => {
      await transaction
        .insert(activities)
        .values(normalizedRows)
        .onConflictDoUpdate({
          target: activities.stravaId,
          set: {
            name: sql`excluded.name`,
            sportType: sql`excluded.sport_type`,
            startDate: sql`excluded.start_date`,
            startDateLocal: sql`excluded.start_date_local`,
            timezone: sql`excluded.timezone`,
            distanceMeters: sql`excluded.distance_meters`,
            movingTimeSeconds: sql`excluded.moving_time_seconds`,
            elapsedTimeSeconds: sql`excluded.elapsed_time_seconds`,
            totalElevationGain: sql`excluded.total_elevation_gain`,
            averageSpeed: sql`excluded.average_speed`,
            maxSpeed: sql`excluded.max_speed`,
            averageHeartrate: sql`excluded.average_heartrate`,
            maxHeartrate: sql`excluded.max_heartrate`,
            averageCadence: sql`excluded.average_cadence`,
            averageWatts: sql`excluded.average_watts`,
            sufferScore: sql`excluded.suffer_score`,
            perceivedExertion: sql`excluded.perceived_exertion`,
            startLatitude: sql`excluded.start_latitude`,
            startLongitude: sql`excluded.start_longitude`,
            mapPolyline: sql`excluded.map_polyline`,
            gearId: sql`excluded.gear_id`,
            source: sql`excluded.source`,
            updatedAt: sql`(datetime('now'))`,
          },
        });

      await transaction
        .insert(activityRawJson)
        .values(rawRows)
        .onConflictDoUpdate({
          target: [activityRawJson.stravaId, activityRawJson.payloadType],
          set: {
            rawJson: sql`excluded.raw_json`,
            fetchedAt: sql`(datetime('now'))`,
          },
        });
    });
  } catch (error) {
    throw new StravaSyncError(
      "Failed to persist synced Strava activities",
      "storage_failed",
      error,
    );
  }

  const activitiesUpdated = summaries.filter((summary) =>
    existingIds.has(summary.id),
  ).length;

  return {
    activitiesAdded: summaries.length - activitiesUpdated,
    activitiesUpdated,
  };
}

function normalizeActivitySummary(summary: StravaSummaryActivity) {
  const [startLatitude, startLongitude] = readLatLng(summary.start_latlng);
  const mapPolyline = readSummaryPolyline(summary.map);

  return {
    stravaId: summary.id,
    name: readOptionalString(summary.name),
    sportType: readOptionalString(summary.sport_type),
    startDate: readOptionalString(summary.start_date),
    startDateLocal: readOptionalString(summary.start_date_local),
    timezone: readOptionalString(summary.timezone),
    distanceMeters: readOptionalNumber(summary.distance),
    movingTimeSeconds: readOptionalInteger(summary.moving_time),
    elapsedTimeSeconds: readOptionalInteger(summary.elapsed_time),
    totalElevationGain: readOptionalNumber(summary.total_elevation_gain),
    averageSpeed: readOptionalNumber(summary.average_speed),
    maxSpeed: readOptionalNumber(summary.max_speed),
    averageHeartrate: readOptionalNumber(summary.average_heartrate),
    maxHeartrate: readOptionalNumber(summary.max_heartrate),
    averageCadence: readOptionalNumber(summary.average_cadence),
    averageWatts: readOptionalNumber(summary.average_watts),
    sufferScore: readOptionalInteger(summary.suffer_score),
    perceivedExertion: readOptionalNumber(summary.perceived_exertion),
    startLatitude,
    startLongitude,
    mapPolyline,
    gearId: readOptionalString(summary.gear_id),
    source: "strava" as const,
  };
}

async function getLatestStravaActivityTimestamp(
  database: FarSygilDatabase,
): Promise<number | null> {
  const [latestActivity] = await database
    .select({
      startDate: activities.startDate,
    })
    .from(activities)
    .where(eq(activities.source, "strava"))
    .orderBy(desc(activities.startDate))
    .limit(1);

  if (!latestActivity?.startDate) {
    return null;
  }

  const timestamp = Date.parse(latestActivity.startDate);
  return Number.isFinite(timestamp) ? Math.floor(timestamp / 1000) : null;
}

async function insertSyncLog(
  database: FarSygilDatabase,
  options: {
    eventType: "sync_start" | "sync_complete" | "sync_error";
    message: string;
    activitiesAdded?: number;
    activitiesUpdated?: number;
    errorsCount?: number;
    completedAtNow?: boolean;
  },
): Promise<void> {
  const {
    eventType,
    message,
    activitiesAdded = 0,
    activitiesUpdated = 0,
    errorsCount = 0,
    completedAtNow = false,
  } = options;

  await database.insert(dataImportLogs).values({
    source: "strava",
    eventType,
    message,
    activitiesAdded,
    activitiesUpdated,
    errorsCount,
    completedAt: completedAtNow ? sql`(datetime('now'))` : null,
  });
}

function parseStravaActivityPage(payload: unknown): StravaSummaryActivity[] {
  if (!Array.isArray(payload)) {
    throw new StravaSyncError(
      "Strava activities response was not an array",
      "invalid_response",
    );
  }

  return payload.map((candidate, index) => parseSummaryActivity(candidate, index));
}

function parseSummaryActivity(
  payload: unknown,
  index: number,
): StravaSummaryActivity {
  if (!payload || typeof payload !== "object") {
    throw new StravaSyncError(
      `Strava activity at index ${index} was not an object`,
      "invalid_response",
    );
  }

  const candidate = payload as Partial<StravaSummaryActivity>;

  if (typeof candidate.id !== "number") {
    throw new StravaSyncError(
      `Strava activity at index ${index} was missing a numeric id`,
      "invalid_response",
    );
  }

  return candidate as StravaSummaryActivity;
}

function readOptionalString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function readOptionalNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readOptionalInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.trunc(value)
    : null;
}

function readLatLng(value: unknown): [number | null, number | null] {
  if (!Array.isArray(value) || value.length < 2) {
    return [null, null];
  }

  const latitude = readOptionalNumber(value[0]);
  const longitude = readOptionalNumber(value[1]);
  return [latitude, longitude];
}

function readSummaryPolyline(value: unknown): string | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as { summary_polyline?: unknown };
  return typeof candidate.summary_polyline === "string"
    ? candidate.summary_polyline
    : null;
}

function toStravaSyncError(error: unknown): StravaSyncError {
  if (error instanceof StravaSyncError) {
    return error;
  }

  if (error instanceof StravaOAuthError) {
    if (error.message === "No stored Strava token found") {
      return new StravaSyncError(
        "No stored Strava connection found for sync",
        "not_connected",
        error,
      );
    }

    return new StravaSyncError(
      `Failed to prepare Strava access token for sync: ${error.message}`,
      "fetch_failed",
      error,
    );
  }

  return new StravaSyncError(
    getErrorMessage(error),
    "storage_failed",
    error,
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
