# 12 — Testing and Validation

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

Fixtures must use **anonymised fake data** — never real athlete data or real health records.

---

## Testing tools

| Tool | Purpose |
|---|---|
| Vitest (planned) | Unit and integration tests |
| SQLite in-memory DB | Isolated database tests |

---

## Key things to test

### Phase 1
- [ ] Strava OAuth token exchange and storage
- [ ] Activity upsert (new and update)
- [ ] Split parsing from raw JSON
- [ ] Token refresh logic

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
- Tests must not write to the production database — use in-memory or temp file databases.
