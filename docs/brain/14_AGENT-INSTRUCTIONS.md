# 14 — Agent Instructions

> See also: [[00_PROJECT-BRAIN]]

---

## For AI coding agents working on this repository

### Read this first

1. Read [[00_PROJECT-BRAIN]] before taking any action.
2. Understand the current phase before implementing anything.
3. Do not implement features scheduled for a later phase.

---

## Core rules

| Rule | Details |
|---|---|
| **Never invent data** | If data is missing, display `--` or `"Data not available"` |
| **Strava is authoritative** | All run activity data comes from Strava only |
| **Apple Health is authoritative** | All physiology data comes from Apple Health only |
| **No AI chat until Phase 4** | Do not implement Claude or AI features in Phases 1–3 |
| **No fake charts** | Only render charts when real data is present |
| **No demo data** | Never seed the database with fake activities or metrics |
| **No secrets in code** | Never hardcode API keys, tokens, or credentials |
| **No cloud dependencies** | All data must remain local |

---

## Before implementing a feature

1. Check the current phase in [[00_PROJECT-BRAIN]].
2. Check if the feature is in scope for the current phase in [[13_ROADMAP-PHASES]].
3. Check the relevant ingestion or schema brain file for data rules.
4. Write tests using fixtures from `tests/fixtures/` — never live API calls.

---

## Database changes

- All schema changes must be made in `src/db/schema.ts`.
- Run `pnpm db:generate` to create a migration.
- Run `pnpm db:migrate` to apply the migration.
- Never modify the SQLite file directly.

---

## Code style

- TypeScript strict mode is enabled.
- Use `async/await` over Promise chains.
- Use Drizzle ORM for all database queries — no raw SQL strings unless necessary.
- Server-only database code lives in `src/server/` or `src/db/`.
- No database access in client components.

---

## What to do if data is missing

```typescript
// In UI components, always handle null/undefined:
const value = activity.averageHeartrate ?? "--";

// Never:
const value = activity.averageHeartrate || 0; // wrong — hides missing data
```
