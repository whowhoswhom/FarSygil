# 10 — Sync Logging and Backups

> See also: [[00_PROJECT-BRAIN]] · [[04_STRAVA-INGESTION]] · [[06_DATABASE-SCHEMA]]

---

## Sync logging

Every sync event is recorded in `data_import_logs`:

| Event type | When |
|---|---|
| `sync_start` | When a sync begins |
| `sync_complete` | When a sync finishes successfully |
| `sync_error` | When a sync fails |

Each log row includes:
- `source`: "strava" or "apple_health"
- `message`: human-readable description
- `activities_added` / `activities_updated`: counters
- `errors_count`: number of errors encountered
- `started_at` / `completed_at`: timestamps

Current Phase 1 behavior:
- `POST /api/strava/sync` writes `sync_start`, `sync_complete`, and `sync_error` rows for Strava summary-activity imports
- there is still no dedicated sync log viewer UI; logs are persisted but not yet surfaced in the app

---

## Database backups

FarSygil does not implement automatic backups. The user is responsible for backing up their data.

Recommended backup strategy:
1. Periodically copy `./data/running.db` to a safe location (external drive, encrypted cloud backup).
2. Use SQLite's built-in `.backup` command or the `better-sqlite3` backup API for safe online backups.
3. Never commit the database file to Git.

---

## Data recovery

If the database is lost:
- Strava data can be re-imported by running a full sync.
- Apple Health data can be re-imported from a new export.
- Manual notes and settings cannot be automatically recovered without a database backup.

---

## WAL mode

The database runs in WAL (Write-Ahead Logging) mode, which:
- Improves concurrent read performance
- Reduces write latency
- Creates `.db-wal` and `.db-shm` sidecar files (also excluded from Git)
