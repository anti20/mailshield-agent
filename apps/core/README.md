# MailShield Core

MailShield Core is the local TypeScript backend for MailShield Agent.

## Current Status

The backend currently exposes a health endpoint and static mock email scan results.

## Setup

```bash
npm install
```

## Run

```bash
npm run dev
```

The server listens on port `3000` by default.

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

`GET /scan-results` returns fake scan result data with per-agent checks. It is not persisted and does not use Gmail, OpenAI, MCP, or SQLite yet.
