# 03 — Data Sources

> See also: [[00_PROJECT-BRAIN]] · [[04_STRAVA-INGESTION]] · [[05_APPLE-HEALTH-INGESTION]]

---

## Overview

FarSygil has two external data sources:

| Source | Data type | Authority |
|---|---|---|
| **Strava** | Run activity records (distance, pace, HR, GPS, splits, streams) | Activities |
| **Apple Health** | Physiology (resting HR, HRV, sleep, steps, VO2 max, weight) | Physiology |

Both sources are **read-only** — FarSygil imports data from them but never writes back.

---

## Strava

- Strava is the **authoritative source for all run activity data**.
- Connected via Strava OAuth 2.0 (Phase 1).
- Data is fetched from the Strava API and stored in the local SQLite database.
- Raw JSON responses are preserved in `activity_raw_json` for reprocessing.
- See [[04_STRAVA-INGESTION]] for implementation details.

## Apple Health

- Apple Health is the **authoritative source for all physiology data**.
- Data is exported from the Health app as a ZIP containing
  `apple_health_export/export.xml`.
- FarSygil can import either the ZIP or an extracted `export.xml`, then parses
  the XML into the local database.
- Apple Health exports are large files and must never be committed to Git.
- See [[05_APPLE-HEALTH-INGESTION]] for implementation details.

---

## Data conflicts

If a metric appears in both Strava and Apple Health (e.g. heart rate during a run), the rule is:

- **Activity HR during a run** → Strava (activity-linked)
- **Resting HR, HRV, daily aggregates** → Apple Health

Never merge or average across sources without explicit user action.

---

## Missing data

If a data point is not available (e.g. no Apple Health import yet), always display:

- `--` in table cells
- `"Data not available"` in descriptive contexts

Never fabricate, interpolate, or estimate missing values without clear labelling.
