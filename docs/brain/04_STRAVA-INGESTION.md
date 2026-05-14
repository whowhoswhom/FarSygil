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

`/connect` is the management surface for invoking summary sync and detail sync.

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
- surfaced through `/connect`

---

## Rate limiting and retries

Strava API limits remain:
- 200 requests per 15 minutes
- 2000 requests per day

Detail sync now includes:
- `Retry-After` handling
- exponential backoff
- fail-closed logging
- surfaced sync errors

All summary and detail sync work must keep writing meaningful log rows to
`data_import_logs`.

---

## Still deferred

These are intentionally not part of the current Strava implementation:
- Apple Health import
- training-load analytics
- AI-derived insights

Strava remains authoritative for run activity, split, and stream data only.
