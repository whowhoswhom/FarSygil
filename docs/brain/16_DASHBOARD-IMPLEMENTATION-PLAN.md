# 16 - Dashboard Implementation Plan

> See also: [[00_PROJECT-BRAIN]] | [[02_TECH-STACK]] | [[03_DATA-SOURCES]] | [[06_DATABASE-SCHEMA]] | [[07_DASHBOARD-UI]] | [[08_TRAINING-ANALYTICS]] | [[13_ROADMAP-PHASES]] | [[14_AGENT-INSTRUCTIONS]]

---

## Status

**PR B implemented.** Dashboard design tokens and reusable component primitives now exist, and `/dashboard` renders the new scaffold in honest empty-state-only form. Real Strava, Apple Health, and derived metric wiring remain scheduled in later PR phases below.

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

The dashboard extends the existing token system in `src/app/globals.css`. The tokens listed here are now implemented as part of PR B.

### Background

- Page background: existing radial gradient on near-black (`--field-deep`, `--field-mid`) defined in `body` of `globals.css`. Reused as-is.
- Card surface: existing `.surface-slab` (glass background, inset highlight, hover lift). Reused as-is.
- Hero card surface: existing `.surface-slab[data-depth="hero"]`. Reused as-is.

### Accent palette

The Apple Fitness multi-color metric palette is mapped to FarSygil-flavored tokens. Existing `--accent-*` tokens are kept; new `--metric-*` tokens are additive.

| Token | Suggested value | Semantic use |
|---|---|---|
| `--metric-move` | reuse `--accent-core` (`#7bc241`) | movement and cardio emphasis within the green-led system |
| `--metric-exercise` | reuse `--accent-bright` (`#a8e26c`) | sessions, runs, effort summaries |
| `--metric-distance` | reuse `--accent-bright` (`#a8e26c`) | distance, pace, endurance surfaces |
| `--metric-time` | reuse `--accent-core` (`#7bc241`) | weekly time, duration, elevation |
| `--metric-trend` | reuse `--accent-deep` (`#3f7220`) | trends, load, longitudinal surfaces |
| `--metric-cardio` | reuse `--accent-core` (`#7bc241`) | cardio fitness and physiology surfaces |
| `--metric-recovery` | reuse `--accent-bright` (`#a8e26c`) | recovery, HRV, readiness surfaces |
| `--metric-warning` | reuse the warning role (`--danger-ink` / `--danger-soft`) | warnings and disconnect states only |

Each token is exposed as both a solid color and a low-opacity wash (for example `--metric-distance-wash`) for card halos.
These semantic aliases exist so dashboard components can describe intent without introducing a second hue system. All non-warning dashboard tones stay inside the locked green accent family.

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
- >= 1024px: 12-column grid. Hero spans 6-8 cols; metric cards span 3-4 cols; trend cards span 4-6 cols.
- All grids use CSS grid or Tailwind grid utilities; no JS layout.

### Card feel

- Tactile: `.surface-slab` already provides glass + inset highlight + hover lift.
- Optional accent halo: a low-opacity radial wash in the card's metric tone. Implemented in PR B via `--dashboard-tone` and `--dashboard-tone-wash`.
- No external shadow libraries.

---

## 3. Dashboard information architecture

### Top section

- Header: "FarSygil"
- Subtitle: "Local-first running command center"
- Strava connection status badge (scaffolded with an unavailable state in PR B; real `/connect`-backed status wiring lands in PR C)
- Last-synced badge (scaffolded with an empty value in PR B; real sync-log wiring lands in PR C)
- Time-range toggle scaffold (`D / W / M / Y`, presentational only in PR B)

### Hero band

- This-week running summary card: weekly distance, weekly time, run count, average pace.
- Recent run card: latest activity name, date, distance, pace, HR (links to `/runs/[id]` once detail routes exist).

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

- **Empty state** - no runs synced yet, no Apple Health imported. Card renders its label + the string `Data not available` + a one-line hint of what unlocks it.
- **Error state** - DB read failed. Card renders its label + `Could not load.` and a quiet retry affordance.
- **Missing-data state** - metric is null on otherwise-present rows. Cell renders `--`. Never renders zero unless zero is a real measurement.

- **Use "Data not available" for standalone card empty states.**
- **Use "--" only for compact inline/table-cell missing values.**
- **Use real zero values only when zero is a truthful aggregate result, such as zero runs, zero distance, or zero elevation in an empty date range.**
- **Never use zero as a placeholder for missing source data.**

---

## 4. Component plan

All new components live under `src/components/dashboard/`. The design-system scaffold listed below is now implemented in PR B; later phases wire these primitives to real data.

| Component | Purpose | Notes |
|---|---|---|
| `DashboardShell` | page-level layout wrapper, grid scaffolding | reuses `.page-shell` and dashboard shell utilities from `globals.css` |
| `DashboardHeader` | title, subtitle, `LastSyncedBadge`, `StatusBadge` | scaffold-only in PR B; no live data query |
| `SectionHeader` | small kicker + section title | reuses `.section-kicker` |
| `MetricCard` | single metric, big number, optional mini chart | accent prop binds to `--metric-*` tokens |
| `LargeMetricCard` | hero-sized metric, spans 2 cols on tablet+ | uses `.surface-slab[data-depth="hero"]` |
| `TrendCard` | metric + trailing sparkline | sparkline via `MiniLineChart` |
| `MiniBarChart` | pure SVG, no chart lib | takes `number[]`, returns `null` when empty |
| `MiniLineChart` | pure SVG sparkline | takes `number[]`, returns `null` when empty |
| `StatusBadge` | connection-state pill primitive | presentational only in PR B |
| `LastSyncedBadge` | "Last sync: ..." pill | presentational only in PR B |
| `SourceLabel` | small "Strava" / "Apple Health" / "Derived" tag | enforces data-authority transparency |
| `TimeRangeToggle` | D / W / M / Y segmented control | scaffold only in PR B; disabled on `/dashboard` |
| `EmptyMetricState` | label + `Data not available` + unlock hint | default standalone empty-state primitive |
| `ActivitySessionCard` | row-style card for run list | still deferred; not implemented in PR B |

Existing utilities to reuse (do not duplicate):

- `src/lib/activities/format.ts` - pace, distance, duration formatters
- `src/lib/activities/polyline.ts` - route preview decoding (for a future `ActivitySessionCard`)
- `src/components/activities/route-preview.tsx` - small route preview (already exists)

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

**SQLite aggregate behavior note.** SQLite's `SUM(...)` returns `NULL` over an empty result set, and also returns `NULL` if every matched value is `NULL`. To deliver the missing-data behaviors below correctly, weekly-rollup queries must combine `COALESCE` with explicit row counts (for example `COUNT(*)` and `COUNT(distance_meters)`) so the implementation can distinguish:

- no activities in range (show `Data not available` or a zero with `0 rows` hint, per card)
- activities exist but the metric column is `NULL` (show `--`)
- a real zero result (show `0`)

This applies to weekly distance, weekly time, elevation gain, calories aggregates, and any other `SUM(...)`-based card.

| Card | Authority | Fields | Unit | Missing -> |
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
| Recent run | Strava | latest row by `startDate` | - | `Data not available` |

**Not currently represented in schema** - do not ship cards for these until the column exists:

- **Calories** - there is no `calories` column on `activities` in the current schema. Strava returns calories on the detail endpoint, but the value is not normalized into the `activities` row. The card stays gated until either (a) a `calories` column is added or (b) calories are surfaced via `activityRawJson` parsing.

### Apple Health cards (SQLite table `health_metrics`, Drizzle export `healthMetrics`)

`health_metrics` is a generic long table with columns `date`, `metric_type`, `value`, `unit`, `source` (Drizzle fields: `date`, `metricType`, `value`, `unit`, `source`). There are no direct columns like `vo2Max` or `restingHeartrate` on this table. Each Apple Health card is a query filtered by `metricType`. The `metricType` strings below match the comment in `schema.ts` (`"resting_hr"`, `"hrv"`, `"sleep_hours"`, `"steps"`) and propose four additional types to be wired during the Apple Health importer PR.

| Card | Authority | Query | Unit (from row) | Missing -> |
|---|---|---|---|---|
| VO2 max | Apple Health | `metricType = "vo2_max"`, latest `date` | ml/kg/min (`unit`) | `--` |
| Resting HR | Apple Health | `metricType = "resting_hr"`, latest `date` | bpm (`unit`) | `--` |
| HRV | Apple Health | `metricType = "hrv"`, latest `date` | ms (`unit`) | `--` |
| Sleep | Apple Health | `metricType = "sleep_hours"`, latest `date` | h (`unit`) | `--` |
| Steps | Apple Health | `metricType = "steps"`, latest `date` | count (`unit`) | `--` |
| Weight | Apple Health | `metricType = "weight"`, latest `date` | lb (`unit`) | `--` |
| Active energy | Apple Health | `metricType = "active_energy"`, latest `date` | cal (`unit`) | `--` |
| Cardio recovery | Apple Health | `metricType = "cardio_recovery"`, latest `date` | bpm (`unit`) | `--` |

The card's displayed unit comes from the row's `unit` column whenever present; the table column above is only the expected default. Dashboard never converts silently - if the unit differs from expected, the card shows the value with its actual unit and a `SourceLabel` noting the source.

Some of the same physiology values are also pre-aggregated on the `daily_summaries` table (Drizzle export `dailySummaries`, fields `restingHeartrate`, `hrv`, `sleepHours`, `steps`). PR E should prefer `daily_summaries` for trend/sparkline series and `health_metrics` for raw point-in-time reads; this avoids fan-out queries against the long `health_metrics` table.

### Training-load cards (SQLite table `training_load`, Drizzle export `trainingLoad`)

| Card label | Authority | Schema field | Unit | Missing -> |
|---|---|---|---|---|
| Daily load | derived | `dailyTrainingStress` (today) | unitless | `--` |
| ATL (acute) | derived | `acuteLoad` (latest) | unitless | `--` |
| CTL (chronic) | derived | `chronicLoad` (latest) | unitless | `--` |
| TSB (form) | derived | `trainingStressBalance` (latest) | unitless | `--` |
| ACWR | derived | rolling 7d sum / 28d avg of `dailyTrainingStress` | unitless | `--` |
| Load warning | derived | comparison of `acuteLoad` vs `chronicLoad` | banded | hidden until both values exist |

Dashboard labels use the conventional shorthand (ATL / CTL / TSB / daily load) while reading the canonical column names above. Formulas for `dailyTrainingStress` (a.k.a. TRIMP/TSS) live in [[08_TRAINING-ANALYTICS]] and are not implemented yet - `training_load` rows only exist once that module ships.

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
| `/dashboard` | **scaffolded in PR B** | Main dashboard shell. Empty states only until PR C. |
| `/connect` | implemented | Strava OAuth + local sync log (existing) |
| `/activities` | implemented | Archive page (existing). Long-term: alias under `/runs`. |
| `/runs` | future (PR D) | Renamed/aliased runs list using new `ActivitySessionCard`. |
| `/runs/[id]` | future (PR D) | Single activity detail with splits, HR graph, GPS map. |
| `/health` | future (PR E) | Apple Health metrics page with D/W/M/Y toggle. |
| `/training-load` | future (PR F) | TSS / CTL / ATL / TSB / ACWR with warnings. |
| `/race-plan` | later | Race prediction surface, post-Phase 3. |

Route decisions:

- `/dashboard` is the new canonical landing for a connected user once real cards exist. The existing `/` home stays for first-time setup until dashboard data wiring is complete.
- `/runs` will replace `/activities` once `ActivitySessionCard` exists. The old `/activities` URL stays alive via redirect for at least one release.
- No route rename in PR B.

---

## 7. Implementation phases

Each phase is intended to ship as one focused PR.

### PR A (implemented) - planning document + placeholder route

- Added `docs/brain/16_DASHBOARD-IMPLEMENTATION-PLAN.md`.
- Added `src/app/dashboard/page.tsx` as a minimal empty-state placeholder.
- Added the dashboard plan to `00_PROJECT-BRAIN.md`.

### PR B (implemented) - design system + reusable components

- Added additive `--metric-*` tokens and wash variants to `globals.css`.
- Added `src/components/dashboard/` with `DashboardShell`, `DashboardHeader`, `SectionHeader`, `MetricCard`, `LargeMetricCard`, `TrendCard`, `StatusBadge`, `LastSyncedBadge`, `SourceLabel`, `EmptyMetricState`, `TimeRangeToggle`, `MiniBarChart`, and `MiniLineChart`.
- Rebuilt `/dashboard` around those primitives while keeping every section in an honest empty state.
- Still no metric values, still no fake data, and no runtime wiring.

### PR C - Strava-derived cards

- Add `src/server/dashboard/` queries for weekly rollups.
- Wire real Strava-backed metric cards: weekly distance, weekly time, average pace, elevation, recent run, longest run, average cadence, average HR.
- Cards follow the per-card missing and zero-state behavior defined in Section 5. Aggregate totals may show real zero values when there are no activities in range; standalone card-level empty states show `Data not available`.

### PR D - runs list and run detail

- Add `/runs` using `ActivitySessionCard`.
- Add `/runs/[id]` with splits, HR graph, GPS map, time-range toggle.
- Redirect `/activities` to `/runs`.

### PR E - Apple Health cards

- Depends on Apple Health importer landing (see [[05_APPLE-HEALTH-INGESTION]]).
- Add `/health` page.
- Add resting HR, HRV, VO2 max, sleep, steps cards to `/dashboard`.

### PR F - training load section

- Depends on TRIMP / CTL / ATL / TSB module landing (see [[08_TRAINING-ANALYTICS]]).
- Add `/training-load` page.
- Add load + TSB + ACWR cards and load-warning state to `/dashboard`.

---

## 8. Strict rules (verbatim)

These are non-negotiable for every dashboard PR:

- **Do not fake data.** Every visible number must trace back to a real row in SQLite.
- **Do not seed mock runs.** No fixtures land in user data paths.
- **Do not show charts with fake data.** If a series is empty, the chart does not render - the card shows `Data not available`.
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

**PR C - Strava-derived cards.**

Reasoning: the design system and reusable dashboard primitives now exist, so the next smallest meaningful step is wiring real Strava-backed cards without inventing numbers or placeholder charts.

Scope of PR C in one paragraph: add `src/server/dashboard/` weekly-rollup queries, wire real Strava-backed cards like weekly distance, weekly time, recent run, longest run, pace, cadence, and heart rate into the existing dashboard primitives, preserve empty states where data is missing, and run `pnpm lint` plus `pnpm build`.
