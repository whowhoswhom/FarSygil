# 01 - Product Vision

> See also: [[00_PROJECT-BRAIN]] · [[13_ROADMAP-PHASES]]

---

## What is FarSygil?

FarSygil is a **personal, local-first running archive and command center** for serious runners who want complete ownership of their training data.

It aggregates data from Strava (activities) and Apple Health (physiology), stores everything locally in SQLite, and provides:

- A private archive of real efforts
- Deterministic training analytics once later phases arrive
- A grounded AI assistant that reasons over real data in Phase 4

---

## Why does it exist?

Most running analytics tools:

- Store your data in the cloud
- Show vague or fabricated metrics
- Require subscriptions
- Do not let you own or export your data
- Mix your data with third-party models

FarSygil is different:

- **All data stays on your machine** — no cloud, no subscriptions
- **No invented data** — every metric is computed from actual Strava or Apple Health records
- **Transparent analytics** — deterministic formulas, not black-box ML
- **You own everything** — SQLite database, plain files, open code

---

## Who is it for?

One person: the person running it on their own laptop.

This is not a multi-user SaaS. It is not a public app. It is a private tool.

---

## Product tone

- Dark, premium, and local-first
- More like a private training archive than a generic analytics dashboard
- Calm, factual, and editorial in copy
- Honest about network boundaries: the app talks to Strava when the user connects or syncs, but long-term storage stays local

---

## Design principles

1. **Local-first** — data lives on disk, not in the cloud
2. **No hallucinations** — missing data shows `--` or `—`, never a guess
3. **Strava is authoritative for activities** — never override Strava data with invented values
4. **Apple Health is authoritative for physiology** — resting HR, HRV, sleep, and related health data come from Apple Health only
5. **Archive first, analytics later** — browsing real efforts cleanly comes before derived training surfaces
6. **Simple before smart** — get the data right before adding intelligence
7. **Grounded AI last** — AI chat is Phase 4, after all real data is working correctly
