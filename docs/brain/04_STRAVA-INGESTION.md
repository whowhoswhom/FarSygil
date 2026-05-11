# 04 - Strava Ingestion

> See also: [[00_PROJECT-BRAIN]] · [[03_DATA-SOURCES]] · [[06_DATABASE-SCHEMA]]

---

## Status

**Phase 1 - in progress.** OAuth connect, callback token storage, connection-status reads, and an on-demand token-refresh helper are implemented. Activity sync is still pending.

## Current implementation

- `GET /api/strava/connect` generates an OAuth `state`, stores it in an httpOnly cookie, and redirects the browser to Strava's authorization page. It currently returns a `500` JSON error instead of redirecting if required local Strava env vars are missing before the OAuth flow starts.
- `GET /api/strava/callback` validates the returned `state`, requires `read,activity:read_all`, exchanges the authorization code for tokens, keeps exactly one local row in `strava_tokens`, and redirects back to `/?strava=<status>`.
- `GET /api/strava/status` returns safe local connection metadata from SQLite: connection state, athlete id, accepted scope, expiry timestamp, and whether the token is expired.
- `getValidStravaAccessToken()` in `src/server/strava/oauth.ts` returns a usable access token for future Strava API calls, silently refreshing the stored token row when the remaining lifetime drops below a configurable leeway (default 5 minutes, `STRAVA_REFRESH_LEEWAY_SECONDS`). Callers can pass `leewaySeconds: 0` to opt back into "refresh only after hard expiry"; negative values are clamped to zero.
- `/connect` is a Phase 1 management page for starting OAuth and viewing the persisted local connection metadata.
- Callback failures are distinguished as denied access, missing code, missing scope, invalid state, local callback configuration error, token-exchange failure, and local-storage failure. These OAuth setup errors currently surface through callback status plus server logs; `data_import_logs` begins when activity sync is implemented.

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
9. If a different Strava athlete reconnects later, FarSygil replaces the old local token row instead of keeping multiple Strava connections.

### Required environment variables

```bash
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
STRAVA_REDIRECT_URI=http://localhost:3000/api/strava/callback
```

Obtain credentials at: https://www.strava.com/settings/api

---

## Token refresh

Strava access tokens expire after 6 hours. FarSygil now has a server-side helper that refreshes a stored token on demand before a Strava API call. The helper applies a small safety margin (default 5 minutes, `STRAVA_REFRESH_LEEWAY_SECONDS`) so long-running callers never pick up a token that expires mid-request; callers that want the old "refresh strictly after expiry" behavior can pass `leewaySeconds: 0`. The sync process should use that helper so it:

1. Check `strava_tokens.expires_at` against `now + leewaySeconds` before each API call.
2. If the remaining lifetime is within leeway (or already past), call `POST https://www.strava.com/oauth/token` with `grant_type=refresh_token`.
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
