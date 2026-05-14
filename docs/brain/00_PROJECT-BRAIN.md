# 00 - Project Brain

> Agents: read this file first before taking any action in this repository.

---

## Purpose

FarSygil is a personal, local-first running archive and command center. It
aggregates data from [[04_STRAVA-INGESTION|Strava]] and later
[[05_APPLE-HEALTH-INGESTION|Apple Health]], stores everything locally in
[[06_DATABASE-SCHEMA|SQLite]], and provides a private product surface for
browsing real efforts before later analytics layers arrive.

This document is the canonical entry point for the whole repository.

---

## Current phase

Phase 1 foundation is complete.

Phase 2 is now the visual reboot + detail-sync program:
- connected users land on `/dashboard`
- `/runs` and `/runs/[id]` are the run-first browsing surfaces
- `/connect` manages summary sync and detail sync
- `/settings`, `/health`, and `/training-load` now exist as real shell routes
- Health and Training Load still remain honest empty states until their later
  data systems land

See [[13_ROADMAP-PHASES|Roadmap]] and
[[17_VISUAL-REBOOT-PLAN|Visual Reboot Plan]] for the active breakdown.

---

## Core rules

### Data authority

| Data type | Authoritative source |
|---|---|
| Run activity, splits, streams | Strava |
| Physiology data | Apple Health |

- Never invent data.
- Standalone empty state: `Data not available`
- Compact inline missing value: `--`
- Never blend fabricated data with real data.

### Application rules

- Single-user localhost app only
- No public deployment
- No cloud database
- No fake charts
- No demo data in user paths
- Never commit secrets, database files, or Apple Health exports

### AI chat

Grounded AI chat is out of scope until Phase 4.

---

## Brain file index

| File | Topic |
|---|---|
| [[01_PRODUCT-VISION]] | product vision |
| [[02_TECH-STACK]] | technology choices |
| [[03_DATA-SOURCES]] | source overview |
| [[04_STRAVA-INGESTION]] | Strava OAuth, summary sync, detail sync |
| [[05_APPLE-HEALTH-INGESTION]] | Apple Health import |
| [[06_DATABASE-SCHEMA]] | SQLite schema overview |
| [[07_DASHBOARD-UI]] | shell, dashboard, runs, and route UI rules |
| [[08_TRAINING-ANALYTICS]] | future analytics |
| [[09_GROUNDED-AI-CHAT]] | future AI chat |
| [[10_SYNC-LOGGING-BACKUPS]] | sync logs and backups |
| [[11_SECURITY-PRIVACY]] | privacy and security rules |
| [[12_TESTING-VALIDATION]] | test strategy |
| [[13_ROADMAP-PHASES]] | phase roadmap |
| [[14_AGENT-INSTRUCTIONS]] | implementation rules for agents |
| [[15_RESEARCH-SOURCES]] | references |
| [[16_DASHBOARD-IMPLEMENTATION-PLAN]] | superseded historical plan |
| [[17_VISUAL-REBOOT-PLAN]] | active Phase 2 visual reboot plan |
