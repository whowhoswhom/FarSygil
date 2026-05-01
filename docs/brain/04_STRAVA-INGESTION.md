# 04 - Strava Ingestion

> See also: [[00_PROJECT-BRAIN]] · [[03_DATA-SOURCES]] · [[06_DATABASE-SCHEMA]]

---

## Status

**Phase 1 - in progress.** OAuth connect, callback token storage, and connection-status reads are implemented. Activity sync is still pending.

## Current implementation

- `GET /api/strava/connect` generates an OAuth `state`, stores it in an httpOnly cookie, and redirects the browser to Strava's authorization page.
- `GET /api/strava/callback` validates the returned `state`, requires `read,activity:read_all`, exchanges the authorization code for tokens, upserts one row in `strava_tokens`, and redirects back to `/` with a callback status.
- `GET /api/strava/status` returns safe local connection metadata from SQLite: connection state, athlete id, accepted scope, expiry timestamp, and whether the token is expired.
- Callback failures are distinguished as denied access, missing code, missing scope, invalid state, token-exchange failure, and local-storage failure.

---

## OAuth flow

FarSygil uses the Strava OAuth 2.0 Authorization Code flow:

1. User clicks `Connect Strava` in the UI.
2. App generates a random `state` value and stores it in an httpOnly cookie.
3. App redirects to `https://www.strava.com/oauth/authorize` with `client_id`, `redirect_uri`, `response_type=code`, `scope=read,activity:read_all`, and `state`.
4. User approves in Strava.
5. Strava redirects back to `/api/strava/callback?code=...&scope=...&state=...`.
6. App validates the returned `state` and accepted scopes.
7. App exchanges the code for an access token and refresh token via `POST https://www.strava.com/oauth/token`.
8. Tokens are stored in `strava_tokens` in the local SQLite database (see [[11_SECURITY-PRIVACY]]).

### Required environment variables

```bash
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
STRAVA_REDIRECT_URI=http://localhost:3000/api/strava/callback
```

Obtain credentials at: https://www.strava.com/settings/api

---

## Token refresh

Strava access tokens expire after 6 hours. The sync process must:

1. Check `strava_tokens.expires_at` before each API call.
2. If expired, call `POST https://www.strava.com/oauth/token` with `grant_type=refresh_token`.
3. Update `strava_tokens` with the new `access_token`, `refresh_token`, and `expires_at`.

---

## Activity sync

### Initial sync

On first connect, fetch all activities from the Strava API using pagination:

```bash
GET https://www.strava.com/api/v3/athlete/activities?per_page=200&page={n}
```

Repeat until an empty page is returned.

### Incremental sync

On subsequent syncs, use the `after` parameter:

```bash
GET https://www.strava.com/api/v3/athlete/activities?after={unix_timestamp}&per_page=200
```

The `after` timestamp should be derived from the most recent `start_date` in the `activities` table.

### Detailed activity fetch

For each activity, fetch the detailed record:

```bash
GET https://www.strava.com/api/v3/activities/{id}
```

Store the raw JSON in `activity_raw_json`.

### Splits

Parse `splits_metric` from the detailed activity response and store in `activity_splits`.

### Streams

Optionally fetch time-series streams (HR, cadence, GPS):

```bash
GET https://www.strava.com/api/v3/activities/{id}/streams?keys=heartrate,cadence,latlng,altitude,distance,time&key_by_type=true
```

Store in `activity_streams`.

---

## Rate limiting

Strava API limits: 200 requests per 15 minutes, 2000 per day. The sync process must:

- Honour `Retry-After` headers.
- Log all API calls in `data_import_logs`.
- Implement exponential backoff on 429 errors.

---

## Error handling

All sync events must be logged in `data_import_logs` with:

- `source = "strava"`
- `event_type = "sync_start" | "sync_complete" | "sync_error"`
- `message` describing the outcome
