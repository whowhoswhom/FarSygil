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
- [ ] Activity upsert (new and update)
- [ ] Split parsing from raw JSON
- [ ] Token refresh logic

Current Phase 1 coverage:
- `tests/strava/oauth.test.ts` verifies the authorize redirect URL, `state` handling, access-denied short-circuiting before token exchange even when `code` and valid scopes are present, callback token exchange, replacement of a stale token row when a different athlete reconnects, single-row token upsert, missing-code handling, missing-scope handling, invalid-state handling, exchange failure, storage failure, and connection-status reads.
- `tests/strava/connect-route.test.ts` verifies that the real `/api/strava/connect` redirect response carries the expected Strava authorize URL parameters and the expected OAuth state-cookie attributes.
- `tests/strava/callback-route.test.ts` verifies that callback-route configuration failures still redirect to `/?strava=config_error` and clear the OAuth state cookie, and that unexpected callback-helper throws are not relabeled as config errors.
- Strava API responses in tests are mocked and loaded from `tests/fixtures/strava/`.
- The in-memory test database is created by applying every committed Drizzle SQL migration in filename order so the test schema stays aligned with `src/db/schema.ts` as new migrations are added.

### Phase 2
- [ ] Apple Health XML parsing
- [ ] Daily metric aggregation
- [ ] Upsert conflict resolution

### Phase 3
- [ ] TSS calculation
- [ ] ATL/CTL/TSB EMA calculation
- [ ] Riegel race predictor

---

## Validation rules

- All sync functions must be testable in isolation (no live Strava API calls in tests).
- Use fixture JSON files instead of live API calls.
- Tests must not write to the production database - use in-memory or temp file databases.
