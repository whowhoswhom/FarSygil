# FarSygil - Design Contract (Phase 2+)

> This document supersedes the original Phase 1 single-accent contract for new
> Phase 2+ surfaces. The old green-only system remains historical context for
> shipped Phase 1 work, but it is no longer the active rule set for the
> dashboard-era product shell.

---

## 1. Product direction

FarSygil is now a shell-based, local-first running command center.

The product look is defined by:
- near-black glass surfaces
- a green-led FarSygil brand mark
- multicolor metric tones for data surfaces
- dense, premium cards instead of generic admin widgets
- factual copy and real-data-only rendering

The design target is the approved mockup family, but data honesty wins
whenever a mockup element conflicts with reality.

---

## 2. Core color system

Use these tokens as the source of truth. They must match `src/app/globals.css`.

```css
:root {
  --field-deep: #050705;
  --field-mid: #0d120d;
  --field-lift: #151b14;

  --ink-1: #f4f7f0;
  --ink-2: rgba(232, 239, 229, 0.76);
  --ink-3: rgba(210, 221, 205, 0.42);

  --accent-core: #7bc241;
  --accent-bright: #a8e26c;
  --accent-deep: #3f7220;
  --accent-glow: rgba(168, 226, 108, 0.35);
  --accent-wash-a: rgba(123, 194, 65, 0.18);
  --accent-wash-b: rgba(63, 114, 32, 0.16);

  --metric-move: #ff7a33;
  --metric-move-wash: rgba(255, 122, 51, 0.18);
  --metric-exercise: #a7f43d;
  --metric-exercise-wash: rgba(167, 244, 61, 0.18);
  --metric-distance: #22dcff;
  --metric-distance-wash: rgba(34, 220, 255, 0.18);
  --metric-time: #ffd84d;
  --metric-time-wash: rgba(255, 216, 77, 0.18);
  --metric-trend: #8d63ff;
  --metric-trend-wash: rgba(141, 99, 255, 0.18);
  --metric-cardio: #ff5b88;
  --metric-cardio-wash: rgba(255, 91, 136, 0.18);
  --metric-recovery: #bb84ff;
  --metric-recovery-wash: rgba(187, 132, 255, 0.18);
  --metric-warning: var(--danger-ink);
  --metric-warning-wash: var(--danger-soft);

  --source-strava: #fc6a1f;
  --source-strava-wash: rgba(252, 106, 31, 0.18);
  --source-apple: #ff5ebc;
  --source-apple-wash: rgba(255, 94, 188, 0.18);

  --danger-soft: rgba(229, 102, 74, 0.18);
  --danger-ink: #f1b8ab;
}
```

### Token intent

| Token | Use |
|---|---|
| `--accent-*` | brand identity, active navigation, wordmark support |
| `--metric-distance` | distance and pace surfaces |
| `--metric-time` | time and elevation surfaces |
| `--metric-cardio` | heart-rate and cardio surfaces |
| `--metric-recovery` | recovery and health surfaces |
| `--metric-trend` | longitudinal and load surfaces |
| `--metric-exercise` | run/session emphasis |
| `--metric-move` | controlled movement/status emphasis where approved |
| `--metric-warning` | warning and error states only |
| `--source-strava` | Strava source labeling only |
| `--source-apple` | Apple Health source labeling only |

### Hard color rules

- The FarSygil brand mark stays green-led.
- Multicolor metric tones are allowed on dashboard, run-detail, health, and
  training-load surfaces.
- Orange-adjacent tones may appear inside metric and source surfaces, but they
  must never become the primary FarSygil identity color.
- Warning/error tones stay status-only.
- Do not add new chromatic families outside the token list above.
- Do not hardcode ad hoc chart colors inside components.

---

## 3. Shell and surface system

The active product shell includes:
- desktop left rail
- mobile bottom navigation
- a top status strip on shell routes
- page content framed inside a glass command-center layout

Surface rules:
- major surfaces use dark glass slabs with blur and inset highlights
- cards may use a tone wash, icon badge, metric value, and mini-chart frame
- neutral provenance cards use the base glass surface without decorative orbs
- route shells and cards should feel tactile but restrained
- motion is light and purposeful only

Do not reintroduce the old Phase 1 "one hero plus archive only" page hierarchy
as a global rule. That hierarchy remains valid historical context for the
original archive, not the current app shell.

---

## 4. Faux-map rule

Run-detail map surfaces use a local faux-map only.

Allowed:
- abstract dark gradient floor
- faint grid lines
- subtle contour-like texture
- real route polyline
- real start/end markers
- a distance-only chip

Forbidden:
- tile providers
- geocoding
- fake city names
- fake street names
- fake parks
- fake block grids that imply a specific place
- coordinates as a decorative fallback line

If a run has no real route polyline, the UI must render the existing honest
indoor/no-GPS fallback instead of a fabricated map.

---

## 5. Typography and iconography

- Use Geist Sans for interface text.
- Use Geist Mono and tabular numerals where metrics must align.
- Favor large value numerals, smaller labels, and concise secondary copy.
- Use local in-repo SVG icons only.

Forbidden:
- copied Apple iconography
- SF Symbols
- external icon runtime dependencies
- literal or near-literal Apple Activity Rings or any equivalent tri-ring
  progress motif

FarSygil uses distinct cards and chart tiles for multi-metric health/load
surfaces, not stacked ring metaphors.

---

## 6. Copy rules

Copy must remain:
- calm
- factual
- single-user
- local-first

Hard rules:
- standalone empty state: `Data not available`
- compact inline missing value: `--`
- no encouragement copy
- no "coming soon" marketing filler
- no invented numbers
- no fake readiness states
- no motivational derived banners

Allowed derived copy must be:
- deterministic
- factual
- clearly labeled as derived

Example:
- Allowed: `Longest run in the current week`
- Forbidden: `Great work staying consistent`

---

## 7. Real-data guardrails

These rules remain non-negotiable:

- No fake values
- No fake charts
- No fake calories
- No fake recovery scores
- No fake ATL / CTL / TSB
- No fake Apple Health values
- No fake source labels
- No placeholder series that imply unavailable data exists

When a mockup surface depends on unavailable data, render the real frame with an
honest empty body plus a deterministic unlock hint.

The mockup never outranks the data rules.

---

## 8. Route model

The active public route model is:
- `/` disconnected onboarding only
- `/dashboard` connected landing
- `/runs`
- `/runs/[id]`
- `/archive`
- `/connect`
- `/settings`
- `/health`
- `/training-load`

Compatibility redirects:
- `/activities` -> `/runs`
- `/activities/[id]` -> `/runs/[id]`

Do not invent additional shell destinations without updating the roadmap and
brain docs in the same change set.
