# MailShield Core

MailShield Core is the local TypeScript backend for MailShield Agent.

## Current Status

The backend currently exposes only a health endpoint.

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
