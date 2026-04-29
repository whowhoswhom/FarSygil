# 08 — Training Analytics

> See also: [[00_PROJECT-BRAIN]] · [[06_DATABASE-SCHEMA]] · [[07_DASHBOARD-UI]]

---

## Status

**Phase 3 — planned.** Analytics not yet implemented.

---

## Overview

All analytics are computed **deterministically** from data stored in the local SQLite database. No external APIs, no machine learning, no estimates. If the data doesn't exist, the metric is not computed.

---

## Training load model (ATL / CTL / TSB)

Based on the Banister impulse-response model (also known as the Performance Management Chart).

### Definitions

| Metric | Name | Window | Formula |
|---|---|---|---|
| ATL | Acute Training Load | 7 days | Exponential moving average of daily TSS |
| CTL | Chronic Training Load | 42 days | Exponential moving average of daily TSS |
| TSB | Training Stress Balance | — | CTL − ATL |

### Training Stress Score (TSS)

For each activity, compute TSS using heart rate:

```
TSS = (duration_seconds × average_HR × IF) / (FTP_HR × 3600) × 100
```

Where `IF` = Intensity Factor = average HR / threshold HR.

Threshold HR and FTP HR must be set by the user in `user_settings`.

### EMA calculation

```
EMA_today = EMA_yesterday + (1/window) × (value_today − EMA_yesterday)
```

---

## Race predictions

Use the Riegel formula:

```
predicted_time = reference_time × (target_distance / reference_distance) ^ 1.06
```

Where the reference run is the best recent effort at a known distance.

---

## Weekly mileage

Simple sum of `distance_meters` per calendar week from the `activities` table.

---

## Rules

- Only compute metrics when sufficient data exists.
- Never display a computed value if the input data is missing.
- Threshold HR / FTP HR must be provided by the user — never guess them.
- Store computed values in `training_load` and `daily_summaries` for performance.
