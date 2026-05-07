# Setup

## Prerequisites

- macOS with Xcode
- Node.js 22+
- Google Cloud project with Gmail API enabled
- OpenAI API key

## 1) Backend setup

```bash
cd apps/core
npm install
cp .env.example .env
```

Edit `apps/core/.env`:

```text
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/gmail/callback
GMAIL_SCOPES=https://www.googleapis.com/auth/gmail.readonly
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
```

Start backend:

```bash
npm run dev
```

Quick check:

```bash
curl http://localhost:3000/health
```

## 2) Gmail OAuth setup and connection

In Google Cloud OAuth config, add redirect URI:

```text
http://localhost:3000/auth/gmail/callback
```

Then connect account in browser:

```text
http://localhost:3000/auth/gmail/start
```

Optional checks:

```bash
curl http://localhost:3000/auth/gmail/config-status
curl http://localhost:3000/auth/gmail/status
curl http://localhost:3000/auth/gmail/profile
```

## 3) Run macOS app

1. Open `apps/macos/MailShieldAgent.xcodeproj`.
2. Select `MailShieldAgent` scheme.
3. Run from Xcode.

## 4) Test recent Gmail messages

```bash
curl "http://localhost:3000/gmail/messages/recent?limit=10"
```

## 5) Test static scan (selected Gmail message)

```bash
curl http://localhost:3000/gmail/messages/<gmail-message-id>/static-scan
```

## 6) Test AI agent scan (selected Gmail message)

```bash
curl -X POST http://localhost:3000/gmail/messages/<gmail-message-id>/agent-scan
```

Notes:

- Uses compact input for token control.
- Static scan still works without OpenAI.
- OpenAI rate limits can still happen; backend returns clear `429` message.
- Successful AI scans are persisted locally in SQLite scan history.

## 7) Scan history

```bash
curl http://localhost:3000/scan-results
```

## 8) Reset local SQLite data

Stop backend, then delete DB:

```bash
rm apps/core/data/mailshield.sqlite
```

Next startup recreates schema, reseeds mock scans, and clears local Gmail connection + local history.

## Current scope limits

Not implemented yet:

- Background polling
- Automatic inbox monitoring
- Notifications

