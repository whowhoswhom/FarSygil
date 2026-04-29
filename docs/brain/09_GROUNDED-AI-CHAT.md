# 09 — Grounded AI Chat

> See also: [[00_PROJECT-BRAIN]] · [[08_TRAINING-ANALYTICS]]

---

## Status

**Phase 4 — out of scope until Phase 4.**

> ⚠️ Do not implement AI chat features in earlier phases. This file exists for planning only.

---

## Concept

FarSygil's AI chat will allow the user to ask questions about their training data in natural language. The AI assistant will:

1. Parse the user's question.
2. Query the local SQLite database to retrieve relevant data.
3. Pass the retrieved data — not raw exports — to Claude.
4. Return an answer grounded entirely in the user's real data.

The assistant will **never** answer questions it cannot support with real data.

---

## Grounding rules

- Claude only receives data retrieved from the local database via explicit SQL queries.
- Claude never receives raw XML exports, raw API responses, or external URLs.
- If data is missing, Claude must say so — never fabricate an answer.
- The system prompt must instruct Claude to refuse to speculate beyond the data provided.

---

## Stack

| Component | Technology |
|---|---|
| LLM | Anthropic Claude (claude-3-5-sonnet or later) |
| API key | `CLAUDE_API_KEY` in `.env.local` |
| Chat UI | Custom Next.js streaming UI (not Vercel AI SDK) |
| Context | SQL query results injected as structured context |

---

## Safety

- No PII is sent to external services beyond what's in the database.
- The user must explicitly enable AI chat in settings.
- API key is stored in `.env.local` and never committed to Git.
