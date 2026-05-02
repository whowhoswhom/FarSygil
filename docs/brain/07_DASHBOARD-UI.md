# 07 - Dashboard UI

> See also: [[00_PROJECT-BRAIN]] · [[03_DATA-SOURCES]] · [[08_TRAINING-ANALYTICS]]

---

## Status

**Phase 2 - planned.** Dashboard not yet implemented.

---

## Design principles

- Dark theme by default (zinc/slate colour palette)
- No fake charts - only render charts when real data exists
- Missing values display as `--`
- Mobile-friendly but optimised for desktop (localhost app)
- shadcn/ui component primitives

---

## Planned pages

### `/` - Home
Current: phase card overview plus a `Connect Strava` CTA, a persistent local Strava connection card linking to `/connect`, a footer note that distinguishes local storage from user-initiated Strava traffic, and a callback-status banner after OAuth redirects. The banner is announced as a live region so one-off OAuth results are exposed to screen readers.
Phase 2: redirect to `/dashboard` once data is available.

### `/connect` - Strava connection
- Start or repeat the Strava OAuth flow
- View persisted local connection metadata
- Use the home-page callback banner for one-off OAuth success or failure messages
- Callback status includes local config errors as well as Strava-returned OAuth outcomes

### `/dashboard` - Main dashboard
- Recent activities list (last 10 runs)
- Weekly mileage bar chart (real data only)
- 90-day resting HR trend (from Apple Health)
- Current training load summary (ATL / CTL / TSB)

### `/activities` - Activity list
- Sortable, filterable table of all activities
- Columns: date, name, distance, pace, HR, elevation, source

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
2. Show a `No data yet` message instead of an empty chart.
3. Show `--` in any cell where the value is `null` or `undefined`.
4. Do not show estimated or projected values without a clear label.
