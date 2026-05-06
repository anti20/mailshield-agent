# MailShield Core

MailShield Core is the local TypeScript backend for MailShield Agent.

## Current Status

The backend currently exposes a health endpoint and SQLite-backed mock email scan results.

## Setup

```bash
npm install
```

## Run

```bash
npm run dev
```

The server listens on port `3000` by default.

The local SQLite database is created at `apps/core/data/mailshield.sqlite`. Mock scan results are seeded only when the database is empty.

## Verify

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "mailshield-core"
}
```

Verify mock scan results:

```bash
curl http://localhost:3000/scan-results
```

`GET /scan-results` returns scan result data from SQLite with per-agent checks. Seen Gmail message IDs can be stored locally for future polling, but the backend does not use Gmail, OpenAI, or MCP yet.

To reset local data, stop the backend and delete `apps/core/data/mailshield.sqlite`.
