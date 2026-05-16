# 11 - Security and Privacy

> See also: [[00_PROJECT-BRAIN]] | [[04_STRAVA-INGESTION]] | [[17_VISUAL-REBOOT-PLAN]]

---

## Overview

FarSygil is a single-user localhost application. Security is primarily about:
1. protecting credentials from source control
2. keeping SQLite-held activity and health data local
3. being precise about the small set of user-triggered outbound requests
4. never adding hidden telemetry, map providers, or cloud storage

---

## Secrets management

| Secret | Location | Committed? |
|---|---|---|
| `STRAVA_CLIENT_ID` | `.env.local` | never |
| `STRAVA_CLIENT_SECRET` | `.env.local` | never |
| `CLAUDE_API_KEY` | `.env.local` | never |
| Strava access/refresh tokens | SQLite `strava_tokens` | never |

`.env.local` is ignored by Git. The local SQLite database under `data/` is also
ignored by Git.

---

## Token storage and callback rules

- Strava OAuth tokens are exchanged server-side and written directly to SQLite.
- Tokens must never be exposed to client components, query strings, or user
  copy.
- The OAuth `state` value lives only in an httpOnly same-site cookie during the
  connect flow and is cleared after callback handling.
- Connection-status responses may return safe metadata only:
  athlete id, scope, expiry timestamp, expired flag, and updated timestamp.

---

## Outbound traffic policy

All user data stays local except for explicitly user-enabled provider traffic.

Current outbound destinations:
- Strava API for OAuth, summary sync, and detail sync
- Claude API in Phase 4 only, for grounded queries when that phase lands

Explicitly not used in the visual reboot:
- map tiles
- geocoding
- analytics/telemetry SDKs
- cloud databases
- hosted auth providers

The faux-map on run-detail pages is rendered locally from the stored route
polyline. It does not contact any external map provider.

---

## Data isolation

- All app data lives in `./data/running.db`.
- Summary activities, detailed activity payloads, split rows, stream rows,
  health rows, and future analytics rows stay local.
- Apple Health imports are parsed locally and stored locally.
- User-facing privacy copy must distinguish local storage from direct Strava
  requests triggered by the user.

Do not claim zero network traffic once a source integration is active. Do claim
that FarSygil does not add hidden third-party traffic beyond those provider
requests.

---

## Network exposure

- `pnpm dev` binds to `localhost:3000` by default.
- Do not expose the app with `0.0.0.0` or a public proxy.
- Do not treat localhost development as a public SaaS deployment target.

---

## Git hygiene

The following must never be committed:
- `.env`, `.env.local`, `.env.*.local`
- `data/`
- `exports/`
- `apple_health_data/`
- `*.db`, `*.sqlite`, `*.sqlite3`, `*.db-wal`, `*.db-shm`
- Apple Health export files

These remain covered by `.gitignore`.
