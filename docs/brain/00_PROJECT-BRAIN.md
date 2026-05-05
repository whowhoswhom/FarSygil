# 00 - Project Brain

> **Agents: read this file first before taking any action in this repository.**

---

## Purpose

FarSygil is a personal, local-first running command center. It aggregates data from [[04_STRAVA-INGESTION|Strava]] and [[05_APPLE-HEALTH-INGESTION|Apple Health]], stores everything locally in [[06_DATABASE-SCHEMA|SQLite]], and provides a private dashboard for training analytics and insights.

This document is the canonical entry point for the entire project. All other brain files extend it.

---

## Current Phase

**Phase 1 - Foundation**

Current progress: Strava OAuth, local token storage, the connection-status surface, and the first `/activities` Archive page are in place. The remaining major Phase 1 gaps are automated activity sync and the sync log viewer.

See [[13_ROADMAP-PHASES|Roadmap]] for full phase breakdown.

---

## Core Rules

### Data authority

| Data type | Authoritative source |
|---|---|
| Run activity data (distance, pace, HR, splits) | **Strava** |
| Physiology data (resting HR, HRV, sleep, steps, weight) | **Apple Health** |

- The app must **never invent data**.
- If data is missing, display `--` or `"Data not available"` - never fabricate values.
- Do not blend invented data with real data.

### AI chat

AI chat ([[09_GROUNDED-AI-CHAT|Grounded AI Chat]]) is **out of scope until Phase 4**. Do not implement AI features in earlier phases.

### Application rules

- Single-user localhost app only. No public deployment.
- No Supabase. No Postgres. No Docker. No Prisma.
- No public auth. No Stripe. No cloud.
- All data stays on the user's machine.
- No fake charts. No demo data.
- Never commit secrets, database files, or Apple Health exports.

---

## Brain file index

| File | Topic |
|---|---|
| [[01_PRODUCT-VISION]] | What FarSygil is and why it exists |
| [[02_TECH-STACK]] | Technology choices and rationale |
| [[03_DATA-SOURCES]] | Strava and Apple Health overview |
| [[04_STRAVA-INGESTION]] | Strava OAuth and activity sync |
| [[05_APPLE-HEALTH-INGESTION]] | Apple Health XML import |
| [[06_DATABASE-SCHEMA]] | SQLite schema overview |
| [[07_DASHBOARD-UI]] | Dashboard design and components |
| [[08_TRAINING-ANALYTICS]] | Load, fitness, fatigue, projections |
| [[09_GROUNDED-AI-CHAT]] | Claude-powered chat (Phase 4) |
| [[10_SYNC-LOGGING-BACKUPS]] | Sync logs and backup strategy |
| [[11_SECURITY-PRIVACY]] | Privacy and security considerations |
| [[12_TESTING-VALIDATION]] | Test strategy and validation |
| [[13_ROADMAP-PHASES]] | Phase-by-phase roadmap |
| [[14_AGENT-INSTRUCTIONS]] | Instructions for AI coding agents |
| [[15_RESEARCH-SOURCES]] | External references and resources |
