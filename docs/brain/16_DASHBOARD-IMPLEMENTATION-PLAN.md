# 16 - Dashboard Implementation Plan

> See also: [[00_PROJECT-BRAIN]] · [[02_TECH-STACK]] · [[03_DATA-SOURCES]] · [[06_DATABASE-SCHEMA]] · [[07_DASHBOARD-UI]] · [[08_TRAINING-ANALYTICS]] · [[13_ROADMAP-PHASES]] · [[14_AGENT-INSTRUCTIONS]]

---

## Status

**Planning document.** No dashboard cards, charts, design tokens, or metric wiring are implemented as part of this document. A minimal placeholder route exists at `/dashboard` showing empty states only. All implementation work is scheduled in the PR phases at the bottom of this file.

---

## 1. Product goal

`/dashboard` becomes the primary runtime surface of FarSygil: a personal, local-first running command center where a single user can read - at a glance - what they ran, how their body is responding, and what shape they are in.

The visual direction is **inspired by the Apple Fitness app**: dark, card-heavy, big metric numbers, bright accent colors, polished spacing, mobile-first but desktop-capable. The goal is to capture that design language - not to clone Apple.

Constraints:

- No Apple branding, no Apple icons, no Apple proprietary layouts.
- No copied SF Symbols, Activity Rings, or other Apple-owned assets.
- Inspiration only - typography, color, spacing, and information density.

The dashboard must feel like a serious runner's tool, not a generic admin dashboard. It must respect the project rule: **never invent data**. Missing metrics render as `--` (compact, inline, table cells) or `Data not available` (standalone card or banner message).

---

## 2. Visual design system

The dashboard extends the existing token system in `src/app/globals.css`. New tokens listed here are **proposed only** and will be implemented in PR B.

### Background

- Page background: existing radial gradient on near-black (`--field-deep`, `--field-mid`) defined in `body` of `globals.css`. Reused as-is.
- Card surface: existing `.surface-slab` (glass background, inset highlight, hover lift). Reused as-is.
- Hero card surface: existing `.surface-slab[data-depth="hero"]`. Reused as-is.

### Accent palette (proposed, for PR B)

The Apple Fitness multi-color metric palette is mapped to FarSygil-flavored tokens. Existing `--accent-*` tokens are kept; new `--metric-*` tokens are additive.

| Token | Suggested value | Semantic use |
|---|---|---|
| `--metric-move` | `#ff375f` (pink/red) | move, calories, training load warnings |
| `--metric-exercise` | reuse `--accent-bright` (`#a8e26c`) | exercise minutes, sessions, runs |
| `--metric-distance` | `#22d3ee` (cyan) | distance, pace, stand |
| `--metric-time` | `#facc15` (yellow) | weekly time, elevation, training load |
| `--metric-trend` | `#a78bfa` (purple) | trends, recovery, running pace trend |
| `--metric-cardio` | `#fb923c` (orange) | VO2 max, cardio fitness |

Each token is intended to be exposed as both a solid color and a low-opacity wash (e.g. `--metric-distance-wash`) for card halos.

### Typography

- Font family: Geist Sans (already loaded via `--font-geist-sans`) for UI; Geist Mono via existing `.tabular-nums` utility for metric numerals.
- Hero metric size: `clamp(3rem, 8vw, 5.25rem)`, weight 600, tracking `-0.05em`.
- Card metric size: `clamp(2rem, 5vw, 3rem)`, weight 600, tracking `-0.04em`.
- Card label: 0.85rem, weight 500, `--ink-2`.
- Section kicker: reuse existing `.section-kicker`.
- All numerals use `tabular-nums` for stable column widths.

### Radius

| Surface | Radius |
|---|---|
| Hero card | 32px |
| Metric card | 24px |
| Inner pill / chip | 999px (reuse `.liquid-pill`) |
| Mini chart frame | 14px |

### Spacing

Scale: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 48 px. Card padding 20-24px on mobile, 28-32px on desktop. Section gap 16-24px.

### Borders and shadows

Reuse existing `--glass-border`, `--glass-border-strong`, `--shadow-slab`, and `.surface-slab` inset highlights. No new shadow primitives.

### Mobile-first layout

- < 640px: single column. Each card spans full width. Hero card on top.
- 640-1024px: two-column grid for metric cards. Hero card spans both columns.
- &gt;= 1024px: 12-column grid. Hero spans 6-8 cols; metric cards span 3-4 cols; trend cards span 4-6 cols.
- All grids use CSS grid via Tailwind utility classes; no JS layout.

### Card feel

- Tactile: `.surface-slab` already provides glass + inset highlight + hover lift.
- Optional accent halo: a 1px inset `box-shadow` in the card's metric accent color at low opacity. Implemented in PR B via the `MetricCard` accent prop.
- No external shadow libraries.

---

## 3. Dashboard information architecture

### Top section

- Header: "FarSygil"
- Subtitle: "Local-first running command center"
- Strava connection status badge (reuse data from existing `/connect` flow)
- Last-synced timestamp (from `dataImportLogs`)
- Future quick action: `Sync Now` button

### Hero band

- This-week running summary card: weekly distance, weekly time, run count, average pace.
- Recent run card: latest activity name, date, distance, pace, HR (links to `/runs/[id]`).

### Running metrics grid (Strava-derived)

| Card | Metric |
|---|---|
| Weekly distance | total distance this week (mi) |
| Weekly time | total moving time this week |
| Average pace | weekly average pace (per mi) |
| Average cadence | weekly average cadence (spm) |
| Average HR | weekly average HR (bpm) |
| Elevation gain | weekly total elevation (ft) |
| Calories | weekly total calories (when present) |
| Power | weekly average watts (when present) |
| Longest run | longest single activity this week |
| Streak | consecutive days with a run |

### Health metrics grid (Apple Health, gated until importer ships)

VO2 max, resting HR, HRV, weight, sleep duration, steps, active energy, cardio recovery.

### Trends grid

VO2 max trend, running pace trend, distance trend, move/active-energy trend, stand/exercise trend.

### Training load section (gated until analytics ships)

TRIMP/TSS, CTL, ATL, TSB, ACWR, load-warning cards. Formulas defined in [[08_TRAINING-ANALYTICS]].

### States

- **Empty state** — no runs synced yet, no Apple Health imported. Card renders its label + the string `Data not available` + a one-line hint of what unlocks it.
- **Error state** — DB read failed. Card renders its label + `Could not load.` and a quiet retry affordance.
- **Missing-data state** — metric is null on otherwise-present rows. Cell renders `--`. Never renders zero unless zero is a real measurement.

- **Use "Data not available" for standalone card empty states.**
- **Use "--" only for compact inline/table-cell missing values.**
- **Use real zero values only when zero is a truthful aggregate result, such as zero runs, zero distance, or zero elevation in an empty date range.**
- **Never use zero as a placeholder for missing source data.**

---

## 4. Component plan

All new components live under `src/components/dashboard/`. None are implemented in this PR.

| Component | Purpose | Notes |
|---|---|---|
| `DashboardShell` | page-level layout wrapper, grid scaffolding | reuses `.page-shell` from `globals.css` |
| `DashboardHeader` | title, subtitle, `LastSyncedBadge`, `StatusBadge` | server component |
| `SectionHeader` | small kicker + section title | reuses `.section-kicker` |
| `MetricCard` | single metric, big number, optional mini chart | accent prop binds to `--metric-*` tokens |
| `LargeMetricCard` | hero-sized metric, spans 2 cols on tablet+ | uses `.surface-slab[data-depth="hero"]` |
| `TrendCard` | metric + delta arrow + trailing sparkline | sparkline via `MiniLineChart` |
| `MiniBarChart` | pure SVG, no chart lib | takes `{ x, y }[]`, never renders if empty |
| `MiniLineChart` | pure SVG sparkline | same contract as `MiniBarChart` |
| `StatusBadge` | Strava connection state pill | reuses `.liquid-pill` |
| `LastSyncedBadge` | "Last synced 5m ago" pill | reads `dataImportLogs` |
| `SourceLabel` | small "Strava" / "Apple Health" tag on each card | enforces data-authority transparency |
| `TimeRangeToggle` | D / W / M / Y segmented control | used on `/dashboard` and metric detail pages |
| `ActivitySessionCard` | row-style card for run list | mirrors Apple Fitness session row, no Apple icons |
| `EmptyMetricState` | label + `Data not available` + unlock hint | the default when data is missing |

Existing utilities to reuse (do not duplicate):

- `src/lib/activities/format.ts` — pace, distance, duration formatters
- `src/lib/activities/polyline.ts` — route preview decoding (for `ActivitySessionCard`)
- `src/components/activities/route-preview.tsx` — small route preview (already exists)

No new charting library. SVG is enough until the visualization complexity demands more.

---

## 5. Data requirements

For each card, define source table, authority, fields, unit, and missing-data behavior. All table names and column names below match the current Drizzle schema in `src/db/schema.ts`. If the underlying column does not exist yet, that is called out explicitly so no PR ships a card that depends on phantom fields.

### Naming convention

The schema uses two parallel naming styles and this document references both deliberately:

- **SQLite table names** use `snake_case`:
  - `activities`
  - `health_metrics`
  - `daily_summaries`
  - `training_load`
  - `data_import_logs`
- **Drizzle ORM exports** (the TypeScript identifiers imported from `src/db/schema.ts`) use `camelCase`:
  - `activities`
  - `healthMetrics`
  - `dailySummaries`
  - `trainingLoad`
  - `dataImportLogs`
- **Column-level naming** follows the same split. Drizzle TypeScript fields are `camelCase`; the underlying SQLite columns are `snake_case`. Example:
  - Drizzle field: `distanceMeters`
  - SQLite column: `distance_meters`

Each section heading below names both forms explicitly so future PRs can quote raw SQL or Drizzle queries without ambiguity.

### Strava-derived cards (SQLite table `activities`, Drizzle export `activities`)

**SQLite aggregate behavior note.** SQLite's `SUM(...)` returns `NULL` over an empty result set, and also returns `NULL` if every matched value is `NULL`. To deliver the missing-data behaviors below correctly, weekly-rollup queries must combine `COALESCE` with explicit row counts (e.g. `COUNT(*)` and `COUNT(distance_meters)`) so the implementation can distinguish:

- no activities in range (show `Data not available` or a zero with `0 rows` hint, per card)
- activities exist but the metric column is `NULL` (show `--`)
- a real zero result (show `0`)

This applies to weekly distance, weekly time, elevation gain, calories aggregates, and any other `SUM(...)`-based card.

| Card | Authority | Fields | Unit | Missing → |
|---|---|---|---|---|
| Weekly distance | Strava | `distanceMeters` (sum where `startDate` in ISO week) | mi (converted from m) | `0.00 mi` if 0 rows, `--` if all values null |
| Weekly time | Strava | `movingTimeSeconds` (sum) | `H:MM` | `0m` if 0 rows |
| Average pace | Strava | weighted from `distanceMeters` / `movingTimeSeconds` (or directly from `averageSpeed` weighted by `movingTimeSeconds`) | `m'ss"/mi` | `--'--"/mi` |
| Average cadence | Strava | `averageCadence` (weighted by `movingTimeSeconds`) | spm | `--` |
| Average HR | Strava | `averageHeartrate` (weighted by `movingTimeSeconds`) | bpm | `--` |
| Max HR | Strava | `maxHeartrate` (max over week) | bpm | `--` |
| Elevation gain | Strava | `totalElevationGain` (sum) | ft (converted from m) | `0 ft` if 0 rows |
| Power | Strava | `averageWatts` (weighted by `movingTimeSeconds`) | W | `--` |
| Suffer score | Strava | `sufferScore` (sum or max) | unitless | `--` |
| Longest run | Strava | row with max `distanceMeters` in window | mi | `--` |
| Streak | Strava | derived from distinct `date(startDate)` with `distanceMeters > 0` | days | `0` |
| Recent run | Strava | latest row by `startDate` | — | `Data not available` |

**Not currently represented in schema** — do not ship cards for these until the column exists:

- **Calories** — there is no `calories` column on `activities` in the current schema. Strava returns calories on the detail endpoint, but the value is not normalised into the `activities` row. The card stays gated until either (a) a `calories` column is added or (b) calories are surfaced via `activityRawJson` parsing.

### Apple Health cards (SQLite table `health_metrics`, Drizzle export `healthMetrics`)

`health_metrics` is a generic long table with columns `date`, `metric_type`, `value`, `unit`, `source` (Drizzle fields: `date`, `metricType`, `value`, `unit`, `source`). There are no direct columns like `vo2Max` or `restingHeartrate` on this table. Each Apple Health card is a query filtered by `metricType`. The `metricType` strings below match the comment in `schema.ts` (`"resting_hr"`, `"hrv"`, `"sleep_hours"`, `"steps"`) and propose four additional types to be wired during the Apple Health importer PR.

| Card | Authority | Query | Unit (from row) | Missing → |
|---|---|---|---|---|
| VO2 max | Apple Health | `metricType = "vo2_max"`, latest `date` | ml/kg/min (`unit`) | `--` |
| Resting HR | Apple Health | `metricType = "resting_hr"`, latest `date` | bpm (`unit`) | `--` |
| HRV | Apple Health | `metricType = "hrv"`, latest `date` | ms (`unit`) | `--` |
| Sleep | Apple Health | `metricType = "sleep_hours"`, latest `date` | h (`unit`) | `--` |
| Steps | Apple Health | `metricType = "steps"`, latest `date` | count (`unit`) | `--` |
| Weight | Apple Health | `metricType = "weight"`, latest `date` | lb (`unit`) | `--` |
| Active energy | Apple Health | `metricType = "active_energy"`, latest `date` | cal (`unit`) | `--` |
| Cardio recovery | Apple Health | `metricType = "cardio_recovery"`, latest `date` | bpm (`unit`) | `--` |

The card's displayed unit comes from the row's `unit` column whenever present; the table column above is only the expected default. Dashboard never converts silently — if the unit differs from expected, the card shows the value with its actual unit and a `SourceLabel` noting the source.

Some of the same physiology values are also pre-aggregated on the `daily_summaries` table (Drizzle export `dailySummaries`, fields `restingHeartrate`, `hrv`, `sleepHours`, `steps`). PR E should prefer `daily_summaries` for trend/sparkline series and `health_metrics` for raw point-in-time reads; this avoids fan-out queries against the long `health_metrics` table.

### Training-load cards (SQLite table `training_load`, Drizzle export `trainingLoad`)

| Card label | Authority | Schema field | Unit | Missing → |
|---|---|---|---|---|
| Daily load | derived | `dailyTrainingStress` (today) | unitless | `--` |
| ATL (acute) | derived | `acuteLoad` (latest) | unitless | `--` |
| CTL (chronic) | derived | `chronicLoad` (latest) | unitless | `--` |
| TSB (form) | derived | `trainingStressBalance` (latest) | unitless | `--` |
| ACWR | derived | rolling 7d sum / 28d avg of `dailyTrainingStress` | unitless | `--` |
| Load warning | derived | comparison of `acuteLoad` vs `chronicLoad` | banded | hidden until both values exist |

Dashboard labels use the conventional shorthand (ATL / CTL / TSB / daily load) while reading the canonical column names above. Formulas for `dailyTrainingStress` (a.k.a. TRIMP/TSS) live in [[08_TRAINING-ANALYTICS]] and are not implemented yet — `training_load` rows only exist once that module ships.

### Derived calculations (not yet implemented)

- Weekly rollups by ISO week from `activities.startDate`.
- Streak: consecutive days containing >= 1 run with `distanceMeters > 0`.
- Weighted averages: weight each activity by `movingTimeSeconds` rather than row count.
- `dailyTrainingStress`, `acuteLoad`, `chronicLoad`, `trainingStressBalance`: formulas in [[08_TRAINING-ANALYTICS]].
- ACWR: 7-day `dailyTrainingStress` sum / 28-day `dailyTrainingStress` average.

All derivations live server-side in `src/server/dashboard/` (to be created in PR C / PR F). None ship in this PR. This PR makes **no schema changes**.

---

## 6. Route plan

| Route | Status | Purpose |
|---|---|---|
| `/` | implemented | Home / connect-front-door (existing) |
| `/dashboard` | **placeholder this PR** | Main dashboard. Empty states only until PR C. |
| `/connect` | implemented | Strava OAuth + local sync log (existing) |
| `/activities` | implemented | Archive page (existing). Long-term: alias under `/runs`. |
| `/runs` | future (PR D) | Renamed/aliased runs list using new `ActivitySessionCard`. |
| `/runs/[id]` | future (PR D) | Single activity detail with splits, HR graph, GPS map. |
| `/health` | future (PR E) | Apple Health metrics page with D/W/M/Y toggle. |
| `/training-load` | future (PR F) | TSS / CTL / ATL / TSB / ACWR with warnings. |
| `/race-plan` | later | Race prediction surface, post-Phase 3. |

Route decisions:

- `/dashboard` is the new canonical landing for a connected user. The existing `/` home stays for first-time setup until `/dashboard` is fully built.
- `/runs` will replace `/activities` once `ActivitySessionCard` exists. The old `/activities` URL stays alive via redirect for at least one release.
- No route rename in this PR.

---

## 7. Implementation phases

Each phase is intended to ship as one focused PR.

### PR A (this PR) — planning document + placeholder route

- Adds `docs/brain/16_DASHBOARD-IMPLEMENTATION-PLAN.md` (this file).
- Adds `src/app/dashboard/page.tsx` as a minimal empty-state placeholder.
- Updates `docs/brain/00_PROJECT-BRAIN.md` brain-file index with `[[16_DASHBOARD-IMPLEMENTATION-PLAN]]`.
- No design tokens, no data wiring, no new components, no new dependencies.

### PR B — design system + reusable components

- Adds `--metric-*` accent tokens to `globals.css`.
- Adds `src/components/dashboard/` with `DashboardShell`, `DashboardHeader`, `SectionHeader`, `MetricCard`, `LargeMetricCard`, `TrendCard`, `StatusBadge`, `LastSyncedBadge`, `SourceLabel`, `EmptyMetricState`, `TimeRangeToggle`, `MiniBarChart`, `MiniLineChart`.
- Renders these components on `/dashboard` in their empty state.
- Still no metric values, still no fake data.

### PR C — Strava-derived cards

- Adds `src/server/dashboard/` queries for weekly rollups.
- Wires real Strava-backed metric cards: weekly distance, weekly time, average pace, elevation, recent run, longest run, average cadence, average HR.
- Cards follow the per-card missing and zero-state behavior defined in Section 5. Aggregate totals may show real zero values when there are no activities in range; standalone card-level empty states show `Data not available`.

### PR D — runs list and run detail

- Adds `/runs` using `ActivitySessionCard`.
- Adds `/runs/[id]` with splits, HR graph, GPS map, time-range toggle.
- Redirects `/activities` to `/runs`.

### PR E — Apple Health cards

- Depends on Apple Health importer landing (see [[05_APPLE-HEALTH-INGESTION]]).
- Adds `/health` page.
- Adds resting HR, HRV, VO2 max, sleep, steps cards to `/dashboard`.

### PR F — training load section

- Depends on TRIMP / CTL / ATL / TSB module landing (see [[08_TRAINING-ANALYTICS]]).
- Adds `/training-load` page.
- Adds load + TSB + ACWR cards and load-warning state to `/dashboard`.

---

## 8. Strict rules (verbatim)

These are non-negotiable for every dashboard PR:

- **Do not fake data.** Every visible number must trace back to a real row in SQLite.
- **Do not seed mock runs.** No fixtures land in user data paths.
- **Do not show charts with fake data.** If a series is empty, the chart does not render — the card shows `Data not available`.
- **Do not claim metrics exist if they are not in SQLite.** New cards require schema-backed data first.
- **Use "Data not available" for standalone card empty states.**
- **Use "--" only for compact inline/table-cell missing values.**
- **Use real zero values only when zero is a truthful aggregate result.**
- **Never use zero as a placeholder for missing source data.**
- **Every shipped metric exposes source, date, value, and unit.** Source via `SourceLabel`, date via card subhead or `LastSyncedBadge`, unit alongside the value.
- **Strava is authoritative** for run activity data.
- **Apple Health is authoritative** for physiology data.
- **No Supabase.**
- **No Vercel runtime dependency.**
- **No cloud database.**
- **No public auth.**
- **No AI chat yet** (see [[09_GROUNDED-AI-CHAT]], Phase 4).

---

## 9. Suggested next PR

**PR B — design system + reusable components.**

Reasoning: it is the smallest unblocking PR. It has no data dependencies, no schema work, and no risk of leaking fake numbers (all components render empty by design). It lets every later PR (C, D, E, F) compose on a shared, reviewed set of primitives instead of re-inventing card chrome.

Scope of PR B in one paragraph: add `--metric-*` tokens to `globals.css`, scaffold `src/components/dashboard/` with the components listed in section 4, render the scaffolded components on `/dashboard` in their empty state, run `pnpm lint` and `pnpm build`.
