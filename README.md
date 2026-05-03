# FarSygil

**Local-first running command center.**

FarSygil is a personal, local-first running intelligence dashboard that connects Strava and Apple Health data into one private command center. It stores long-term activity, fitness, recovery, and health trends locally in SQLite, then uses that data to generate training insights, race projections, workout recommendations, and risk signals.

Your long-term data stays on your machine. FarSygil only talks to source services you explicitly use, starting with Strava OAuth and sync. No cloud deployment. No subscriptions. No hidden third-party analytics.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | SQLite via better-sqlite3 |
| ORM | Drizzle ORM |
| Package manager | pnpm |
| UI components | shadcn/ui-ready structure |

---

## Local-first purpose

FarSygil is intentionally a **single-user localhost application**. It will never be deployed to the public internet. Your stored health and training data stays on your machine, while the app only contacts external services you explicitly connect, such as Strava.

- No Supabase
- No Postgres
- No Docker
- No Prisma
- No public auth
- No Stripe
- No cloud deployment

---

## Setup

### Prerequisites

- Node.js >= 20.19
- pnpm (`npm install -g pnpm`)

### Install

```bash
pnpm install
```

### Environment variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

| Variable | Description | Phase |
|---|---|---|
| `STRAVA_CLIENT_ID` | Strava API application client ID | Phase 1 |
| `STRAVA_CLIENT_SECRET` | Strava API application client secret | Phase 1 |
| `STRAVA_REDIRECT_URI` | OAuth callback URL (default: `http://localhost:3000/api/strava/callback`) | Phase 1 |
| `CLAUDE_API_KEY` | Anthropic Claude API key | Phase 4 only |

To obtain Strava API credentials, visit: https://www.strava.com/settings/api

### Run development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).
The home page includes a `Connect Strava` entry point plus a persistent local connection-status panel.

### Database

The SQLite database is created automatically at `./data/running.db` on first run. The `data/` directory is excluded from version control.

To generate and run database migrations:

```bash
pnpm db:generate
pnpm db:migrate
```

### Verify the build

```bash
pnpm install
pnpm exec vitest run
pnpm build
pnpm lint
pnpm db:generate
```

All five commands should complete without errors on a clean checkout.

---

## Phase roadmap

| Phase | Focus | Status |
|---|---|---|
| **Phase 1** | Foundation + Strava OAuth + activity ingestion | In progress |
| **Phase 2** | Apple Health import + dashboard | Planned |
| **Phase 3** | Training analytics (load, fitness, fatigue) | Planned |
| **Phase 4** | Grounded AI chat (Claude, local data only) | Planned |

Current progress: the Strava OAuth slice, local token storage, connection-status surface, and the current hardening/test pass are complete. Activity sync is the next major Phase 1 step.

---

## Privacy warning

> **This application is designed for personal use only.**
>
> FarSygil stores your health and training data locally in a SQLite database. Do not expose this application to the public internet. Do not commit your `.env.local` file, database files (`*.db`, `*.sqlite`), or Apple Health exports to version control.
>
> The `data/` and `exports/` directories are excluded from Git by `.gitignore`.

---

## Documentation

Detailed project documentation lives in [`docs/brain/`](./docs/brain/). Start with [`00_PROJECT-BRAIN.md`](./docs/brain/00_PROJECT-BRAIN.md).
