# 17 - Visual Reboot Plan

> See also: [[00_PROJECT-BRAIN]] | [[07_DASHBOARD-UI]] | [[13_ROADMAP-PHASES]] | [[16_DASHBOARD-IMPLEMENTATION-PLAN]]

---

## Purpose

This is the active implementation plan for FarSygil's Phase 2 visual reboot.

It replaced the earlier dashboard-only rollout plan once the project moved to:
- a whole-app shell
- a multicolor metric palette for data surfaces
- smart-entry home behavior
- detail sync ahead of the visual route rebuilds

---

## Locked decisions

- Whole-app redesign, not dashboard-only
- Desktop left rail and mobile bottom nav
- `/` redirects connected users to `/dashboard`
- `/` renders disconnected onboarding otherwise
- Brand stays green-led, but metric surfaces use multicolor tones
- Run-detail maps use a local faux-map only
- Mockup frame, honest empty body
- Detail sync comes before the visual route rebuilds
- Apple Health import is a completed follow-on data program; training-load
  analytics remains separate and deferred

---

## Data reality policy

When the mockup conflicts with reality:
- real data wins
- unavailable data renders as an honest empty body
- forbidden values never render

Standalone empty state: `Data not available`

Compact inline missing value: `--`

No fake:
- calories
- recovery scores
- ATL / CTL / TSB
- Apple Health values without imported local rows
- geocoded place labels
- tile-based maps

---

## Wave structure

### Wave 0 - contract and docs reset

- rewrite `docs/design/DESIGN_CONTRACT.md`
- add the data-reality matrix
- align roadmap, privacy, testing, and agent instructions
- mark the old dashboard plan as superseded

### Wave 1 - detail sync prerequisite

- add detail sync route and writer
- backfill `activity_splits`
- backfill `activity_streams`
- backfill raw detail payload companions
- add retry and backoff behavior

### Wave 2 - shell and shared visual system

- add app-shell route group
- add rail, bottom nav, and top status strip
- add multicolor metric tokens
- add local SVG icon set
- consolidate shared units and formatting helpers

### Wave 3 - dashboard rebuild

- rebuild `/dashboard` to the new hierarchy
- keep Running real
- show imported Apple Health latest values when local rows exist
- keep Load honestly empty

### Wave 4 - runs and run-detail rebuild

- rebuild `/runs`
- rebuild `/runs/[id]`
- use faux-map route treatment
- use detail-sync data when present

### Wave 5a - connect and settings

- rebuild `/connect`
- add `/settings`

### Wave 5b - home, health, and training-load

- rebuild disconnected `/`
- add shell-integrated `/health`
- add shell-integrated `/training-load`

---

## Current implementation status

Within the active reboot branch/state:
- Wave 0 implemented
- Wave 1 implemented
- Wave 2 implemented
- Wave 3 implemented
- Wave 4 implemented
- Wave 5a implemented
- Wave 5b implemented

Started after the reboot:
- first Apple Health XML importer for extracted
  `apple_health_data/apple_health_export/export.xml`
- latest real Apple Health metric population on `/health`
- latest real Apple Health metric population in the dashboard health cluster
- Apple Health trend surfaces from imported local metric rows
- direct Apple Health ZIP extraction for `apple_health_export.zip`

Still deferred after the reboot:
- training-load analytics
- grounded AI chat

---

## Verification rules

Every significant reboot wave must pass:
- `pnpm lint`
- `pnpm test`
- `pnpm build`
- `pnpm db:generate`

Manual QA must continue covering:
- desktop shell
- mobile bottom nav
- dashboard with real local data
- run detail with and without splits/streams
- connect disconnected / connected / expired states
- honest empty states on health and training-load surfaces
