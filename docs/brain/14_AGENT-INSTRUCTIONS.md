# 14 - Agent Instructions

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
| **No AI chat until Phase 4** | Do not implement Claude or AI features in Phases 1-3 |
| **No fake charts** | Only render charts when real data is present |
| **No demo data** | Never seed the database with fake activities or metrics |
| **No secrets in code** | Never hardcode API keys, tokens, or credentials |
| **No cloud dependencies** | All data must remain local |
| **Be precise about local-first** | Do not claim zero network traffic when the app intentionally talks to Strava or another user-enabled provider; distinguish local storage from source API traffic |

---

## Before implementing a feature

1. Check the current phase in [[00_PROJECT-BRAIN]].
2. Check if the feature is in scope for the current phase in [[13_ROADMAP-PHASES]].
3. Check the relevant ingestion or schema brain file for data rules.
4. Write tests using fixtures from `tests/fixtures/` - never live API calls.

## After implementing a change

1. Update every affected brain file in the same change set.
2. Always hand back a self-contained Claude review prompt for the current implementation change set, including:
   - a prompt identifier line at the very top in the form `#<number>` so Claude and Codex are visibly reviewing the same prompt revision
   - files touched
   - why they changed
   - commands run and pass/fail results
   - the relevant brain files to cross-check
   - either the full diff or a tight diff summary with key hunks

---

## Database changes

- All schema changes must be made in `src/db/schema.ts`.
- Run `pnpm db:generate` to create a migration.
- Run `pnpm db:migrate` to apply the migration.
- Never modify the SQLite file directly.
- Any Next.js route handler that imports the local SQLite client or `better-sqlite3` code must export `runtime = "nodejs"`.

---

## Code style

- TypeScript strict mode is enabled.
- Use `async/await` over Promise chains.
- Use Drizzle ORM for all database queries - no raw SQL strings unless necessary.
- Server-only database code lives in `src/server/` or `src/db/`.
- No database access in client components.
- Prefer `dynamic = "force-dynamic"` on route handlers that read or write the live local database.

---

## What to do if data is missing

```typescript
// In UI components, always handle null/undefined:
const value = activity.averageHeartrate ?? "--";

// Never:
const value = activity.averageHeartrate || 0; // wrong - hides missing data
```
