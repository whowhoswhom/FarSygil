import {
  and,
  desc,
  eq,
  inArray,
  isNotNull,
  sql,
} from "drizzle-orm";

import {
  activities,
  activityRawJson,
  activitySplits,
  activityStreams,
  dataImportLogs,
} from "@/db/schema";
import {
  STRAVA_ACTIVITY_URL_BASE,
  STRAVA_DETAIL_STREAM_KEYS,
  STRAVA_DETAIL_SYNC_MAX_RETRIES,
  STRAVA_DETAIL_SYNC_RETRY_BASE_MS,
  STRAVA_SYNC_MAX_RETRY_DELAY_MS,
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

export type StravaDetailSyncMode = "incremental" | "full";

export interface StravaDetailSyncResult {
  mode: StravaDetailSyncMode;
  activitiesScanned: number;
  activitiesSynced: number;
  detailsFetched: number;
  streamsFetched: number;
  splitsWritten: number;
  streamsWritten: number;
  rateLimitRetries: number;
}

export type StravaDetailSyncErrorCode =
  | "not_connected"
  | "fetch_failed"
  | "invalid_response"
  | "storage_failed";

export class StravaDetailSyncError extends Error {
  constructor(
    message: string,
    public readonly code: StravaDetailSyncErrorCode,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "StravaDetailSyncError";
  }
}

interface StravaDetailedActivity {
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
  splits_standard?: unknown;
  splits_metric?: unknown;
}

interface StravaSplit {
  split?: unknown;
  distance?: unknown;
  elapsed_time?: unknown;
  moving_time?: unknown;
  elevation_difference?: unknown;
  average_speed?: unknown;
  average_heartrate?: unknown;
  average_grade_adjusted_speed?: unknown;
  pace_zone?: unknown;
}

interface StravaStreamPayload {
  data?: unknown;
  series_type?: unknown;
  original_size?: unknown;
  resolution?: unknown;
}

interface DetailSyncCandidate {
  activityId: number;
  stravaId: number;
}

export async function syncStravaActivityDetails(options: {
  database: FarSygilDatabase;
  config: StravaOAuthConfig;
  mode?: StravaDetailSyncMode;
  maxActivities?: number;
  fetchImplementation?: FetchImplementation;
  sleepImplementation?: SleepImplementation;
  nowUnix?: number;
  errorLogger?: (message: string) => void;
}): Promise<StravaDetailSyncResult> {
  const {
    database,
    config,
    mode = "incremental",
    maxActivities,
    fetchImplementation = fetch,
    sleepImplementation = sleep,
    nowUnix = Math.floor(Date.now() / 1000),
    errorLogger,
  } = options;

  const result: StravaDetailSyncResult = {
    mode,
    activitiesScanned: 0,
    activitiesSynced: 0,
    detailsFetched: 0,
    streamsFetched: 0,
    splitsWritten: 0,
    streamsWritten: 0,
    rateLimitRetries: 0,
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

    const candidates = limitDetailSyncCandidates(
      await getDetailSyncCandidates(database, mode),
      maxActivities,
    );
    result.activitiesScanned = candidates.length;

    await insertDetailSyncLog(database, {
      eventType: "sync_start",
      message: `Strava ${mode} detail sync started for ${candidates.length} activities.`,
    });

    for (const candidate of candidates) {
      const detailResponse = await fetchJsonWithRetry({
        url: `${STRAVA_ACTIVITY_URL_BASE}/${candidate.stravaId}`,
        accessToken,
        fetchImplementation,
        sleepImplementation,
        operationName: `detail activity ${candidate.stravaId}`,
      });

      const detailedActivity = parseDetailedActivity(detailResponse.payload);

      if (detailedActivity.id !== candidate.stravaId) {
        throw new StravaDetailSyncError(
          `Strava detail payload did not match activity ${candidate.stravaId}`,
          "invalid_response",
        );
      }

      const streamsResponse = await fetchJsonWithRetry({
        url: buildStreamsUrl(candidate.stravaId),
        accessToken,
        fetchImplementation,
        sleepImplementation,
        operationName: `activity streams ${candidate.stravaId}`,
        notFoundPayload: {},
      });

      const upsertResult = await upsertDetailedActivityData(database, {
        candidate,
        detail: detailedActivity,
        streamsPayload: streamsResponse.payload,
      });

      result.activitiesSynced += 1;
      result.detailsFetched += 1;
      result.streamsFetched += streamsResponse.found ? 1 : 0;
      result.splitsWritten += upsertResult.splitsWritten;
      result.streamsWritten += upsertResult.streamsWritten;
      result.rateLimitRetries += detailResponse.retryCount + streamsResponse.retryCount;
    }

    await insertDetailSyncLog(database, {
      eventType: "sync_complete",
      message:
        `Strava ${mode} detail sync completed. ` +
        `${result.activitiesSynced} activities refreshed, ` +
        `${result.splitsWritten} splits written, ` +
        `${result.streamsWritten} streams written.`,
      activitiesUpdated: result.activitiesSynced,
      completedAtNow: true,
    });

    return result;
  } catch (error) {
    const detailSyncError = toStravaDetailSyncError(error);
    errorLogger?.(`[strava-detail-sync] ${detailSyncError.message}`);

    try {
      await insertDetailSyncLog(database, {
        eventType: "sync_error",
        message: detailSyncError.message,
        activitiesUpdated: result.activitiesSynced,
        errorsCount: 1,
        completedAtNow: true,
      });
    } catch (logError) {
      errorLogger?.(
        `[strava-detail-sync] failed to write sync error log: ${getErrorMessage(logError)}`,
      );
    }

    throw detailSyncError;
  }
}

function limitDetailSyncCandidates(
  candidates: DetailSyncCandidate[],
  maxActivities: number | undefined,
): DetailSyncCandidate[] {
  if (
    typeof maxActivities !== "number" ||
    !Number.isFinite(maxActivities) ||
    maxActivities <= 0
  ) {
    return candidates;
  }

  return candidates.slice(0, Math.trunc(maxActivities));
}

function buildStreamsUrl(stravaId: number): string {
  const url = new URL(`${STRAVA_ACTIVITY_URL_BASE}/${stravaId}/streams`);
  url.searchParams.set("keys", STRAVA_DETAIL_STREAM_KEYS.join(","));
  url.searchParams.set("key_by_type", "true");
  return url.toString();
}

async function getDetailSyncCandidates(
  database: FarSygilDatabase,
  mode: StravaDetailSyncMode,
): Promise<DetailSyncCandidate[]> {
  const activityRows = await database
    .select({
      activityId: activities.id,
      stravaId: activities.stravaId,
    })
    .from(activities)
    .where(
      and(eq(activities.source, "strava"), isNotNull(activities.stravaId)),
    )
    .orderBy(desc(activities.startDate));

  const candidates = activityRows.filter(
    (row): row is DetailSyncCandidate =>
      typeof row.activityId === "number" && typeof row.stravaId === "number",
  );

  if (mode === "full" || candidates.length === 0) {
    return candidates;
  }

  const payloadRows = await database
    .select({
      stravaId: activityRawJson.stravaId,
      payloadType: activityRawJson.payloadType,
    })
    .from(activityRawJson)
    .where(
      and(
        inArray(
          activityRawJson.stravaId,
          candidates.map((candidate) => candidate.stravaId),
        ),
        inArray(activityRawJson.payloadType, ["detailed_activity", "streams"]),
      ),
    );

  const payloadMap = new Map<number, Set<string>>();

  for (const row of payloadRows) {
    const existing = payloadMap.get(row.stravaId) ?? new Set<string>();
    existing.add(row.payloadType);
    payloadMap.set(row.stravaId, existing);
  }

  return candidates.filter((candidate) => {
    const payloadTypes = payloadMap.get(candidate.stravaId);

    if (!payloadTypes) {
      return true;
    }

    return (
      !payloadTypes.has("detailed_activity") || !payloadTypes.has("streams")
    );
  });
}

async function fetchJsonWithRetry(options: {
  url: string;
  accessToken: string;
  fetchImplementation: FetchImplementation;
  sleepImplementation: SleepImplementation;
  operationName: string;
  notFoundPayload?: unknown;
}): Promise<{ payload: unknown; retryCount: number; found: boolean }> {
  const {
    url,
    accessToken,
    fetchImplementation,
    sleepImplementation,
    operationName,
    notFoundPayload,
  } = options;

  let retryCount = 0;

  for (let attempt = 0; attempt < STRAVA_DETAIL_SYNC_MAX_RETRIES; attempt += 1) {
    let response: Response;

    try {
      response = await fetchImplementation(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      });
    } catch (error) {
      if (attempt === STRAVA_DETAIL_SYNC_MAX_RETRIES - 1) {
        throw new StravaDetailSyncError(
          `Failed to reach Strava during ${operationName}`,
          "fetch_failed",
          error,
        );
      }

      retryCount += 1;
      await sleepImplementation(getRetryDelayMilliseconds(null, attempt));
      continue;
    }

    if (!response.ok) {
      if (response.status === 404 && notFoundPayload !== undefined) {
        return {
          payload: notFoundPayload,
          retryCount,
          found: false,
        };
      }

      const retryAfter = response.headers.get("Retry-After");

      if (isRetryableStatus(response.status) && attempt < STRAVA_DETAIL_SYNC_MAX_RETRIES - 1) {
        retryCount += 1;
        await sleepImplementation(
          getRetryDelayMilliseconds(retryAfter, attempt),
        );
        continue;
      }

      let body = "";

      try {
        body = await response.text();
      } catch {
        body = "";
      }

      throw new StravaDetailSyncError(
        `Strava ${operationName} failed (HTTP ${response.status})${body ? `: ${body.slice(0, 200)}` : ""}`,
        "fetch_failed",
      );
    }

    try {
      return {
        payload: await response.json(),
        retryCount,
        found: true,
      };
    } catch (error) {
      throw new StravaDetailSyncError(
        `Invalid JSON from Strava during ${operationName}`,
        "invalid_response",
        error,
      );
    }
  }

  throw new StravaDetailSyncError(
    `Strava ${operationName} exhausted retry attempts`,
    "fetch_failed",
  );
}

async function upsertDetailedActivityData(
  database: FarSygilDatabase,
  options: {
    candidate: DetailSyncCandidate;
    detail: StravaDetailedActivity;
    streamsPayload: unknown;
  },
): Promise<{ splitsWritten: number; streamsWritten: number }> {
  const { candidate, detail, streamsPayload } = options;
  const normalizedActivity = normalizeDetailedActivity(detail);
  const splitRows = parseDetailSplits(detail).map((split) => ({
    activityId: candidate.activityId,
    ...split,
  }));
  const streamRows = parseStreamRows(candidate.activityId, streamsPayload);

  try {
    await database.transaction(async (transaction) => {
      await transaction
        .insert(activities)
        .values(normalizedActivity)
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
        .values([
          {
            stravaId: candidate.stravaId,
            payloadType: "detailed_activity" as const,
            rawJson: JSON.stringify(detail),
          },
          {
            stravaId: candidate.stravaId,
            payloadType: "streams" as const,
            rawJson: JSON.stringify(streamsPayload),
          },
        ])
        .onConflictDoUpdate({
          target: [activityRawJson.stravaId, activityRawJson.payloadType],
          set: {
            rawJson: sql`excluded.raw_json`,
            fetchedAt: sql`(datetime('now'))`,
          },
        });

      await transaction
        .delete(activitySplits)
        .where(eq(activitySplits.activityId, candidate.activityId));

      if (splitRows.length > 0) {
        await transaction.insert(activitySplits).values(splitRows);
      }

      await transaction
        .delete(activityStreams)
        .where(eq(activityStreams.activityId, candidate.activityId));

      if (streamRows.length > 0) {
        await transaction.insert(activityStreams).values(streamRows);
      }
    });
  } catch (error) {
    throw new StravaDetailSyncError(
      `Failed to persist detailed Strava activity ${candidate.stravaId}`,
      "storage_failed",
      error,
    );
  }

  return {
    splitsWritten: splitRows.length,
    streamsWritten: streamRows.length,
  };
}

function normalizeDetailedActivity(detail: StravaDetailedActivity) {
  const [startLatitude, startLongitude] = readLatLng(detail.start_latlng);
  const mapPolyline = readSummaryPolyline(detail.map);

  return {
    stravaId: detail.id,
    name: readOptionalString(detail.name),
    sportType: readOptionalString(detail.sport_type),
    startDate: readOptionalString(detail.start_date),
    startDateLocal: readOptionalString(detail.start_date_local),
    timezone: readOptionalString(detail.timezone),
    distanceMeters: readOptionalNumber(detail.distance),
    movingTimeSeconds: readOptionalInteger(detail.moving_time),
    elapsedTimeSeconds: readOptionalInteger(detail.elapsed_time),
    totalElevationGain: readOptionalNumber(detail.total_elevation_gain),
    averageSpeed: readOptionalNumber(detail.average_speed),
    maxSpeed: readOptionalNumber(detail.max_speed),
    averageHeartrate: readOptionalNumber(detail.average_heartrate),
    maxHeartrate: readOptionalNumber(detail.max_heartrate),
    averageCadence: readOptionalNumber(detail.average_cadence),
    averageWatts: readOptionalNumber(detail.average_watts),
    sufferScore: readOptionalInteger(detail.suffer_score),
    perceivedExertion: readOptionalNumber(detail.perceived_exertion),
    startLatitude,
    startLongitude,
    mapPolyline,
    gearId: readOptionalString(detail.gear_id),
    source: "strava" as const,
  };
}

function parseDetailedActivity(payload: unknown): StravaDetailedActivity {
  if (!payload || typeof payload !== "object") {
    throw new StravaDetailSyncError(
      "Strava detailed activity payload was not an object",
      "invalid_response",
    );
  }

  const candidate = payload as Partial<StravaDetailedActivity>;

  if (typeof candidate.id !== "number") {
    throw new StravaDetailSyncError(
      "Strava detailed activity payload was missing a numeric id",
      "invalid_response",
    );
  }

  return candidate as StravaDetailedActivity;
}

function parseDetailSplits(detail: StravaDetailedActivity) {
  const source = Array.isArray(detail.splits_standard) && detail.splits_standard.length > 0
    ? detail.splits_standard
    : Array.isArray(detail.splits_metric)
      ? detail.splits_metric
      : [];

  return source
    .map((split, index) => parseSplitRow(split, index))
    .filter((split): split is ParsedSplitRow => split !== null);
}

interface ParsedSplitRow {
  splitIndex: number;
  distanceMeters: number | null;
  elapsedTimeSeconds: number | null;
  movingTimeSeconds: number | null;
  elevationDifference: number | null;
  averageSpeed: number | null;
  averageHeartrate: number | null;
  averageGradeAdjustedSpeed: number | null;
  paceZone: number | null;
}

function parseSplitRow(split: unknown, index: number): ParsedSplitRow | null {
  if (!split || typeof split !== "object") {
    return null;
  }

  const candidate = split as StravaSplit;
  const splitIndex = readOptionalInteger(candidate.split) ?? index + 1;

  return {
    splitIndex,
    distanceMeters: readOptionalNumber(candidate.distance),
    elapsedTimeSeconds: readOptionalInteger(candidate.elapsed_time),
    movingTimeSeconds: readOptionalInteger(candidate.moving_time),
    elevationDifference: readOptionalNumber(candidate.elevation_difference),
    averageSpeed: readOptionalNumber(candidate.average_speed),
    averageHeartrate: readOptionalNumber(candidate.average_heartrate),
    averageGradeAdjustedSpeed: readOptionalNumber(
      candidate.average_grade_adjusted_speed,
    ),
    paceZone: readOptionalInteger(candidate.pace_zone),
  };
}

function parseStreamRows(activityId: number, payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new StravaDetailSyncError(
      "Strava streams payload was not an object",
      "invalid_response",
    );
  }

  const candidate = payload as Record<string, unknown>;
  const rows: Array<{
    activityId: number;
    streamType: string;
    data: string;
    seriesType: string | null;
    originalSize: number | null;
    resolution: string | null;
  }> = [];

  for (const key of STRAVA_DETAIL_STREAM_KEYS) {
    const stream = candidate[key];

    if (stream == null) {
      continue;
    }

    if (!stream || typeof stream !== "object") {
      throw new StravaDetailSyncError(
        `Strava stream ${key} was not an object`,
        "invalid_response",
      );
    }

    const parsed = stream as StravaStreamPayload;

    if (!Array.isArray(parsed.data)) {
      throw new StravaDetailSyncError(
        `Strava stream ${key} was missing an array data field`,
        "invalid_response",
      );
    }

    rows.push({
      activityId,
      streamType: key,
      data: JSON.stringify(parsed.data),
      seriesType: readOptionalString(parsed.series_type),
      originalSize: readOptionalInteger(parsed.original_size),
      resolution: readOptionalString(parsed.resolution),
    });
  }

  return rows;
}

async function insertDetailSyncLog(
  database: FarSygilDatabase,
  options: {
    eventType: "sync_start" | "sync_complete" | "sync_error";
    message: string;
    activitiesUpdated?: number;
    errorsCount?: number;
    completedAtNow?: boolean;
  },
): Promise<void> {
  const {
    eventType,
    message,
    activitiesUpdated = 0,
    errorsCount = 0,
    completedAtNow = false,
  } = options;

  await database.insert(dataImportLogs).values({
    source: "strava",
    eventType,
    message,
    activitiesAdded: 0,
    activitiesUpdated,
    errorsCount,
    completedAt: completedAtNow ? sql`(datetime('now'))` : null,
  });
}

function getRetryDelayMilliseconds(
  retryAfterHeader: string | null,
  attempt: number,
): number {
  const parsedRetryAfter = parseRetryAfterHeader(retryAfterHeader);

  if (parsedRetryAfter != null) {
    return Math.min(parsedRetryAfter, STRAVA_SYNC_MAX_RETRY_DELAY_MS);
  }

  return Math.min(
    STRAVA_DETAIL_SYNC_RETRY_BASE_MS * 2 ** attempt,
    STRAVA_SYNC_MAX_RETRY_DELAY_MS,
  );
}

function parseRetryAfterHeader(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const numericSeconds = Number(value);

  if (Number.isFinite(numericSeconds) && numericSeconds >= 0) {
    return Math.round(numericSeconds * 1000);
  }

  const retryDate = Date.parse(value);

  if (!Number.isFinite(retryDate)) {
    return null;
  }

  return Math.max(0, retryDate - Date.now());
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
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

function toStravaDetailSyncError(error: unknown): StravaDetailSyncError {
  if (error instanceof StravaDetailSyncError) {
    return error;
  }

  if (error instanceof StravaOAuthError) {
    if (error.message === "No stored Strava token found") {
      return new StravaDetailSyncError(
        "No stored Strava connection found for detail sync",
        "not_connected",
        error,
      );
    }

    return new StravaDetailSyncError(
      `Failed to prepare Strava access token for detail sync: ${error.message}`,
      "fetch_failed",
      error,
    );
  }

  return new StravaDetailSyncError(getErrorMessage(error), "storage_failed", error);
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
