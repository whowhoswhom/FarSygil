# 12 - Testing and Validation

> See also: [[00_PROJECT-BRAIN]] | [[04_STRAVA-INGESTION]] | [[05_APPLE-HEALTH-INGESTION]] | [[17_VISUAL-REBOOT-PLAN]]

---

## Test strategy

FarSygil uses a practical test suite focused on:
1. database schema and query correctness
2. Strava OAuth and sync logic
3. route behavior for redirects and shell entry points
4. honest degradation when real data is absent or malformed
5. future Apple Health and analytics computation

UI component unit tests remain out of scope for the early local-first phases.

---

## Fixtures

Sample data lives in `tests/fixtures/`:

| Directory | Purpose |
|---|---|
| `tests/fixtures/strava/` | sample Strava API JSON responses |
| `tests/fixtures/apple-health/` | sample Apple Health XML snippets |

Fixtures must stay anonymized and fake. Never commit real athlete or health
records.

---

## Tooling

| Tool | Purpose |
|---|---|
| Vitest | unit and integration tests |
| SQLite in-memory DB | isolated database tests |

---

## Current coverage

### Phase 1 / Strava foundation

- [x] Strava OAuth token exchange and storage
- [x] Summary activity sync
- [x] Token refresh logic
- [x] Connection-status reads
- [x] Sync-log reads
- [x] Archive formatting, filtering, aggregation, and polyline helpers

Relevant files:
- `tests/strava/oauth.test.ts`
- `tests/strava/connect-route.test.ts`
- `tests/strava/callback-route.test.ts`
- `tests/strava/sync.test.ts`
- `tests/strava/sync-route.test.ts`
- `tests/strava/sync-logs.test.ts`
- `tests/activities/format.test.ts`
- `tests/activities/filters.test.ts`
- `tests/activities/aggregates.test.ts`
- `tests/activities/polyline.test.ts`

### Phase 2 / visual reboot and detail sync

- [x] Dashboard Strava rollups and status reads
- [x] Run-first query layer
- [x] Smart-entry home behavior
- [x] `/activities` redirect compatibility
- [x] Strava detail sync writes
- [x] Detail-sync rate-limit retry behavior
- [x] Detail-sync route behavior
- [x] Malformed stream degradation
- [x] Apple Health XML import aggregation and route behavior

Relevant files:
- `tests/dashboard/strava.test.ts`
- `tests/runs/queries.test.ts`
- `tests/app/home-page.test.ts`
- `tests/activities/redirects.test.ts`
- `tests/strava/detail-sync.test.ts`
- `tests/strava/sync-details-route.test.ts`
- `tests/apple-health/import.test.ts`
- `tests/apple-health/import-route.test.ts`

Current Phase 2 assertions cover:
- dashboard weekly running rollups, pace/cadence/HR weighting, recent-run and
  longest-run selection, and empty-week behavior
- run archive filtering and ordering
- run-detail query reads from `activities`, `activity_splits`, and
  `activity_streams`
- split fallback behavior and malformed stream degradation
- home smart-entry redirect for connected users and onboarding render for
  disconnected users
- compatibility redirects from `/activities` to `/runs`
- incremental and full detail sync, raw payload writes, split/stream writes,
  sync-log writes, and retry behavior on rate-limited detail requests
- Apple Health extracted XML imports for daily steps, resting HR, HRV, VO2 Max,
  active energy, and sleep-hours rows, including upsert and error logging

### Phase 3 / future analytics

- [ ] TSS calculation
- [ ] ATL / CTL / TSB EMA calculation
- [ ] Riegel race predictor

### Phase 4 / future grounded AI

- [ ] grounded context selection
- [ ] refusal behavior for missing local data
- [ ] chat route and system behavior

---

## Validation rules

- No live Strava API calls in tests
- Use fixtures instead of real upstream traffic
- Tests must never write to the production database
- Keep applying committed Drizzle migrations in test setup so schema and tests
  stay aligned
- Every significant wave should pass:
  - `pnpm lint`
  - `pnpm test`
  - `pnpm build`
  - `pnpm db:generate`

Manual QA remains required for:
- desktop shell
- mobile bottom nav
- dashboard with real local data
- run detail with and without splits/streams
- connect disconnected / connected / expired states
- health and training-load honest empty states
