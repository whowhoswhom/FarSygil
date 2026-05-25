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
- [x] refresh-token handling without requiring reconnect when only the access
  token expires
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
- [x] local data provenance route (`/archive`)
- [x] Strava detail sync for splits and streams
- [x] combined Strava fresh-sync route, stale app-shell auto-refresh, overlap
  guard, rate-limit cooldown, and capped Strava retry waits
- [x] connect management route (`/connect`) with detail-sync controls
- [x] settings route (`/settings`)
- [x] health scaffold route (`/health`)
- [x] training-load scaffold route (`/training-load`)
- [x] first Apple Health XML importer for extracted
  `apple_health_data/apple_health_export/export.xml`
- [x] latest Apple Health metric cards on `/health`
- [x] latest Apple Health values in the dashboard health cluster
- [x] Apple Health trend charts from imported local metric rows
- [x] direct Apple Health ZIP extraction
- [x] archive-status dashboard card backed by local SQLite provenance
- [x] current-week Avg Power dashboard tile from real Strava `averageWatts`
- [x] dashboard Daily Stress card from persisted local training-load rows
- [x] Daily Battery deferred checklist with no score placeholder

Notes:
- Health and training-load routes are real shell pages now, but they remain
  honest where source data or computed analytics are missing.
- Phase 2 no longer uses the old green-only dashboard palette. The active
  contract is now the visual reboot contract in `docs/design/DESIGN_CONTRACT.md`.
- `/trends` is deferred until trend analytics are mature enough to justify a
  real route.

---

## Phase 3 - Training analytics

Goal: compute deterministic analytics from real local history.

Planned deliverables:
- [x] daily training-stress foundation from Strava suffer score or HR-duration fallback
- [ ] ATL / CTL / TSB
- [ ] ACWR and related warnings
- [ ] training-load charts
- [ ] recovery/readiness derivations grounded in real inputs only
- [x] first real data inside `/training-load`
- [ ] Daily Battery formula

---

## Phase 4 - Grounded AI chat

Goal: natural-language Q&A grounded in local data.

Planned deliverables:
- [ ] Claude API integration
- [ ] structured context assembly from local SQLite rows
- [ ] refusal handling for missing local data
- [ ] chat route and UI

No AI surfaces should appear before Phase 4.
