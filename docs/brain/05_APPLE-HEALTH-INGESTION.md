# 05 - Apple Health Ingestion

> See also: [[00_PROJECT-BRAIN]] · [[03_DATA-SOURCES]] · [[06_DATABASE-SCHEMA]]

---

## Status

**Phase 2 - first importer slice implemented.**

Current behavior:
- `POST /api/apple-health/import` imports an extracted
  `exports/export.xml` file.
- The parser uses streaming XML parsing via `saxes`, so it does not load the
  full export into memory.
- `/health` exposes the local import control and renders latest real metric
  rows once imported.
- The importer writes daily rows to `health_metrics`, an audit row to
  `health_raw_imports`, and import events to `data_import_logs`.

Still deferred:
- direct ZIP extraction from `apple_health_export.zip`
- advanced duplicate/source reconciliation
- historical trend charts beyond latest metric cards

---

## Export process

Apple Health data is exported from the iOS Health app:

1. Open **Health** app on iPhone.
2. Tap profile icon -> **Export All Health Data**.
3. Save the ZIP file (`apple_health_export.zip`) and transfer it to the computer that runs FarSygil.
4. Extract `export.xml` from the ZIP.
5. Place the extracted file at `exports/export.xml` (this directory is excluded from Git).
6. Use `/health` to import the file into the local database.

The ZIP contains `export.xml` - a large XML file with all health records.

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

1. Accepts the extracted `exports/export.xml` path through the local API.
2. Parses the XML using a streaming parser (file can be several GB).
3. Filter records to relevant types only.
4. Aggregate daily values where appropriate:
   - sum steps and active energy
   - sum asleep sleep duration by the record `startDate` day
   - average resting HR, HRV, body mass, and VO2 Max
5. Upsert into `health_metrics` (unique constraint on `date` + `metric_type`).
   Existing rows are updated only when their source is `AppleHealth`; rows
   owned by another source are preserved for future reconciliation work.
6. Log the import in `health_raw_imports` and `data_import_logs`. The
   `health_raw_imports.record_count` value stores the count of daily metric
   rows actually inserted or updated, while the notes field records scanned and
   matched XML record counts.

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
