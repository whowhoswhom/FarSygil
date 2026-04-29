import {
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Strava OAuth tokens (single user, one row expected)
// ---------------------------------------------------------------------------
export const stravaTokens = sqliteTable("strava_tokens", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  athleteId: integer("athlete_id").notNull().unique(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiresAt: integer("expires_at").notNull(), // Unix timestamp
  scope: text("scope"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ---------------------------------------------------------------------------
// Activities — normalised summary rows (one per run/workout)
// ---------------------------------------------------------------------------
export const activities = sqliteTable(
  "activities",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    stravaId: integer("strava_id").unique(),
    name: text("name"),
    sportType: text("sport_type"), // e.g. "Run", "VirtualRun"
    startDate: text("start_date"), // ISO 8601
    startDateLocal: text("start_date_local"),
    timezone: text("timezone"),
    distanceMeters: real("distance_meters"),
    movingTimeSeconds: integer("moving_time_seconds"),
    elapsedTimeSeconds: integer("elapsed_time_seconds"),
    totalElevationGain: real("total_elevation_gain"),
    averageSpeed: real("average_speed"), // m/s
    maxSpeed: real("max_speed"),
    averageHeartrate: real("average_heartrate"),
    maxHeartrate: real("max_heartrate"),
    averageCadence: real("average_cadence"),
    averageWatts: real("average_watts"),
    sufferScore: integer("suffer_score"),
    perceivedExertion: real("perceived_exertion"),
    startLatitude: real("start_latitude"),
    startLongitude: real("start_longitude"),
    mapPolyline: text("map_polyline"),
    gearId: text("gear_id"),
    source: text("source").notNull().default("strava"), // "strava" | "manual"
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => ({
    stravaIdIdx: uniqueIndex("activities_strava_id_idx").on(t.stravaId),
  }),
);

// ---------------------------------------------------------------------------
// Raw JSON from Strava API (preserved for reprocessing)
// ---------------------------------------------------------------------------
export const activityRawJson = sqliteTable("activity_raw_json", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  stravaId: integer("strava_id").notNull().unique(),
  rawJson: text("raw_json").notNull(), // JSON string
  fetchedAt: text("fetched_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ---------------------------------------------------------------------------
// Activity splits (km or mile splits)
// ---------------------------------------------------------------------------
export const activitySplits = sqliteTable("activity_splits", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  activityId: integer("activity_id")
    .notNull()
    .references(() => activities.id, { onDelete: "cascade" }),
  splitIndex: integer("split_index").notNull(), // 1-based
  distanceMeters: real("distance_meters"),
  elapsedTimeSeconds: integer("elapsed_time_seconds"),
  movingTimeSeconds: integer("moving_time_seconds"),
  elevationDifference: real("elevation_difference"),
  averageSpeed: real("average_speed"),
  averageHeartrate: real("average_heartrate"),
  averageGradeAdjustedSpeed: real("average_grade_adjusted_speed"),
  paceZone: integer("pace_zone"),
});

// ---------------------------------------------------------------------------
// Activity streams (GPS, HR, cadence, etc. time-series)
// ---------------------------------------------------------------------------
export const activityStreams = sqliteTable("activity_streams", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  activityId: integer("activity_id")
    .notNull()
    .references(() => activities.id, { onDelete: "cascade" }),
  streamType: text("stream_type").notNull(), // "heartrate" | "cadence" | "latlng" | etc.
  data: text("data").notNull(), // JSON array
  seriesType: text("series_type"), // "distance" | "time"
  originalSize: integer("original_size"),
  resolution: text("resolution"), // "low" | "medium" | "high"
  fetchedAt: text("fetched_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ---------------------------------------------------------------------------
// Health metrics from Apple Health (daily aggregates)
// ---------------------------------------------------------------------------
export const healthMetrics = sqliteTable(
  "health_metrics",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    date: text("date").notNull(), // YYYY-MM-DD
    metricType: text("metric_type").notNull(), // e.g. "resting_hr", "hrv", "sleep_hours", "steps"
    value: real("value"),
    unit: text("unit"),
    source: text("source"), // e.g. "AppleHealth"
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => ({
    dateMetricIdx: uniqueIndex("health_metrics_date_metric_idx").on(
      t.date,
      t.metricType,
    ),
  }),
);

// ---------------------------------------------------------------------------
// Raw Apple Health import files (audit trail)
// ---------------------------------------------------------------------------
export const healthRawImports = sqliteTable("health_raw_imports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  filename: text("filename").notNull(),
  importedAt: text("imported_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  recordCount: integer("record_count"),
  notes: text("notes"),
});

// ---------------------------------------------------------------------------
// Data import / sync log
// ---------------------------------------------------------------------------
export const dataImportLogs = sqliteTable("data_import_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  source: text("source").notNull(), // "strava" | "apple_health" | "manual"
  eventType: text("event_type").notNull(), // "sync_start" | "sync_complete" | "sync_error"
  message: text("message"),
  activitiesAdded: integer("activities_added").default(0),
  activitiesUpdated: integer("activities_updated").default(0),
  errorsCount: integer("errors_count").default(0),
  startedAt: text("started_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  completedAt: text("completed_at"),
});

// ---------------------------------------------------------------------------
// Daily summaries (precomputed, one row per date)
// Dates are stored as TEXT (YYYY-MM-DD) — SQLite has no native DATE type;
// TEXT is idiomatic with Drizzle ORM and sorts correctly as ISO 8601.
// ---------------------------------------------------------------------------
export const dailySummaries = sqliteTable(
  "daily_summaries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    date: text("date").notNull().unique(), // YYYY-MM-DD
    totalDistanceMeters: real("total_distance_meters").default(0),
    totalMovingTimeSeconds: integer("total_moving_time_seconds").default(0),
    totalElevationGain: real("total_elevation_gain").default(0),
    activityCount: integer("activity_count").default(0),
    averageHeartrate: real("average_heartrate"),
    restingHeartrate: real("resting_heartrate"),
    hrv: real("hrv"),
    sleepHours: real("sleep_hours"),
    steps: integer("steps"),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
);

// ---------------------------------------------------------------------------
// Training load (ATL / CTL / TSB — computed values)
// ---------------------------------------------------------------------------
export const trainingLoad = sqliteTable(
  "training_load",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    date: text("date").notNull().unique(), // YYYY-MM-DD
    acuteLoad: real("acute_load"), // ATL — 7-day exponential average
    chronicLoad: real("chronic_load"), // CTL — 42-day exponential average
    trainingStressBalance: real("training_stress_balance"), // TSB = CTL - ATL
    dailyTrainingStress: real("daily_training_stress"),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
);

// ---------------------------------------------------------------------------
// Manual notes / journal entries
// ---------------------------------------------------------------------------
export const manualNotes = sqliteTable("manual_notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(), // YYYY-MM-DD
  activityId: integer("activity_id").references(() => activities.id, {
    onDelete: "set null",
  }),
  note: text("note").notNull(),
  tags: text("tags"), // comma-separated
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ---------------------------------------------------------------------------
// User settings (key-value, single user)
// ---------------------------------------------------------------------------
export const userSettings = sqliteTable("user_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value"),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});
