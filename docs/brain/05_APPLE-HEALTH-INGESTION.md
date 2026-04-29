# 05 — Apple Health Ingestion

> See also: [[00_PROJECT-BRAIN]] · [[03_DATA-SOURCES]] · [[06_DATABASE-SCHEMA]]

---

## Status

**Phase 2 — planned.** Import not yet implemented.

---

## Export process

Apple Health data is exported from the iOS Health app:

1. Open **Health** app on iPhone.
2. Tap profile icon → **Export All Health Data**.
3. Save the ZIP file (`apple_health_export.zip`) and transfer to the Mac.
4. Place the file in `exports/` (this directory is excluded from Git).
5. Use the FarSygil import tool to parse and ingest the data.

The ZIP contains `export.xml` — a large XML file with all health records.

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

The import script should:

1. Accept a path to the ZIP or extracted `export.xml`.
2. Parse the XML using a streaming parser (file can be several GB).
3. Filter records to relevant types only.
4. Aggregate daily values where appropriate (e.g. sum steps, average resting HR per day).
5. Upsert into `health_metrics` (unique constraint on `date` + `metric_type`).
6. Log the import in `health_raw_imports` and `data_import_logs`.

---

## Storage rules

- Never store the raw XML in the database — it can be many GB.
- Store aggregated daily metrics in `health_metrics`.
- Log import metadata in `health_raw_imports`.
- Apple Health export files must never be committed to Git.

---

## Privacy

- Apple Health data is sensitive. Handle it with care.
- See [[11_SECURITY-PRIVACY]] for security considerations.
