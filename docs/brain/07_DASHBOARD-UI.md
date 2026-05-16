# 07 - Dashboard and Shell UI

> See also: [[00_PROJECT-BRAIN]] | [[04_STRAVA-INGESTION]] | [[13_ROADMAP-PHASES]] | [[17_VISUAL-REBOOT-PLAN]]

---

## Status

Phase 2 now uses a unified app shell instead of the old page-by-page Phase 1
composition. `/dashboard`, `/runs`, `/runs/[id]`, `/connect`, `/settings`,
`/health`, and `/training-load` all live inside the reboot shell. `/` is now a
smart entry that redirects connected users to `/dashboard` and renders a
disconnected onboarding surface otherwise.

---

## Route model

| Route | Status | Purpose |
|---|---|---|
| `/` | implemented | disconnected onboarding; connected users redirect to `/dashboard` |
| `/dashboard` | implemented | primary connected landing with real Strava-backed Running cards |
| `/runs` | implemented | run-first archive route inside the shell |
| `/runs/[id]` | implemented | premium run-detail route with faux-map, splits, and chart tiles |
| `/connect` | implemented | Strava auth and sync management, including detail sync |
| `/settings` | implemented | local-first system surface and future preference placeholder |
| `/health` | implemented | shell route with Apple Health import control and latest local metric cards |
| `/training-load` | implemented scaffold | shell route with honest empty body until analytics land |
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

---

## Implemented shell pieces

- Desktop left rail
- Mobile bottom navigation
- Top status strip with local Strava state, Apple Health import state, and
  last-sync context
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
| Dashboard power tile | partially available; depends on real `averageWatts` data | render mockup-style frame; show honest empty body when data is missing | real power values on local activities |
| Dashboard health cluster | partial | render real latest values where Apple Health-sourced `health_metrics` rows exist; otherwise show `--` | Apple Health importer writes local metric rows |
| Dashboard training-load card | deferred | render mockup-style frame with honest empty body | analytics engine computes load rows |
| Dashboard recovery card | deferred | render mockup-style frame with honest empty body | real health import plus analytics output |
| Run-detail faux-map | real polyline today | render abstract faux-map backdrop plus real route only | none |
| Run-detail splits table | real only after detail sync populates split rows | render premium frame; empty body until rows exist | detail sync writes `activity_splits` |
| Run-detail HR / cadence / pace / elevation tiles | partial today; strongest after detail sync | render only when real series exists, otherwise honest empty body | detail sync writes usable stream rows or split fallback rows |
| Calories cards or trends | forbidden | never render | none |
| Apple Health latest values such as VO2 Max, sleep, HRV, steps | real today when imported rows exist | render latest local values on `/health` and the dashboard health cluster; missing metrics remain `--` | Apple Health importer writes local metric rows |
| Derived insight banners | constrained | render only when deterministic, factual, and labeled as derived | route-specific deterministic rule |
| Fake city labels or geocoded map chips | forbidden | never render | none |

---

## Current route notes

### `/dashboard`

- Uses the reboot shell and multicolor card system.
- Running renders from real local Strava-derived aggregates.
- Health renders latest local Apple Health values where imported rows exist.
- Training Load keeps an honest empty body for now.
- Time-range and other future controls may exist visually before they become
  data-driven, but they must not imply unavailable data exists.

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
- Exposes both summary sync and detail sync.
- Surfaces local sync history.

### `/health`

- Real route now.
- Imports an extracted Apple Health
  `apple_health_data/apple_health_export/export.xml` through the local API.
- Renders latest local VO2 Max, resting HR, HRV, sleep, and steps values when
  real `health_metrics` rows with `source = "AppleHealth"` exist.
- Missing metrics continue to render as `--`.
- No fake resting HR, VO2 Max, HRV, sleep, or steps values.

### `/training-load`

- Real route now.
- Honest shell-integrated scaffold only.
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
