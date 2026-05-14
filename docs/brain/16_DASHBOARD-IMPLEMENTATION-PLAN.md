# 16 - Dashboard Implementation Plan (Superseded)

> See also: [[17_VISUAL-REBOOT-PLAN]] | [[07_DASHBOARD-UI]]

---

## Status

This document is historical context only.

It guided the earlier dashboard-focused rollout that introduced:
- the first `/dashboard` route
- reusable dashboard primitives
- real Strava-backed running cards
- the `/runs` archive and `/runs/[id]` detail surface

It is no longer the active implementation authority for FarSygil.

---

## What superseded it

The active plan is now [[17_VISUAL-REBOOT-PLAN]].

Reasons:
- FarSygil moved from a dashboard-only expansion to a whole-app visual reboot
- the product now uses a shell architecture instead of isolated page layouts
- the design contract now allows a multicolor metric palette for data surfaces
- detail sync moved ahead of the visual route rebuilds
- `/settings`, `/health`, and `/training-load` became real routes in the shell

Use this file only to understand the historical path from the original
dashboard rollout into the current reboot program.
