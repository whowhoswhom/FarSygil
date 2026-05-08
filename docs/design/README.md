# Handoff: FarSygil — Phase 1 UI

## Overview

This bundle is the design handoff for the next real UI pass on **FarSygil**, a local-first running command center. It covers three surfaces in the existing Next.js app:

- **Home** (`/`) — product-led hero, one connection-status row, no roadmap stack.
- **Connect** (`/connect`) — visually aligned to the new system; OAuth/token-status copy preserved verbatim.
- **Activities Archive** (`/activities`) — Hero / Recent (MajorTile) / Synced totals / Archive (MinorTile grid), with a sticky Filter HUD.

The visual direction is editorial-dark with a single green accent, slab-like liquid-glass surfaces, Geist Sans + Geist Mono numerals, and **honest data** (no synthetic stats, no fake totals, no AI insight UI).

## About the Design Files

The files in this bundle are **design references created in HTML** — prototypes that show intended look, structure, and behavior. They are **not production code to copy verbatim**.

The implementation task is to **recreate these designs inside the existing FarSygil Next.js codebase** (`whowhoswhom/farsygil`), using its established patterns:

- React Server Components / Client Components per the app's existing split.
- Tailwind utility classes alongside the existing `globals.css` token system.
- Drizzle ORM against the SQLite-backed `activities` table.
- Geist Sans / Geist Mono via `next/font/google` (already wired in `src/app/layout.tsx`).

If the export and the contract conflict, **the contract wins**. The export is illustrative; the contract is binding.

## Fidelity

**High-fidelity.** Final colors, typography scale, spacing, radii, motion timings, copy, and component composition are all locked. Recreate pixel-faithfully using the existing codebase's libraries — do not redesign on the fly.

## How to use this bundle

Two entry points, in priority order:

1. **`CLAUDE_CODE_PROMPT.md`** — the implementation prompt to paste into Claude Code at the root of the `whowhoswhom/farsygil` repo. It names the binding spec, hard constraints, surfaces to inspect, per-page goals, acceptance criteria, and the verification commands to run (`pnpm test`, `pnpm lint`, `pnpm db:generate`, `pnpm build`).
2. **`DESIGN_CONTRACT.md`** — the binding spec. Covers color tokens, typography, the surface slab recipe, spacing & radii, the Hero/Recent/Archive hierarchy, copy tone rules, motion primitives, sport pill labels, and real-data guardrails. **All ambiguity is resolved here.**

The first commit on the implementation branch should be: copy `DESIGN_CONTRACT.md` and `FarSygil UI Kit.html` into `docs/design/` in the real repo. The Claude Code prompt explicitly halts if either file is missing in-repo.

## Screens / Views

### Home (`src/app/page.tsx`)

- One full-bleed hero slab (radius 34, `data-depth="hero"`).
- Wordmark "FarSygil" rendered as gradient-clipped display text (`--ink-1` to `--accent-bright`), `clamp(80px, 13vw, 156px)`, weight 600, tracking `-0.06em`. **Must keep `display: inline-block`, `padding-right: 0.12em`, and `white-space: nowrap`** so the gradient clip doesn't cut the trailing letter at any viewport width.
- One-line subhead: `A private archive of your real running.` (or equivalent calm phrasing).
- Two primary actions: **Connect Strava** (accent button) and **Open Archive** (ghost button).
- One connection-status row beneath the hero. Tappable; routes to `/connect`.
- One footer line. **No roadmap stack. No marketing tone.**
- Phase context surfaces inside `/connect` only. **Do not create new routes.**

### Connect (`src/app/connect/page.tsx`)

- Single calm card at `data-depth="hero"`-adjacent treatment, radius 28.
- Slab recipe, kicker labels, tracked-uppercase micro-labels, accent-button + ghost-button.
- Preserve all existing OAuth/token-status messaging **verbatim**. No copy rewrites in this pass.
- One card carries the page; do not multiply surfaces.

### Activities Archive (`src/app/activities/*`, `src/components/activities/*`)

Composes **four bands** in this exact order (see `DESIGN_CONTRACT.md` §5):

1. **Hero** — most recent activity. `min-h-[72svh]` slab, radius 34, route art at 70% opacity, black floor gradient. Hero metric uses the `clamp(96px, 12vw, 192px)` token.
2. **Recent** — next two activities, rendered as **`MajorTile`** (`src/components/activities/major-tile.tsx`). Materially different from `MinorTile`: route art occupies the full top half edge-to-edge, headline metric is hero-scale-adjacent (~76px gradient), sub-metrics in a single flex-wrap row.
3. **Synced totals strip** — radius 22. Four cells (Efforts / Distance / Elev gain / Moving) computed at render time from the activities table. **Scope: full local archive, NOT the active filter slice.** Each cell renders `—` only when the local DB has no usable rows for that field. **No hardcoded numbers anywhere.**
4. **Archive** — 3-up `MinorTile` grid, radius 24. "Reveal N earlier efforts" expands the band. Empty state lives here, radius 30, centered.

The Filter HUD is the **only** sticky element on the page. URL-synced filters / search / sort behavior must not regress.

## Interactions & Behavior

- **Hover lift**: 220ms ease, `translateY(-2px)`, accent inner ring fades in. Slab moves; nothing else.
- **`archive-rise`**: 620ms cubic-bezier(0.16, 1, 0.3, 1), `opacity 0→1` + `translateY(12px)→0`. Tile entry.
- **`route-draw`**: 1500ms (180ms delay) cubic-bezier(0.22, 1, 0.36, 1) forwards, `stroke-dashoffset 1→0` on path with `pathLength=1`.
- **All interactive transitions** (`a`, `button`, `input`, `select`): `color/background/border 180ms`, `box-shadow/transform 220ms`, all `ease`.
- **All motion honors `prefers-reduced-motion: reduce`** — disables animation, sets final state.

Forbidden motion: full-page parallax, infinite ambient loops, bouncing cards, rotation, scale > 1.02, hue shifts.

## State Management

- **Activities** are read server-side from SQLite via Drizzle in `src/lib/activities/*` and `src/db/schema.ts`. No client-side fetching for the initial render.
- **Filters / search / sort** are URL-synced query params on `/activities`. Preserve the existing `useSearchParams` / `useRouter` flow in `activities-stream.tsx` and `filter-hud.tsx`. Do not regress.
- **Synced totals** are computed at render time on the server from the full local activities table. Pass numbers (or `null` per cell) into the component as props; the component renders `—` for any null.
- **Connection status** is read once per page render from existing helpers. The Home status row links to `/connect`.

## Design Tokens

All locked. See `colors_and_type.css` for the canonical token block, and `DESIGN_CONTRACT.md` §1–§4 for usage rules.

### Colors
- Field: `#050705` / `#0d120d` / `#151b14`
- Ink: `#f4f7f0` / `rgba(232,239,229,0.76)` / `rgba(210,221,205,0.42)`
- Accent: `#7BC241` (core) / `#A8E26C` (bright) / `#3F7220` (deep) / `rgba(168,226,108,0.35)` (glow)
- Glass: `rgba(17,23,18,0.58)` bg, `rgba(255,255,255,0.08)` border (strong variants at 0.72 / 0.14)
- Status (warning only): `rgba(229,102,74,0.18)` soft, `#f1b8ab` ink

The accent green is the only chromatic accent. The warning role is status-only — never promoted to a second brand accent or chart color.

### Typography
- Geist Sans (400/500/600), Geist Mono with `font-variant-numeric: tabular-nums` for every aligned metric.
- Hero metric: `clamp(96px, 12vw, 192px)`, weight 600, tracking `-0.07em`, gradient-clipped.
- Display L 80 / Display M 48 / Title L 32 / Title M 25 / Body L 18 / Body 16 / Body S 14 / Caption 12 / Kicker 11 (0.22em uppercase) / Mono metric 22.
- Tracking philosophy: display = negative (`-0.05em` to `-0.07em`); micro-labels = `0.18em` to `0.26em` uppercase; body and pills = default. No in-between.

### Spacing
- Base unit **4px**. Every value is a multiple of 4.
- Page-shell padding: `8 / 16 / 24 / 40` (xs/sm/md/lg).
- Archive band gap: `20` mobile, `24` desktop.
- Tile internal rests: `20` and `32`.
- Vertical band rhythm: `40` minimum, `64` typical.

### Radii
- `34` hero • `30` empty-state • `28` major tile / Connect card • `24` minor tile • `22` synced totals strip • `18` metric rail cell • `999px` chips/pills/buttons/Filter HUD bar.
- Square corners do not appear.

### Surface slab recipe
See `DESIGN_CONTRACT.md` §3 for the exact `border + linear-gradient + box-shadow + backdrop-filter` block. Three depths: `tile` / `hero` / `rail`. Pointer-tracked specular highlight on `::before`; 2px specular top-edge line on `::after`.

## Sport pill labels (locked, exhaustive)

| `sportType` | Label |
|---|---|
| `Run` | Run |
| `TrailRun` | Trail run |
| `VirtualRun` | Indoor run |
| `Ride` | Ride |
| `VirtualRide` | Indoor ride |
| `MountainBikeRide` | MTB |
| `GravelRide` | Gravel ride |
| `EBikeRide` | E-bike ride |
| `Walk` | Walk |
| `Hike` | Hike |
| `Swim` | Swim |
| `WeightTraining` | Strength |
| `Workout` | Workout |
| `StairStepper` | Stairs |
| `Yoga` | Yoga |
| anything else | Other |

Pill chrome: 11px/600/`0.22em`/uppercase; color `--accent-bright` over `rgba(123,194,65,0.10)`; border `rgba(168,226,108,0.22)`; subtle outer accent glow.

## Real-data guardrails (non-negotiable)

- Schema is the only source of truth (`src/db/schema.ts`). No fake fields.
- **No `calories`. No `trainingScore`. No `fitness/fatigue/tsb`. No `predictedRaceTime`.** Removed, not stubbed.
- **No projection charts. No trend arrows. No AI insight cards.**
- **No synthetic indoor-distance estimates.** The system never calculates indoor distance from speed × time, power curves, or any model.
- `VirtualRide` and `VirtualRun` **show real `distanceMeters` when Strava provides it** (calibrated trainers, calibrated treadmills). If null, render `—`.
- `WeightTraining`, `Workout`, `StairStepper`, `Yoga` — distance is omitted from the metric rail entirely (not shown as `—`).
- Effort intensity = `sufferScore / 250` clamped to `[0,1]`, falling back to `perceivedExertion / 10`. If both absent, the effort glow does not render.
- Imperial units only: `mi`, `ft`, `/mi` for run pace, `mph` for ride speed.
- Tabular numerals on every aligned metric (Geist Mono).
- Null → `—`, slot keeps its dimensions.
- Synced totals always derive from the full local archive at render time. Never hardcoded.
- No sample data ships in the real app.

## Assets

In `assets/`:

- `farsygil-wordmark.svg` — gradient-clipped wordmark reference.
- `route-mark-sample.svg` — polyline-as-identity reference (the visual tone for hero/MajorTile route art).
- `indoor-artwork-sample.svg` — honest indoor fallback artwork reference (concentric ring lockup; no fake GPS).

Real route polylines come from `src/lib/activities/polyline.ts` decoding `mapPolyline` from the activities table. Indoor activities use the fallback artwork; do not invent a synthetic GPS trace.

## Files in this bundle

- `README.md` — this file.
- `CLAUDE_CODE_PROMPT.md` — paste into Claude Code in the real repo.
- `DESIGN_CONTRACT.md` — binding spec; commit to `docs/design/` in the real repo.
- `FarSygil UI Kit.html` — single self-contained visual reference (Home / Connect / Activities click-thru). Commit to `docs/design/` in the real repo.
- `colors_and_type.css` — canonical token block (mirrors what's in `DESIGN_CONTRACT.md` §1–§2).
- `assets/` — wordmark and reference SVGs.

## Verification

The Claude Code prompt requires all four to pass before the implementation is considered complete:

```bash
pnpm test
pnpm lint
pnpm db:generate
pnpm build
```

The final response from Claude Code should include the tail of each command's output, plus a summary, key design translations, real-data safeguards, and any brain-doc updates touched in `docs/brain/`.
