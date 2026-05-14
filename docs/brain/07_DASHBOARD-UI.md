# 07 - Dashboard UI

> See also: [[00_PROJECT-BRAIN]] | [[03_DATA-SOURCES]] | [[08_TRAINING-ANALYTICS]]

---

## Status

**Phase 1 / Phase 2 split.** The Phase 1 archive still exists behind `/activities`, but it now survives as a compatibility redirect into the Phase 2 run-first `/runs` surface. `/dashboard` shows real Strava-backed Running cards from the local archive, while Health and Training Load remain scaffolded for later Phase 2 / Phase 3 work.

---

## Design principles

- Dark theme by default with a green-led accent system
- No fake charts - only render charts when real data exists
- Missing values display as `--`
- Standalone empty states use `Data not available`
- Mobile-friendly but optimized for desktop (localhost app)
- Large rounded slab surfaces beat dense widget grids

---

## Planned pages

### `/` - Home
Current: a green-led front door with one full-bleed hero slab, two primary actions (`Connect Strava` and `Open Runs`), one persistent connection-status row linking to `/connect`, a footer note that distinguishes local storage from user-initiated Strava traffic, and a callback-status banner after OAuth redirects. The banner is announced as a live region so one-off OAuth results are exposed to screen readers.
Phase 2: redirect to `/dashboard` once data is available.

### `/connect` - Strava connection
- Start or repeat the Strava OAuth flow
- View persisted local connection metadata
- Trigger a local summary-activity sync via `POST /api/strava/sync`
- Review the recent local sync log without leaving the page
- Jump into `/runs` once local activity rows exist
- Use the home-page callback banner for one-off OAuth success or failure messages
- Callback status includes local config errors as well as Strava-returned OAuth outcomes

### `/runs` - Run archive
- Implemented in Phase 2 as the run-first successor to the original archive
- Hero surface for the latest run, linking directly into detail
- Stack of `ActivitySessionCard` rows for the rest of the local run history
- Real route previews when GPS data exists; indoor/no-GPS activities render an honest fallback state
- Imperial units are the default UI language (`mi`, `ft`, `/mi`)
- `/activities` remains alive as a compatibility redirect to `/runs`
- No fake charts, no fake calories, and no estimated indoor-run distance

### `/dashboard` - Main dashboard
Current:
- Reusable dashboard shell and card primitives are implemented in `src/components/dashboard/`
- `/dashboard` now reads the Running section from real local Strava activity rows and local sync metadata
- Running currently shows weekly distance/time/pace/elevation/run-count summaries plus recent run, longest run, average cadence, average HR, and pace trend when the local archive supports them
- Health and Training Load still render honest empty states until later PRs wire Apple Health imports and derived analytics data
- Presentational primitives include `DashboardShell`, `DashboardHeader`, `SectionHeader`, `MetricCard`, `LargeMetricCard`, `TrendCard`, `StatusBadge`, `LastSyncedBadge`, `SourceLabel`, `EmptyMetricState`, `TimeRangeToggle`, `MiniBarChart`, and `MiniLineChart`
- Dashboard metric tokens now exist in `globals.css`: `--metric-move`, `--metric-exercise`, `--metric-distance`, `--metric-time`, `--metric-trend`, `--metric-cardio`, `--metric-recovery`, and `--metric-warning`
- These tokens are semantic aliases over the locked green accent ramp, not a second multicolor brand system; `--metric-warning` remains status-only

Later:
- Recent activities list (last 10 runs)
- Weekly mileage bar chart (real data only)
- 90-day resting HR trend (from Apple Health)
- Current training load summary (ATL / CTL / TSB)

### `/runs/[id]` - Run detail
- Full run summary from local SQLite rows
- Splits table, heart-rate graph, and GPS route preview when those local tables exist
- MI/KM split toggle for distance and pace presentation
- Empty-state honesty when split rows or heart-rate streams have not been imported yet

### `/health` - Health metrics
- Resting HR over time
- HRV trend
- Sleep duration trend
- Steps per day

### `/analytics` - Training analytics (Phase 3)
- CTL / ATL / TSB over time
- Race predictor
- Weekly training load

### `/settings` - Settings
- Strava connection status
- Sync controls
- Database stats

---

## Data rules for UI

1. Never render a chart with zero data points.
2. Show `Data not available` instead of an empty chart when no real series exists.
3. Show `--` in any cell where the value is `null` or `undefined`.
4. Do not show estimated or projected values without a clear label.
