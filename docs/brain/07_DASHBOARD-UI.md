# 07 - Dashboard and Shell UI

> See also: [[00_PROJECT-BRAIN]] | [[04_STRAVA-INGESTION]] | [[13_ROADMAP-PHASES]] | [[17_VISUAL-REBOOT-PLAN]]

---

## Status

Phase 2 now uses a unified app shell instead of the old page-by-page Phase 1
composition. `/dashboard`, `/runs`, `/runs/[id]`, `/archive`, `/connect`,
`/settings`, `/health`, and `/training-load` all live inside the reboot shell.
`/` is now a smart entry that redirects connected users to `/dashboard` and
renders a disconnected onboarding surface otherwise.

---

## Route model

| Route | Status | Purpose |
|---|---|---|
| `/` | implemented | disconnected onboarding; connected users redirect to `/dashboard` |
| `/dashboard` | implemented | primary connected landing with real Strava-backed Running cards |
| `/runs` | implemented | run-first archive route inside the shell |
| `/runs/[id]` | implemented | premium run-detail route with faux-map, splits, and chart tiles |
| `/archive` | implemented | read-only local SQLite provenance, counts, latest writes, and detail/stream coverage |
| `/connect` | implemented | Strava auth and sync management, including detail sync |
| `/settings` | implemented | local-first system surface and future preference placeholder |
| `/health` | implemented | shell route with Apple Health ZIP/XML import control and latest local metric cards |
| `/training-load` | implemented scaffold | shell route with honest empty body until analytics land |
| `/trends` | deferred | no route until trend analytics are mature enough to be real |
| `/activities` | compatibility redirect | temporary redirect to `/runs` |
| `/activities/[id]` | compatibility redirect | temporary redirect to `/runs/[id]` |

---

## Design rules

- Near-black glass shell stays.
- FarSygil brand identity stays green-led.
- Metric surfaces may use the multicolor data palette defined in
  `docs/design/DESIGN_CONTRACT.md`.
- Standalone empty state: `Data not available`
- Compact inline missing value: `--`
- Mockup frame, honest empty body
- No fake charts
- No fake geographic maps
- No Apple-style rings
- No motivational copy
- Decorative orbs/glows are allowed only when the tone maps directly to the
  card's data domain. Neutral provenance cards such as Archive Status and Daily
  Battery use the base glass surface without decorative orbs.

---

## Implemented shell pieces

- Desktop left rail, including Archive
- Mobile bottom navigation stays at five items; Archive is reached from
  dashboard/contextual links on mobile
- Top status strip with local Strava state, Apple Health import state, and
  last-sync context
- App-shell auto-refresh that runs the local Strava freshness pass when the
  latest successful sync is stale, unless recent local sync logs show a Strava
  rate-limit cooldown is active
- Specialized dashboard cards and run-detail tiles
- Local faux-map route treatment built from real polyline data only

The shell and new metric palette are opt-in by rebuilt routes. Unreworked
surfaces should not be half-upgraded by global CSS drift.

---

## Data-reality matrix

This matrix is the implementation authority whenever a mockup conflicts with
data reality.

| Surface | Data status | Rendering policy | Unlock condition |
|---|---|---|---|
| Dashboard weekly distance, time, pace, elevation, cadence, HR, recent run, longest run | real today from Strava archive rows | render fully with real values and charts | none |
| Dashboard power tile | partially available; depends on real `averageWatts` data | render time-weighted average across current-week runs with real `averageWatts` and positive moving time; empty body when zero qualifying runs | real power values on current-week local Strava runs |
| Dashboard daily stress card | partial | render latest persisted daily stress and trend only from real local `training_load.daily_training_stress` rows | `/training-load` recompute writes daily stress |
| Dashboard health cluster | real today when imported rows exist | render latest values and trend sparklines where Apple Health-sourced `health_metrics` rows exist; missing values remain `--`; trend lines require at least two real points | Apple Health importer writes local metric rows |
| Dashboard archive-status card | real today | render local SQLite path when known, counts, latest source writes, and detail/stream coverage; no action buttons | none |
| Dashboard Daily Battery card | deferred | render only a real/absent input checklist for HRV, resting HR, sleep, and daily stress; no score slot and no numeric placeholder | future deterministic Daily Battery formula |
| `/training-load` daily stress panel | partial | render only persisted daily stress computed from real local Strava runs; show `--` when nothing can be computed | user runs the local daily-stress recompute |
| Run-detail faux-map | real polyline today | render abstract faux-map backdrop plus real route only | none |
| Run-detail splits table | real only after detail sync populates split rows | render premium frame; empty body until rows exist | detail sync writes `activity_splits` |
| Run-detail HR / cadence / pace / elevation tiles | partial today; strongest after detail sync | render only when real series exists, otherwise honest empty body | detail sync writes usable stream rows or split fallback rows |
| Calories cards or trends | forbidden | never render | none |
| Apple Health latest values and trends such as VO2 Max, sleep, HRV, steps | real today when imported rows exist | render latest local values and bounded trend sparklines on `/health` and the dashboard health cluster; missing metrics remain `--` | Apple Health importer writes local metric rows |
| Derived insight banners | constrained | render only when deterministic, factual, and labeled as derived | route-specific deterministic rule |
| Fake city labels or geocoded map chips | forbidden | never render | none |

---

## Current route notes

### `/dashboard`

- Uses the reboot shell and multicolor card system.
- Running renders from real local Strava-derived aggregates.
- Default range is This Week, using the current Monday-to-Sunday aggregate
  window.
- Wide layout order: weekly hero, Recent Run + Longest Run/Daily Stress,
  Power/Cadence/HR + Health, Training Load + Recovery, then Daily Battery +
  Archive Status.
- Tablet and phone stack in the same importance order.
- Health renders latest local Apple Health values and trend sparklines where
  imported rows exist.
- Daily Stress appears on the dashboard only from already persisted local
  training-load rows. Recompute remains owned by `/training-load`.
- Avg Power is the time-weighted current-week average across runs with real
  `averageWatts`; no qualifying runs means an honest empty body.
- Archive Status links to `/archive` and is read-only.
- Training Load, Recovery, and Daily Battery are deferred and show only honest
  empty/provenance bodies until their deterministic formulas land.
- Time-range and other future controls may exist visually before they become
  data-driven, but they must not imply unavailable data exists.

### Action ownership

- `/connect`: Strava OAuth, summary sync, detail sync.
- `/health`: Apple Health ZIP/XML import.
- `/training-load`: daily stress recompute.
- `/archive`: read-only provenance only.

### `/runs`

- Keeps the run-first archive model introduced in Phase 2.
- Promotes the latest run in a richer hero surface.
- Preserves route identity where real route data exists.

### `/runs/[id]`

- Uses a faux-map instead of external map tiles.
- Reads real `activity_splits` and `activity_streams` when present.
- Falls back honestly when detail rows are absent or malformed.

### `/connect`

- Remains the Strava authority surface.
- Exposes fresh sync, summary sync, and detail sync.
- Surfaces last successful sync, last sync error, local sync history, and the
  next actionable sync step.

### `/health`

- Real route now.
- Imports either `apple_health_data/apple_health_export.zip` or an extracted
  `apple_health_data/apple_health_export/export.xml` through the local API.
- Renders latest local VO2 Max, resting HR, and HRV in a Vitals cluster, with
  sleep and steps in a separate Daily Signals cluster, when real
  `health_metrics` rows with `source = "AppleHealth"` exist.
- Renders bounded trend sparklines only when a metric has at least two real
  local points.
- Missing metrics continue to render as `--`.
- No fake resting HR, VO2 Max, HRV, sleep, or steps values.

### `/training-load`

- Real route now.
- Computes and renders daily training stress from real local Strava runs.
- Uses Strava suffer score when present, otherwise a documented HR-duration
  fallback when average HR and moving time are available.
- Shows recent computed daily-stress bars only from persisted daily stress rows.
- Missing inputs do not create fake zero rows.
- No fake ATL / CTL / TSB / recovery scores.

### `/settings`

- Real route now.
- Holds local-first product/runtime framing and future settings placeholder
  content so `/connect` stays focused on Strava auth and sync.

---

## Faux-map spec

- Background is abstract, not geographic.
- Use layered gradients, subtle grid/noise/contour texture only.
- Show real route polyline and distance chip only.
- No coordinates fallback line.
- Indoor / no-GPS routes keep the honest fallback state.
