# 12 - Testing and Validation

> See also: [[00_PROJECT-BRAIN]] · [[04_STRAVA-INGESTION]] · [[05_APPLE-HEALTH-INGESTION]]

---

## Test strategy

FarSygil uses a practical, minimal test suite focused on:
1. Database schema and query correctness
2. Strava ingestion logic (parsing, upserts, token refresh)
3. Apple Health parsing logic
4. Training analytics computation
5. API route correctness

Unit tests for UI components are out of scope for early phases.

---

## Test fixtures

Sample data lives in `tests/fixtures/`:

| Directory | Purpose |
|---|---|
| `tests/fixtures/strava/` | Sample Strava API JSON responses |
| `tests/fixtures/apple-health/` | Sample Apple Health XML snippets |

Fixtures must use anonymised fake data - never real athlete data or real health records.

---

## Testing tools

| Tool | Purpose |
|---|---|
| Vitest | Unit and integration tests |
| SQLite in-memory DB | Isolated database tests |

---

## Key things to test

### Phase 1
- [x] Strava OAuth token exchange and storage
- [x] Activity upsert (new and update)
- [ ] Split parsing from raw JSON
- [x] Token refresh logic

Current Phase 1 coverage:
- `tests/strava/oauth.test.ts` verifies the authorize redirect URL, `state` handling, access-denied short-circuiting before token exchange even when `code` and valid scopes are present, callback token exchange, replacement of a stale token row when a different athlete reconnects, single-row token upsert, missing-code handling, missing-scope handling, invalid-state handling, exchange failure, storage failure, connection-status reads, valid-token reuse, expired-token refresh, refresh-failure handling, missing-stored-token handling, default leeway-window refresh, opt-out via `leewaySeconds: 0`, opt-in via a larger custom leeway, and negative-leeway clamping.
- `tests/strava/connect-route.test.ts` verifies that the real `/api/strava/connect` redirect response carries the expected Strava authorize URL parameters and the expected OAuth state-cookie attributes.
- `tests/strava/callback-route.test.ts` verifies that callback-route configuration failures still redirect to `/?strava=config_error` and clear the OAuth state cookie, and that unexpected callback-helper throws are not relabeled as config errors.
- `tests/strava/sync.test.ts` verifies paginated summary-activity sync into SQLite, incremental sync using the latest local Strava timestamp, normalized upserts into `activities`, raw summary payload storage in `activity_raw_json`, and sync error logging for missing connections or invalid upstream payloads.
- `tests/strava/sync-route.test.ts` verifies the real `/api/strava/sync` route's JSON success path, missing-config handling, and `not_connected` error mapping.
- `tests/strava/sync-logs.test.ts` verifies recent Strava sync-log reads from `data_import_logs`, including source filtering, descending order, and explicit limits for the `/connect` viewer surface.
- `tests/activities/format.test.ts` verifies imperial distance/elevation formatting, run pace formatting, the global `sufferScore / 250` effort scale, and the rule that indoor rides do not synthesize distance metrics.
- `tests/activities/filters.test.ts` verifies `/activities` filter URL parsing/serialization plus archive filtering by sport, search, and minimum distance.
- `tests/activities/aggregates.test.ts` verifies archive total aggregation for count, distance, moving time, and elevation.
- `tests/activities/polyline.test.ts` verifies polyline decoding and SVG path normalization for route previews.
- Strava API responses in tests are mocked and loaded from `tests/fixtures/strava/`.
- The in-memory test database is created by applying every committed Drizzle SQL migration in filename order so the test schema stays aligned with `src/db/schema.ts` as new migrations are added.

### Phase 2
- [x] Dashboard Strava rollups and status reads
- [ ] Apple Health XML parsing
- [ ] Daily metric aggregation
- [ ] Upsert conflict resolution

Current Phase 2 coverage:
- `tests/dashboard/strava.test.ts` verifies dashboard header status reads from the stored Strava connection and recent sync logs, plus current-week running rollups for distance, moving time, elevation, weighted pace/cadence/heart rate, recent-run selection, longest-run selection, and empty-week behavior.
- `tests/runs/queries.test.ts` verifies the new run-first query layer: run-only archive filtering, descending order, route-preview normalization, run-detail reads from `activities` plus `activity_splits` / `activity_streams`, split-heart-rate fallback behavior, run counting, and rejection of non-run detail ids.

### Phase 3
- [ ] TSS calculation
- [ ] ATL/CTL/TSB EMA calculation
- [ ] Riegel race predictor

---

## Validation rules

- All sync functions must be testable in isolation (no live Strava API calls in tests).
- Use fixture JSON files instead of live API calls.
- Tests must not write to the production database - use in-memory or temp file databases.
