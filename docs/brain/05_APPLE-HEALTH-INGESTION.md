# 05 - Apple Health Ingestion

> See also: [[00_PROJECT-BRAIN]] · [[03_DATA-SOURCES]] · [[06_DATABASE-SCHEMA]]

---

## Status

**Phase 2 - first importer slice implemented.**

Current behavior:
- `POST /api/apple-health/import` imports either:
  - `apple_health_data/apple_health_export/export.xml`
  - `apple_health_data/apple_health_export.zip`, reading only
    `apple_health_export/export.xml` from inside the ZIP
- The parser uses streaming XML parsing via `saxes`, so it does not load the
  full export into memory.
- `/health` exposes the local import control and renders latest real metric
  rows once imported.
- The importer writes daily rows to `health_metrics`, an audit row to
  `health_raw_imports`, and import events to `data_import_logs`.

Still deferred:
- advanced duplicate/source reconciliation

---

## Export process

Apple Health data is exported from the iOS Health app:

1. Open **Health** app on iPhone.
2. Tap profile icon -> **Export All Health Data**.
3. Save the ZIP file (`apple_health_export.zip`) and transfer it to the computer that runs FarSygil.
4. Place the ZIP at `apple_health_data/apple_health_export.zip`, or extract it
   and place the extracted folder at `apple_health_data/apple_health_export/` so
   `export.xml` resolves at
   `apple_health_data/apple_health_export/export.xml` (this directory is
   excluded from Git).
5. Use `/health` to import either the ZIP or the extracted XML into the local
   database.

The ZIP contains `apple_health_export/export.xml` - a large XML file with all
health records. FarSygil reads only that entry; it does not extract routes,
ECGs, or any other ZIP contents in this slice.

---

## XML structure

Key record types in `export.xml`:

| Record type | Metric | `health_metrics.metric_type` |
|---|---|---|
| `HKQuantityTypeIdentifierRestingHeartRate` | Resting HR | `resting_hr` |
| `HKQuantityTypeIdentifierHeartRateVariabilitySDNN` | HRV | `hrv` |
| `HKQuantityTypeIdentifierStepCount` | Steps | `steps` |
| `HKQuantityTypeIdentifierBodyMass` | Weight | `body_mass` |
| `HKQuantityTypeIdentifierVO2Max` | VO2 Max | `vo2_max` |
| `HKCategoryTypeIdentifierSleepAnalysis` | Sleep | `sleep_hours` |
| `HKQuantityTypeIdentifierActiveEnergyBurned` | Active calories | `active_energy` |

Instantaneous heart-rate records are intentionally not imported in this slice
because a daily average across all contexts is not a useful health signal.

---

## Import process

The current import path:

1. Accepts either the extracted
   `apple_health_data/apple_health_export/export.xml` path or
   `apple_health_data/apple_health_export.zip` through the local API.
2. For ZIP imports, validates central-directory entry paths and streams only
   `apple_health_export/export.xml`; unsafe ZIP paths are rejected.
3. Parses the XML using a streaming parser (file can be several GB).
4. Filter records to relevant types only.
5. Aggregate daily values where appropriate:
   - sum steps and active energy
   - sum asleep sleep duration by the record `startDate` day
   - average resting HR, HRV, body mass, and VO2 Max
6. Upsert into `health_metrics` (unique constraint on `date` + `metric_type`).
   Existing rows are updated only when their source is `AppleHealth`; rows
   owned by another source are preserved for future reconciliation work.
7. Log the import in `health_raw_imports` and `data_import_logs`. The
   `health_raw_imports.record_count` value stores the count of daily metric
   rows actually inserted or updated, while the notes field records scanned and
   matched XML record counts.

Import audit terms:
- `scanned`: every `<Record>` element opened by the streaming parser
- `matched`: records mapped to one of the importer-supported metric types
- `written`: daily metric rows actually inserted or updated in `health_metrics`
- `matched range`: min/max dates from matched XML records, not necessarily the
  written-row date range when source ownership blocks writes

---

## Storage rules

- Never store the raw XML in the database - it can be many GB.
- Store aggregated daily metrics in `health_metrics`.
- Log import metadata in `health_raw_imports`.
- Apple Health export files must never be committed to Git.

---

## Privacy

- Apple Health data is sensitive. Handle it with care.
- See [[11_SECURITY-PRIVACY]] for security considerations.
