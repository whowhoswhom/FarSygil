# 04 - Strava Ingestion

> See also: [[00_PROJECT-BRAIN]] | [[06_DATABASE-SCHEMA]] | [[11_SECURITY-PRIVACY]]

---

## Status

Phase 1 summary sync is complete, and Phase 2 detail sync is now implemented.

FarSygil currently supports:
- OAuth connect
- callback token storage
- connection-status reads
- refresh-aware token access
- summary activity sync
- detail sync for detailed activity payloads, splits, and streams
- fresh sync that combines summary sync, missing detail sync, and daily-stress
  recompute
- local sync logging for both summary and detail sync work

---

## Current routes

| Route | Purpose |
|---|---|
| `GET /api/strava/connect` | begin OAuth |
| `GET /api/strava/callback` | validate callback and store tokens |
| `GET /api/strava/status` | return safe local connection metadata |
| `POST /api/strava/sync` | summary activity sync |
| `POST /api/strava/sync-details` | detail sync for splits and streams |
| `POST /api/strava/sync-fresh` | combined local freshness pass |

`/connect` is the management surface for invoking fresh sync, summary sync, and
detail sync.

---

## OAuth flow

FarSygil uses the Strava Authorization Code flow:

1. User clicks `Connect Strava`.
2. App generates a random `state` and stores it in an httpOnly cookie.
3. App redirects to Strava authorize with `read,activity:read_all`.
4. Strava redirects back to `/api/strava/callback`.
5. App validates `state` and required scopes.
6. App exchanges the code for tokens.
7. App stores exactly one local token row in `strava_tokens`.

Strava access tokens are short-lived. FarSygil should not require reconnecting
when only the access token expires; sync callers use the stored refresh token,
persist Strava's replacement refresh token, and keep the stored athlete id.

Required environment variables:

```bash
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
STRAVA_REDIRECT_URI=http://localhost:3000/api/strava/callback
```

---

## Summary sync

`POST /api/strava/sync` fetches Strava summary activities and writes:
- normalized rows to `activities`
- raw summary payloads to `activity_raw_json` with
  `payload_type = "summary_activity"`
- sync events to `data_import_logs`

It supports:
- initial paginated sync
- incremental sync using the latest local activity timestamp
- refresh-aware token handling before API calls

---

## Detail sync

`POST /api/strava/sync-details` extends the Strava pipeline with detail backfill.

It fetches:

```bash
GET /api/v3/activities/{id}
GET /api/v3/activities/{id}/streams?keys=heartrate,cadence,latlng,altitude,distance,time,velocity_smooth&key_by_type=true
```

It writes:
- raw detail payloads to `activity_raw_json` with
  `payload_type = "detailed_activity"`
- raw stream payloads to `activity_raw_json` with `payload_type = "streams"`
- normalized split rows to `activity_splits`
- normalized stream rows to `activity_streams`
- sync log rows to `data_import_logs`

Behavior:
- incremental by default: only sync activities missing detail/stream companions
- optional full backfill mode for first-time catch-up
- activities with no Strava stream resource still persist detailed activity data
  and an empty stream companion instead of failing the whole sync
- surfaced through `/connect`

---

## Fresh sync

`POST /api/strava/sync-fresh` is the preferred daily freshness path.

It runs:
1. incremental summary sync
2. incremental detail sync for missing detail/stream companions
3. local daily training-stress recompute

Summary sync is the freshness gate. If detail backfill is temporarily blocked
by Strava rate limits, the fresh-sync route still returns the summary result,
with the detail error recorded for follow-up. If local daily-stress recompute is
temporarily blocked, fresh sync still returns the summary/detail results with a
separate daily-stress error instead of hiding the successful activity pull.

The app shell may trigger this endpoint automatically when the latest successful
Strava sync is stale. The `/connect` page also exposes it as `Refresh latest`.
This remains local-first polling, not Strava webhooks.

The route rejects overlapping fresh-sync requests with `sync_already_running`.
This prevents the app-shell freshness pass and a manual `/connect` refresh from
starting duplicate Strava pulls against the same local database.

Fresh sync caps its automatic detail-backfill step to a small batch per run so
the app can keep daily summary data fresh without spending a full Strava read
window on historical split/stream backfill. Manual detail controls on
`/connect` remain available for explicit catch-up.

The app-shell auto-refresh also reads recent Strava sync logs. If the newest
relevant sync outcome is a rate-limit error, background freshness polling pauses
for a server-backed cooldown window; the manual `/connect` controls remain
visible and explicit.

---

## Rate limiting and retries

Strava API limits remain:
- 200 requests per 15 minutes
- 2000 requests per day

Detail sync now includes:
- `Retry-After` handling
- exponential backoff
- capped retry waits so a single request does not hang through a full Strava
  rate-limit window
- fail-closed logging
- surfaced sync errors

Summary sync also retries transient network failures and retryable Strava
statuses before surfacing an error, with the same capped retry waits.

All summary and detail sync work must keep writing meaningful log rows to
`data_import_logs`.

---

## Still deferred

These are intentionally not part of the current Strava implementation:
- Apple Health import
- training-load analytics
- AI-derived insights

Strava remains authoritative for run activity, split, and stream data only.
