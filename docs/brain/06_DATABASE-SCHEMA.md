# 06 — Database Schema

> See also: [[00_PROJECT-BRAIN]] · [[02_TECH-STACK]] · [[04_STRAVA-INGESTION]] · [[05_APPLE-HEALTH-INGESTION]]

---

## Overview

All data is stored in a single SQLite file at `./data/running.db`.

The schema is defined in `src/db/schema.ts` using Drizzle ORM.

---

## Tables

### `strava_tokens`
Stores the Strava OAuth tokens for the single user.

| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| athlete_id | INTEGER UNIQUE | Strava athlete ID |
| access_token | TEXT | Short-lived (6h) |
| refresh_token | TEXT | Used to refresh access token |
| expires_at | INTEGER | Unix timestamp |
| scope | TEXT | Granted OAuth scopes |
| created_at | TEXT | ISO datetime |
| updated_at | TEXT | ISO datetime |

---

### `activities`
Normalised activity summary rows (one per run or workout).

| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| strava_id | INTEGER UNIQUE | Strava activity ID |
| name | TEXT | Activity name |
| sport_type | TEXT | "Run", "VirtualRun", etc. |
| start_date | TEXT | ISO 8601 UTC |
| start_date_local | TEXT | ISO 8601 local |
| timezone | TEXT | |
| distance_meters | REAL | |
| moving_time_seconds | INTEGER | |
| elapsed_time_seconds | INTEGER | |
| total_elevation_gain | REAL | Metres |
| average_speed | REAL | m/s |
| max_speed | REAL | m/s |
| average_heartrate | REAL | bpm |
| max_heartrate | REAL | bpm |
| average_cadence | REAL | spm |
| average_watts | REAL | |
| suffer_score | INTEGER | |
| perceived_exertion | REAL | |
| start_latitude | REAL | |
| start_longitude | REAL | |
| map_polyline | TEXT | Encoded polyline |
| gear_id | TEXT | |
| source | TEXT | "strava" \| "manual" |
| created_at | TEXT | |
| updated_at | TEXT | |

---

### `activity_raw_json`
Preserves the raw Strava API JSON for reprocessing.

| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| strava_id | INTEGER UNIQUE | |
| raw_json | TEXT | Full JSON string |
| fetched_at | TEXT | |

---

### `activity_splits`
Per-kilometre or per-mile split data.

| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| activity_id | INTEGER FK → activities | Cascade delete |
| split_index | INTEGER | 1-based |
| distance_meters | REAL | |
| elapsed_time_seconds | INTEGER | |
| moving_time_seconds | INTEGER | |
| elevation_difference | REAL | |
| average_speed | REAL | |
| average_heartrate | REAL | |
| average_grade_adjusted_speed | REAL | |
| pace_zone | INTEGER | |

---

### `activity_streams`
Time-series streams (HR, GPS, cadence, etc.).

| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| activity_id | INTEGER FK → activities | Cascade delete |
| stream_type | TEXT | "heartrate", "latlng", etc. |
| data | TEXT | JSON array |
| series_type | TEXT | "distance" \| "time" |
| original_size | INTEGER | |
| resolution | TEXT | "low" \| "medium" \| "high" |
| fetched_at | TEXT | |

---

### `health_metrics`
Daily aggregated Apple Health metrics.

| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| date | TEXT | YYYY-MM-DD |
| metric_type | TEXT | "resting_hr", "hrv", etc. |
| value | REAL | |
| unit | TEXT | |
| source | TEXT | "AppleHealth" |
| created_at | TEXT | |

Unique constraint: `(date, metric_type)`.

---

### `health_raw_imports`
Audit log of Apple Health import files.

| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| filename | TEXT | |
| imported_at | TEXT | |
| record_count | INTEGER | |
| notes | TEXT | |

---

### `data_import_logs`
Sync and import event log.

| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| source | TEXT | "strava" \| "apple_health" \| "manual" |
| event_type | TEXT | "sync_start" \| "sync_complete" \| "sync_error" |
| message | TEXT | |
| activities_added | INTEGER | |
| activities_updated | INTEGER | |
| errors_count | INTEGER | |
| started_at | TEXT | |
| completed_at | TEXT | |

---

### `daily_summaries`
Precomputed daily rollups.

| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| date | TEXT UNIQUE | YYYY-MM-DD |
| total_distance_meters | REAL | |
| total_moving_time_seconds | INTEGER | |
| total_elevation_gain | REAL | |
| activity_count | INTEGER | |
| average_heartrate | REAL | |
| resting_heartrate | REAL | |
| hrv | REAL | |
| sleep_hours | REAL | |
| steps | INTEGER | |
| updated_at | TEXT | |

---

### `training_load`
Computed ATL / CTL / TSB values.

| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| date | TEXT UNIQUE | YYYY-MM-DD |
| acute_load | REAL | ATL — 7-day EMA |
| chronic_load | REAL | CTL — 42-day EMA |
| training_stress_balance | REAL | TSB = CTL - ATL |
| daily_training_stress | REAL | |
| updated_at | TEXT | |

---

### `manual_notes`
User journal entries, optionally linked to activities.

| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| date | TEXT | YYYY-MM-DD |
| activity_id | INTEGER FK → activities | Set null on delete |
| note | TEXT | |
| tags | TEXT | Comma-separated |
| created_at | TEXT | |
| updated_at | TEXT | |

---

### `user_settings`
Key-value configuration store.

| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| key | TEXT UNIQUE | Setting name |
| value | TEXT | |
| updated_at | TEXT | |
