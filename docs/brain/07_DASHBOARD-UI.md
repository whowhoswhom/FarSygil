# 07 - Dashboard UI

> See also: [[00_PROJECT-BRAIN]] | [[03_DATA-SOURCES]] | [[08_TRAINING-ANALYTICS]]

---

## Status

**Phase 1 / Phase 2 split.** The `/activities` Archive page is implemented in Phase 1. `/dashboard` now has Phase 2 scaffolding in place, while real metric wiring remains future work.

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
Current: a green-led front door with one full-bleed hero slab, two primary actions (`Connect Strava` and `Open Archive`), one persistent connection-status row linking to `/connect`, a footer note that distinguishes local storage from user-initiated Strava traffic, and a callback-status banner after OAuth redirects. The banner is announced as a live region so one-off OAuth results are exposed to screen readers.
Phase 2: redirect to `/dashboard` once data is available.

### `/connect` - Strava connection
- Start or repeat the Strava OAuth flow
- View persisted local connection metadata
- Trigger a local summary-activity sync via `POST /api/strava/sync`
- Review the recent local sync log without leaving the page
- Jump into `/activities` once local activity rows exist
- Use the home-page callback banner for one-off OAuth success or failure messages
- Callback status includes local config errors as well as Strava-returned OAuth outcomes

### `/activities` - Archive
- Implemented in Phase 1 as a dark, slab-based archive rather than a simple table
- Hero surface for the latest visible activity
- Floating filter rail with URL-synced sport, range, search, sort, and minimum-distance filters
- Recent band with two major slabs, then a Synced totals strip, then an Archive band of smaller slabs
- Real route previews when GPS data exists; indoor/no-GPS activities render an honest fallback state
- Imperial units are now the default UI language (`mi`, `ft`, `/mi`, `mph`)
- Synced totals reflect the full local archive, not the active filter slice
- No fake charts, no fake calories, and no estimated indoor-bike distance

### `/dashboard` - Main dashboard
Current:
- Reusable dashboard shell and card primitives are implemented in `src/components/dashboard/`
- `/dashboard` renders section scaffolding for Running, Health, and Training Load
- All cards remain honest empty states until later PRs wire real Strava, Apple Health, and derived analytics data
- Presentational primitives include `DashboardShell`, `DashboardHeader`, `SectionHeader`, `MetricCard`, `LargeMetricCard`, `TrendCard`, `StatusBadge`, `LastSyncedBadge`, `SourceLabel`, `EmptyMetricState`, `TimeRangeToggle`, `MiniBarChart`, and `MiniLineChart`
- Dashboard metric tokens now exist in `globals.css`: `--metric-move`, `--metric-exercise`, `--metric-distance`, `--metric-time`, `--metric-trend`, `--metric-cardio`, `--metric-recovery`, and `--metric-warning`

Later:
- Recent activities list (last 10 runs)
- Weekly mileage bar chart (real data only)
- 90-day resting HR trend (from Apple Health)
- Current training load summary (ATL / CTL / TSB)

### `/activities/[id]` - Activity detail
- Full activity data: splits table, HR graph, GPS map
- Raw Strava data accessible via toggle

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
