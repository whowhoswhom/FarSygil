# 13 - Roadmap and Phases

> See also: [[00_PROJECT-BRAIN]] | [[17_VISUAL-REBOOT-PLAN]]

---

## Phase overview

| Phase | Name | Status |
|---|---|---|
| Phase 1 | Foundation | complete |
| Phase 2 | Visual reboot + detail sync | in progress |
| Phase 3 | Training analytics | planned |
| Phase 4 | Grounded AI chat | planned |

---

## Phase 1 - Foundation

Goal: working local app with Strava OAuth, summary activity ingestion, and the
first browseable local archive.

Delivered:
- [x] project structure, TypeScript, Next.js, Drizzle, SQLite
- [x] Strava OAuth and connection-status surface
- [x] refresh-aware token access
- [x] summary activity sync
- [x] sync-log viewer
- [x] original activity archive
- [x] compatibility redirects that keep old `/activities` URLs alive

---

## Phase 2 - Visual reboot + detail sync

Goal: turn FarSygil into the mockup-faithful shell product while staying strict
about real data.

Delivered or active in the reboot program:
- [x] smart-entry home (`/`)
- [x] app shell with desktop rail and mobile bottom nav
- [x] connected landing dashboard (`/dashboard`)
- [x] run archive (`/runs`)
- [x] run detail (`/runs/[id]`)
- [x] Strava detail sync for splits and streams
- [x] connect management route (`/connect`) with detail-sync controls
- [x] settings route (`/settings`)
- [x] health scaffold route (`/health`)
- [x] training-load scaffold route (`/training-load`)
- [x] first Apple Health XML importer for extracted
  `apple_health_data/apple_health_export/export.xml`
- [x] latest Apple Health metric cards on `/health`
- [x] latest Apple Health values in the dashboard health cluster
- [x] Apple Health trend charts from imported local metric rows
- [ ] direct Apple Health ZIP extraction

Notes:
- Health and training-load routes are real shell pages now, but they remain
  honest where source data or computed analytics are missing.
- Phase 2 no longer uses the old green-only dashboard palette. The active
  contract is now the visual reboot contract in `docs/design/DESIGN_CONTRACT.md`.

---

## Phase 3 - Training analytics

Goal: compute deterministic analytics from real local history.

Planned deliverables:
- [ ] TSS / TRIMP computation
- [ ] ATL / CTL / TSB
- [ ] ACWR and related warnings
- [ ] training-load charts
- [ ] recovery/readiness derivations grounded in real inputs only
- [ ] real data inside `/training-load`

---

## Phase 4 - Grounded AI chat

Goal: natural-language Q&A grounded in local data.

Planned deliverables:
- [ ] Claude API integration
- [ ] structured context assembly from local SQLite rows
- [ ] refusal handling for missing local data
- [ ] chat route and UI

No AI surfaces should appear before Phase 4.
