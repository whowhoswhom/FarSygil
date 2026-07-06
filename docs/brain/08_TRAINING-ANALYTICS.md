# 08 — Training Analytics

> See also: [[00_PROJECT-BRAIN]] · [[06_DATABASE-SCHEMA]] · [[07_DASHBOARD-UI]]

---

## Status

**Partially shipped.**

- **Daily training stress — implemented.** `/training-load` computes and persists
  a real per-day stress value from local Strava runs. See "Daily training stress
  (shipped)" below for the exact formula actually in the code.
- **ATL / CTL / TSB, ACWR, recovery/readiness, Daily Battery — deferred.** These
  remain honest empty states. No score renders until its inputs and its tests
  exist, per the prerequisite ladder below.

This file is the implementation authority for analytics. Where a mockup or an
older draft of this document conflicts with what is described here, this document
wins.

---

## Principles

- All analytics are computed **deterministically** from data already stored in
  the local SQLite database. No external APIs, no machine learning, no estimates.
- If the input data does not exist, the metric is **not computed and not
  rendered** — it stays `Data not available` / `--`.
- User-specific calibration values (threshold HR, max HR) must be **provided by
  the user**, never guessed. Until a user value exists, any fallback constant is
  treated as a labeled default, not a saved setting.

---

## Daily training stress (shipped)

Source of truth: `src/server/training-load/daily-stress.ts`.

### Inputs

- Only `activities` rows with `source = "strava"` **and** `sportType` in
  `RUN_SPORTS` (`Run`, `TrailRun`, `VirtualRun`) are considered.
- Per activity the relevant fields are `sufferScore`, `averageHeartrate`,
  `movingTimeSeconds`, `startDateLocal`, `startDate`.

### Per-activity stress

```
if sufferScore is a positive number:
    stress = round1(sufferScore)                       # Strava Relative Effort, preferred
else if averageHeartrate > 0 and movingTimeSeconds > 0:
    hours       = movingTimeSeconds / 3600
    effortRatio = averageHeartrate / REFERENCE_HARD_EFFORT_HEART_RATE   # constant 180
    stress      = round1(hours * REFERENCE_HOURLY_STRESS * effortRatio) # constant 100
    (only if stress > 0)
else:
    stress = null                                      # no fake zero row
```

- `REFERENCE_HARD_EFFORT_HEART_RATE = 180` and `REFERENCE_HOURLY_STRESS = 100`
  are **fixed constants today**. 180 is a conservative default, not a
  user-calibrated threshold. Replacing it with a real per-user threshold HR is
  Prerequisite P0 below.
- This is intentionally **not** the classic HR/TSS formula (`duration × HR × IF /
  (FTP_HR × 3600) × 100`). That formula requires a user threshold HR that FarSygil
  does not persist yet. Do not reintroduce it as if it were implemented.

### Day bucketing and persistence

- Each activity is bucketed by the **local wall-clock date prefix**:
  `getDatePrefix(startDateLocal) ?? getDatePrefix(startDate)`, i.e. the first
  `YYYY-MM-DD` of the stored local timestamp. This avoids server-timezone day
  shifts. Multiple runs on the same day are summed into one date key.
- Recompute nulls every `training_load.daily_training_stress` first, then
  upserts the recomputed days keyed on `training_load.date`. `acuteLoad`,
  `chronicLoad`, and `trainingStressBalance` are explicitly written `null` for
  new rows — they are reserved for the deferred analytics below and never
  fabricated.

### Reads

- `getDailyTrainingStressSnapshot` returns the latest N (default 14) days that
  have a non-null `daily_training_stress`, in chronological order, plus the
  latest. The dashboard Daily Stress card and the `/training-load` panel read
  only this.

---

## Prerequisite ladder for deferred analytics

Each rung must be fully satisfied — inputs present **and** tests written — before
the next renders any number.

### P0 — Persist user threshold HR (blocks real TSS)

- **Need:** a stored per-user threshold HR (and optionally max HR) in
  `user_settings` (the existing key/value table — no schema migration required),
  plus a real `/settings` control to set it and a server read/write helper.
- **Wire-up:** the daily-stress HR fallback reads the stored threshold and uses
  `180` only when unset (labeled as a default).
- **Tests:** settings round-trip; daily stress uses the stored threshold when
  present and the labeled default when absent.

### P1 — ATL / CTL / TSB

- **Need:** a real daily stress series (already persisted) and P0 for a
  defensible per-day load. Decide explicitly whether ATL/CTL run on
  `daily_training_stress` as-is or on a threshold-based TSS; document the choice
  here before building.
- **Formulas (Banister / Performance Management Chart):**
  - ATL = 7-day exponential moving average of daily stress.
  - CTL = 42-day exponential moving average of daily stress.
  - TSB = CTL − ATL.
  - `EMA_today = EMA_yesterday + (1/window) × (value_today − EMA_yesterday)`.
- **Gate:** CTL is only meaningful with enough history. Render an honest
  "needs N days of history" empty state until the window is populated; never
  show a CTL computed from a near-empty window as if it were stable.
- **Persistence:** write into the existing `training_load.acuteLoad`,
  `chronicLoad`, `trainingStressBalance` columns (already in the schema — no
  migration).
- **Tests:** EMA math on a known series; the insufficient-history gate; the card
  renders real values only past the threshold and honest-empty before it.

### P2 — ACWR and load warnings

- **Need:** P1. ACWR = acute:chronic workload ratio with a documented threshold
  policy.
- **Tests:** ratio math; each warning band boundary.

### P3 — Recovery / readiness

- **Need:** P1 **and** real Apple Health signals (HRV, resting HR, sleep) present
  for the relevant dates. Define the exact deterministic formula in this file
  before any score renders.
- **Rule:** no proxy inputs, no motivational or medical language.

### P4 — Daily Battery score

- **Need:** all four inputs (HRV, resting HR, sleep, daily stress) present for
  **aligned dates**. The current dashboard checklist marks an input "present" if
  any latest value exists; a score additionally requires date alignment.
- **Until then:** the Daily Battery card stays the deferred input-provenance
  checklist with no numeric slot.

---

## Other planned analytics (unchanged, still deferred)

### Race predictions (Riegel)

```
predicted_time = reference_time × (target_distance / reference_distance) ^ 1.06
```

Reference run = best recent effort at a known distance.

### Weekly mileage

Sum of `distance_meters` per calendar week from `activities`. The dashboard
weekly hero already renders this for the selected week.

---

## Rules

- Only compute a metric when sufficient real data exists.
- Never display a computed value when its input data is missing.
- Threshold HR / max HR must be provided by the user — never guessed; the `180`
  constant is a labeled default only.
- Persist computed values in `training_load` (and `daily_summaries` where
  appropriate) for performance, using the existing columns — no schema migration
  is required for P0–P1.
