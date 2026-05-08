# 13 - Roadmap and Phases

> See also: [[00_PROJECT-BRAIN]] · [[01_PRODUCT-VISION]]

---

## Phase overview

| Phase | Name | Status |
|---|---|---|
| **Phase 1** | Foundation | In progress |
| **Phase 2** | Apple Health + Dashboard | Planned |
| **Phase 3** | Training Analytics | Planned |
| **Phase 4** | Grounded AI Chat | Planned |

---

## Phase 1 - Foundation

**Goal:** Working local app with Strava OAuth, activity ingestion, and basic UI.

Current progress: Strava OAuth, local token storage, connection-status UI/API, and the `/activities` Archive page are complete. Activity sync and the sync log viewer are the remaining major Phase 1 deliverables.

Deliverables:
- [x] Project structure, package.json, tsconfig, Next.js config
- [x] SQLite schema with Drizzle ORM
- [x] Project brain documentation
- [x] Green-led home / connect / archive shell
- [x] Strava OAuth and connection-status surface (`/api/strava/connect`, `/api/strava/callback`, `/api/strava/status`)
- [ ] Activity sync (initial + incremental)
- [x] Activity list page (`/activities`)
- [ ] Sync log viewer

---

## Phase 2 - Apple Health + Dashboard

**Goal:** Import Apple Health data and show a useful dashboard.

Deliverables:
- [ ] Apple Health XML parser and importer
- [ ] Daily metrics aggregation
- [ ] Main dashboard page (`/dashboard`)
- [ ] Activity detail page (`/activities/[id]`)
- [ ] Health metrics page (`/health`)
- [ ] Resting HR, HRV, sleep, steps charts (real data only)

---

## Phase 3 - Training Analytics

**Goal:** Compute and display deterministic training analytics.

Deliverables:
- [ ] TSS calculation from HR data
- [ ] ATL / CTL / TSB (EMA-based)
- [ ] Training load chart
- [ ] Race predictor (Riegel formula)
- [ ] Weekly mileage trend
- [ ] Analytics page (`/analytics`)

---

## Phase 4 - Grounded AI Chat

**Goal:** Natural language Q&A grounded in local data.

Deliverables:
- [ ] Claude API integration
- [ ] Structured query context injection
- [ ] Chat UI (`/chat`)
- [ ] Refusal handling for missing data
- [ ] System prompt design
