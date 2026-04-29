# 11 — Security and Privacy

> See also: [[00_PROJECT-BRAIN]] · [[09_GROUNDED-AI-CHAT]]

---

## Overview

FarSygil is a single-user localhost application. Security is primarily about:
1. Protecting sensitive credentials from being committed to Git.
2. Keeping health data local and private.
3. Ensuring the app cannot be accidentally exposed to the internet.

---

## Secrets management

| Secret | Location | Committed? |
|---|---|---|
| `STRAVA_CLIENT_ID` | `.env.local` | ❌ Never |
| `STRAVA_CLIENT_SECRET` | `.env.local` | ❌ Never |
| `CLAUDE_API_KEY` | `.env.local` | ❌ Never |
| Strava access/refresh tokens | SQLite `strava_tokens` | ❌ Never |

`.env.local` is excluded from Git via `.gitignore`.
The `data/` directory (containing the SQLite file) is excluded from Git.

---

## Token storage

Strava OAuth tokens are stored in the SQLite database. Since this is a local app, no additional encryption layer is required for Phase 1. If the app is ever shared or used on a shared machine, consider encrypting the token fields.

---

## Strava token scopes

Request only the minimum required scopes:
- `read` — basic athlete data
- `activity:read_all` — access to all activities (including private)

Do not request `write` scope unless a future phase requires it.

---

## Data isolation

- All data lives in `./data/running.db` on the local machine.
- No data is sent to external services except:
  - Strava API (to fetch your own data)
  - Claude API (Phase 4 only, for grounded chat queries — only structured query results, not raw exports)
- Apple Health data is parsed locally and stored in SQLite. The raw export files are never sent anywhere.

---

## Network exposure

- The Next.js dev server (`pnpm dev`) binds to `localhost:3000` by default.
- Do not run the app behind a public proxy or expose it on a network.
- Do not add `--hostname 0.0.0.0` or similar flags.

---

## Git hygiene

The following must never be committed:
- `.env`, `.env.local`, `.env.*.local`
- `data/` directory
- `exports/` directory
- `*.db`, `*.sqlite`, `*.sqlite3`, `*.db-wal`, `*.db-shm`
- Apple Health export files

All of the above are covered by `.gitignore`.
