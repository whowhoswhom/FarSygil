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

| Record type | Metric | Maps to |
|---|---|---|
| `HKQuantityTypeIdentifierHeartRate` | Instantaneous HR | `health_metrics` |
| `HKQuantityTypeIdentifierRestingHeartRate` | Resting HR | `health_metrics` |
| `HKQuantityTypeIdentifierHeartRateVariabilitySDNN` | HRV | `health_metrics` |
| `HKQuantityTypeIdentifierStepCount` | Steps | `health_metrics` |
| `HKQuantityTypeIdentifierBodyMass` | Weight | `health_metrics` |
| `HKQuantityTypeIdentifierVO2Max` | VO2 Max | `health_metrics` |
| `HKCategoryTypeIdentifierSleepAnalysis` | Sleep | `health_metrics` |
| `HKQuantityTypeIdentifierActiveEnergyBurned` | Active calories | `health_metrics` |

---

## Import process

The current import path:

1. Accepts the extracted `exports/export.xml` path through the local API.
2. Parses the XML using a streaming parser (file can be several GB).
3. Filter records to relevant types only.
4. Aggregate daily values where appropriate (for example, sum steps and average resting HR per day).
5. Upsert into `health_metrics` (unique constraint on `date` + `metric_type`).
6. Log the import in `health_raw_imports` and `data_import_logs`.

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
