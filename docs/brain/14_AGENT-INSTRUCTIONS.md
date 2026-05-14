# 14 - Agent Instructions

> See also: [[00_PROJECT-BRAIN]] | [[07_DASHBOARD-UI]] | [[13_ROADMAP-PHASES]] | [[17_VISUAL-REBOOT-PLAN]]

---

## Read this first

1. Read [[00_PROJECT-BRAIN]] before taking action.
2. Check the active phase in [[13_ROADMAP-PHASES]].
3. For Phase 2 surfaces, follow [[17_VISUAL-REBOOT-PLAN]] and the
   data-reality matrix in [[07_DASHBOARD-UI]].
4. Do not implement later-phase features just because the mockups show them.

---

## Core rules

| Rule | Details |
|---|---|
| Never invent data | Missing values render as `--` or `Data not available` |
| Strava is authoritative | Run activity, splits, and stream data come from Strava only |
| Apple Health is authoritative | Physiology data comes from Apple Health only |
| No AI chat until Phase 4 | Do not implement Claude or AI features before Phase 4 |
| No fake charts | Only render charts when real series exist |
| No fake map layers | Faux-map surfaces may use only abstract local backdrops plus real route polylines |
| No demo data | Never seed the user database with fake activities or metrics |
| No secrets in code | Never hardcode credentials or tokens |
| Be precise about local-first | Do not claim zero network traffic when the app intentionally talks to Strava |
| Keep copy calm and factual | No hype, no encouragement copy, no "coming soon" filler |

---

## Before implementing a feature

1. Check whether the feature belongs to Phase 2, 3, or 4.
2. If the work touches a mockup-like surface, consult the data-reality matrix in
   [[07_DASHBOARD-UI]] before writing code.
3. If the work affects Strava sync or local privacy claims, update the relevant
   brain docs in the same change set.
4. Use fixtures under `tests/fixtures/` rather than live API calls in tests.

---

## After implementing a change

1. Update every affected brain file in the same branch.
2. Re-run the required local checks:
   - `pnpm lint`
   - `pnpm test`
   - `pnpm build`
   - `pnpm db:generate`
3. Hand back a self-contained Claude review prompt for the exact change set.

---

## Database and route rules

- Schema changes belong in `src/db/schema.ts`.
- Generate migrations with `pnpm db:generate`.
- Apply migrations with `pnpm db:migrate`.
- Never edit the SQLite file directly.
- Any Next.js route or page that touches SQLite must use:
  - `runtime = "nodejs"`
  - `dynamic = "force-dynamic"`

---

## Rendering rules

- Compact inline missing value: `--`
- Standalone empty state: `Data not available`
- Real zero values may render only when zero is truthful
- Never replace missing data with zero
- If a mockup frame depends on unavailable data, render the frame with an honest
  empty body instead of inventing the value

Example:

```typescript
const value = activity.averageHeartrate ?? "--";
```

Never do this:

```typescript
const value = activity.averageHeartrate || 0;
```
