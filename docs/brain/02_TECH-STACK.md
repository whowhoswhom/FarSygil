# 02 — Tech Stack

> See also: [[00_PROJECT-BRAIN]] · [[06_DATABASE-SCHEMA]]

---

## Overview

| Layer | Technology | Rationale |
|---|---|---|
| Framework | Next.js 14 (App Router) | Full-stack React, API routes, server components |
| Language | TypeScript | Type safety, better DX |
| Styling | Tailwind CSS | Utility-first, fast iteration |
| Database | SQLite (better-sqlite3) | Local-first, zero infra, single file |
| ORM | Drizzle ORM | Type-safe SQL, SQLite native, no Prisma |
| Package manager | pnpm | Fast, disk-efficient |
| UI components | shadcn/ui-ready structure | Copy-paste components, no vendor lock-in |

---

## Hard constraints

These technologies are **explicitly excluded**:

| Excluded | Reason |
|---|---|
| Supabase | Cloud, not local-first |
| Postgres | Requires a server process |
| Docker | Unnecessary complexity for localhost |
| Prisma | Not needed with Drizzle |
| Public auth | Single-user app, no public access |
| Stripe | No payments |
| Cloud deployment | Local-only |

---

## Database

- **SQLite** via `better-sqlite3` (synchronous, fast, embedded)
- **Drizzle ORM** for type-safe schema and queries
- Database file: `./data/running.db`
- WAL mode enabled for better performance
- Foreign keys enforced
- `data/` directory is excluded from Git

---

## AI (Phase 4 only)

- **Anthropic Claude** API for grounded AI chat
- Claude will only receive data retrieved from the local SQLite database — never raw exports or external URLs
- `CLAUDE_API_KEY` is configured in `.env.local` but not used until Phase 4

---

## File structure

```
src/
  app/          Next.js App Router pages and API routes
  components/   Shared UI components
    ui/         shadcn/ui-compatible primitive components
  db/           Drizzle schema and database client
  lib/          Shared utilities (env, formatting, etc.)
  server/       Server-only logic (Strava sync, analytics, etc.)
scripts/        One-off or maintenance scripts
tests/
  fixtures/
    strava/     Sample Strava API JSON fixtures
    apple-health/ Sample Apple Health XML fixtures
docs/
  brain/        Project brain (Obsidian-compatible)
```
