# FarSygil — Design Contract (Phase 1)

> A short, implementation-facing reference. Pin this to any task that touches the real Next.js UI. Anything not enumerated here is up to the implementer's judgement *within* the system below.

---

## 1. Color tokens (locked)

Use these hex values verbatim. Do not introduce siblings.

```css
:root {
  /* Field — background layers */
  --field-deep:    #050705;
  --field-mid:     #0d120d;
  --field-lift:    #151b14;

  /* Ink — text */
  --ink-1: #f4f7f0;                       /* primary */
  --ink-2: rgba(232, 239, 229, 0.76);     /* secondary */
  --ink-3: rgba(210, 221, 205, 0.42);     /* tertiary, kicker, em-dash placeholder */

  /* Accent — single accent, four shades */
  --accent-core:    #7BC241;
  --accent-bright:  #A8E26C;
  --accent-deep:    #3F7220;
  --accent-glow:    rgba(168, 226, 108, 0.35);
  --accent-wash-a:  rgba(123, 194, 65, 0.18);  /* page top-right bloom */
  --accent-wash-b:  rgba(63, 114, 32, 0.16);   /* page bottom-left wash  */

  /* Glass — surface fill / borders */
  --glass-bg:            rgba(17, 23, 18, 0.58);
  --glass-bg-strong:     rgba(17, 23, 18, 0.72);
  --glass-border:        rgba(255, 255, 255, 0.08);
  --glass-border-strong: rgba(255, 255, 255, 0.14);

  /* Status — only the warning role exists */
  --danger-soft: rgba(229, 102, 74, 0.18);
  --danger-ink:  #f1b8ab;
}
```

**Forbidden**: orange-led identity, purple, magenta, cyan, lime overload, multicolor accent rings, rainbow charts. The accent green is the only chromatic note.

**Usage notes:**
- The accent green is the **only chromatic accent** across the product. No second brand accent may be introduced — not for charts, not for emphasis, not for differentiation between sports.
- The warning role (`--danger-soft` / `--danger-ink`) is **status-only**. It expresses one specific failure mode (token expired, auth error) and must never be promoted into a second brand accent, used as a chart color, or applied for visual contrast.

---

## 2. Typography (locked)

- **Display + body**: Geist Sans (400 / 500 / 600).
- **Numerals**: Geist Mono with `font-variant-numeric: tabular-nums`. Use for **every** metric that aligns vertically — distance, pace, duration, HR, elevation, the visible/total counter.
- Tracking philosophy:
  - Display text → **negative** tracking (`-0.05em` to `-0.07em`).
  - Micro-labels → **strong positive** tracking (`0.18em` to `0.26em`), uppercase.
  - Body and pills → default tracking.
  - There is no in-between.

Semantic scale:

| Role | Size | Family | Weight | Tracking | Notes |
|---|---|---|---|---|---|
| Hero metric | `clamp(96px, 12vw, 192px)` | Geist Sans | 600 | -0.07em | Vertical gradient `--ink-1` to `--accent-bright`, clipped to text. Single token; no breakpoint variants. |
| Display L | 80px | Geist Sans | 600 | -0.065em | Hero title |
| Display M | 48px | Geist Sans | 600 | -0.05em | Band heading |
| Title L | 32px | Geist Sans | 600 | -0.05em | MajorTile title |
| Title M | 25px | Geist Sans | 600 | -0.045em | MinorTile title |
| Body L | 18px | Geist Sans | 400 | 0 | |
| Body | 16px | Geist Sans | 400 | 0 | |
| Body S | 14px | Geist Sans | 400 | 0 | |
| Caption | 12px | Geist Sans | 500 | 0 | |
| Kicker | 11px | Geist Sans | 600 | 0.22em uppercase | Section label, metric label, footer |
| Mono metric | 22px | Geist Mono | 500 | -0.04em | Tile sub-metric values |

---

## 3. Surface system (locked)

Every elevated surface is a `surface-slab`. The exact recipe (do not deviate; tweak via `data-depth` only):

```css
.surface-slab {
  border: 1px solid var(--glass-border);
  background:
    linear-gradient(145deg,
      rgba(255,255,255,0.065) 0%,
      rgba(255,255,255,0.018) 36%,
      rgba(255,255,255,0.006) 100%),
    var(--glass-bg);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.12),
    inset 0 -1px 0 rgba(255,255,255,0.03),
    0 40px 80px -48px rgba(0,0,0,0.9);
  backdrop-filter: blur(18px) saturate(150%);
}
```

Three depths:

- `tile` (default) — blur 18, soft shadow.
- `hero` — blur 24, stronger top highlight, double-stacked shadow `0 56px 120px -72px rgba(0,0,0,0.95), 0 28px 52px -36px rgba(0,0,0,0.55)`.
- `rail` — blur 28, denser fill, used for the sticky Filter HUD only.

Two organic flourishes:
1. Pointer-tracked specular highlight on `::before` (the existing `LiquidSurface` already does this — keep it).
2. Faint top-edge gradient on `::after` — a 2px specular line.

Hover state on a slab: border lifts to `--glass-border-strong`, `transform: translateY(-2px)`, accent inner ring `inset 0 0 0 1px rgba(168,226,108,0.24)` fades in via `.surface-rim`.

---

## 4. Spacing & radii

Base unit: **4px**. Every spacing value below is a multiple of 4. There are no off-grid exceptions.

- Page-shell padding scale: `8 / 16 / 24 / 40` (px), keyed off breakpoint (xs / sm / md / lg).
- Grid gaps inside an archive band: `20px` mobile, `24px` desktop.
- Inside a tile: `20px` and `32px` rests. Never inline `<br>`.
- Vertical rhythm between bands (Hero / Recent / Synced / Archive / Footer): `40px` minimum, `64px` typical.

Radii ladder — bigger surface, bigger radius:

| Radius | Usage |
|---|---|
| `34px` | Hero slab (one in the whole product) |
| `30px` | Empty-state cards, large welcome card |
| `28px` | Major tiles, Connect status card |
| `24px` | Minor tiles, status panels |
| `22px` | Synced totals strip, info cards |
| `18px` | Metric rail cells |
| `999px` (full pill) | Chips, status badges, sport pills, accent buttons, the entire Filter HUD bar |

Square corners do not appear.

---

## 5. Hero / Recent / Archive hierarchy (locked)

The Activities page composes **four bands** in this exact order:

1. **Hero** — the most recent activity. `min-h-[72svh]` slab, radius 34, `data-depth="hero"`. Route art at 70% opacity behind text, with a black floor gradient `transparent → rgba(0,0,0,0.35) → rgba(5,7,5,0.94)`. Hero metric is the headline — full hero-metric scale.

2. **Recent** — the next **two** activities, rendered as `MajorTile`s, **not** `MinorTile`s. A MajorTile is materially different:
   - Radius **28**, min-height ~420px.
   - Route art occupies the **full top half** edge-to-edge, with the sport pill and date floating over it.
   - Headline metric is hero-scale-adjacent (~76px), gradient-filled.
   - Sub-metrics sit on a **single row** (flex-wrap), not in a 3-up grid.
   - A MajorTile must look like a **first-class slab**, not a scaled-up archive card.

3. **Synced totals** — a content-honest strip, radius 22. Always renders four cells (Efforts / Distance / Elev gain / Moving). **Scope: the full local archive.** The strip reflects every synced activity row in the local database — it is *not* recomputed against the active filter slice. (The Filter HUD already shows the filtered visible/total counter; that is the place for slice-aware counts.) Cells are computed at render time from the activities table: if any rows exist, real totals appear immediately, regardless of whether a sync flow ran in this session. Each cell renders `—` only when the local database has no usable activity rows for that field. Numbers are **never** hardcoded in the implementation. Footer caption is factual (e.g. "Totals derive from real activities in your local database.") — never "128 efforts", "762.4 mi", etc.

4. **Archive** — a 3-up grid of `MinorTile`s, radius 24. "Reveal N earlier efforts" expands the band. Empty state lives here (radius 30, centered).

Home composition (locked):
- One full-bleed hero slab is the page. Wordmark + one-line subhead + two primary actions (Connect Strava / Open Archive).
- Below the hero: **one** connection-status row, no duplicates.
- Roadmap content does **not** belong on Home. If phase context is needed, it lives on `/connect`. There is no `/about` route in Phase 1 and the implementer must not invent one.
- One calm footer line. No marketing.

---

## 6. Copy tone rules

- Editorial, calm, factual. Sentence case for almost everything.
- Title Case is reserved for product surfaces ("Strava", "Apple Health", "Archive" when used as a proper section name).
- Uppercase + tracked-out is a **micro-label texture only** (`letter-spacing: 0.22em–0.26em`, 10–11px). Kickers, metric labels, date stamps, footer status. Never headlines.
- **No emoji, ever.** No marketing hype: no "smash", "crush", "next-level", "AI-powered", "10x", exclamation marks, rhetorical questions.
- **No first-person plural.** This is a single-user tool; there is no "we".
- **No invented numbers.** Null → `—`. The slot keeps its dimensions.
- Status messages name the failure mode and the next action. No apology language.

Approved phrases (pull from these before inventing new ones):
- "Local-first running command center."
- "FarSygil only talks to Strava when you connect or sync your own account."
- "Authorize FarSygil to read your activity data. Tokens are stored locally in `data/running.db`."
- "The archive is empty for this slice."
- "Widen the range, lower the minimum distance, or clear the search to bring more of your local Strava history back into view."
- "Reveal N earlier efforts"
- "Stored locally · synced from Strava"
- "Indoor / no GPS"
- "Untitled effort"

---

## 7. Motion timing rules (locked)

Three primitives, all in `globals.css`. All honor `prefers-reduced-motion: reduce` (disables animation; sets final state).

| Name | Duration | Easing | Effect |
|---|---|---|---|
| `archive-rise` | 620ms | `cubic-bezier(0.16, 1, 0.3, 1)` | `opacity 0→1` + `translateY(12px)→0`. Tile entry. |
| `route-draw` | 1500ms (180ms delay) | `cubic-bezier(0.22, 1, 0.36, 1)` forwards | `stroke-dashoffset 1→0` on path with `pathLength=1`. |
| Hover lift | 220ms | `ease` | `transform: translateY(-2px)`. Slab moves; nothing else. |

Interactive transitions (`a`, `button`, `input`, `select`): `color 180ms`, `background 180ms`, `border 180ms`, `box-shadow 220ms`, `transform 220ms`, all `ease`.

**Forbidden motion**: full-page parallax, infinite ambient loops, bouncing cards, rotation, scale `>1.02`, hue shifts.

---

## 8. Sport pill labels (locked)

Map raw `sportType` values to these labels exactly. The map is exhaustive for Phase 1; do not fall through to a raw value. Anything outside this table renders as `Other`.

| `sportType` | Label |
|---|---|
| `Run` | `Run` |
| `TrailRun` | `Trail run` |
| `VirtualRun` | `Indoor run` |
| `Ride` | `Ride` |
| `VirtualRide` | `Indoor ride` |
| `MountainBikeRide` | `MTB` |
| `GravelRide` | `Gravel ride` |
| `EBikeRide` | `E-bike ride` |
| `Walk` | `Walk` |
| `Hike` | `Hike` |
| `Swim` | `Swim` |
| `WeightTraining` | `Strength` |
| `Workout` | `Workout` |
| `StairStepper` | `Stairs` |
| `Yoga` | `Yoga` |
| anything else | `Other` |

Pill chrome: 11px, weight 600, `letter-spacing: 0.22em`, uppercase, color `--accent-bright` over `rgba(123, 194, 65, 0.10)` background, border `rgba(168, 226, 108, 0.22)`, subtle `0 0 20px -12px var(--accent-glow)` outer glow.

---

## 9. Real-data guardrails (non-negotiable)

The system **enforces** these — components must not accept props that imply fabricated data.

- **Schema is the only source of truth.** Components may render only fields present in `src/db/schema.ts`: `name`, `sportType`, `startDate`, `startDateLocal`, `timezone`, `distanceMeters`, `movingTimeSeconds`, `elapsedTimeSeconds`, `totalElevationGain`, `averageSpeed`, `maxSpeed`, `averageHeartrate`, `maxHeartrate`, `averageCadence`, `averageWatts`, `sufferScore`, `perceivedExertion`, `startLatitude`, `startLongitude`, `mapPolyline`, `source`.
- **No `calories`. No `trainingScore`. No `fitness`. No `fatigue`. No `tsb`. No `predictedRaceTime`.** Removed, not stubbed.
- **No projection charts. No trend arrows. No AI insight cards.**
- **No synthetic indoor-distance estimates, ever.** The system never calculates indoor distance from speed*time, power curves, or any model. This is the only suppression rule.
- **`VirtualRide` shows real `distanceMeters` when Strava provides it.** Modern trainers (Zwift, Wahoo, Tacx, etc.) report calibrated distance; that value is truthful and must be rendered. If `distanceMeters` is null on a `VirtualRide`, render `—`. The product never invents a number to fill the slot.
- **`VirtualRun` shows real `distanceMeters` when Strava provides it.** Treadmill belts are calibrated; the value is truthful and must not be suppressed. If `distanceMeters` is null on a `VirtualRun`, render `—`.
- **`WeightTraining`, `Workout`, `StairStepper`, and `Yoga` do not have a meaningful distance field.** These render duration and HR if present; distance is omitted from the metric rail entirely (not shown as `—`).
- **Effort intensity** = `sufferScore / 250` clamped to `[0, 1]`, falling back to `perceivedExertion / 10`. If both are absent, the effort glow does not render.
- **Imperial units only** in the current UI: `mi`, `ft`, `/mi` for run pace, `mph` for ride speed.
- **Tabular numerals on every aligned metric.** Geist Mono.
- **Null renders `—`.** The slot keeps its dimensions. Screen-reader text is acceptable.
- **Synced totals derive from the full local archive.** They are computed at render time from the activities table, scoped to every synced row — not the filtered slice. They are never hardcoded. If rows exist, totals render immediately. Each cell renders `—` only when the local database has no usable rows for that field.
- **No sample data ships in the real app.** Mock data lives only in `ui_kits/`.

If a designer reaches for a stat that isn't in the schema, the answer is to remove it, not to invent it.
