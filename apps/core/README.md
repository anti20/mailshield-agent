# MailShield Core

MailShield Core is the local TypeScript backend for MailShield Agent.

## Current Status

The backend currently exposes a health endpoint, SQLite-backed mock email scan results, a rule-based Static Threat Agent preview, readonly Gmail OAuth endpoints, local token persistence, a Gmail profile test endpoint, recent Gmail message metadata fetching, and Gmail-to-NormalizedEmail conversion for one message.

## Setup

```bash
npm install
```

Copy the env example before testing Gmail OAuth:

```bash
cp .env.example .env
```

Fill `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, and `GMAIL_SCOPES`. The intended scope is `https://www.googleapis.com/auth/gmail.readonly`.

## Run

```bash
npm run dev
```

The server listens on port `3000` by default.

The local SQLite database is created at `apps/core/data/mailshield.sqlite`. Mock scan results are seeded only when the database is empty. Gmail OAuth tokens are stored in SQLite for local development only.

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

Verify the Static Threat Agent preview:

```bash
curl http://localhost:3000/scan-preview
```

`GET /scan-preview` runs deterministic local checks against mock normalized emails. It returns explainable `passed`, `warning`, or `failed` checks and does not persist preview results. It does not use Gmail, OpenAI, or MCP.

Start the Gmail OAuth flow:

```text
http://localhost:3000/auth/gmail/start
```

`GET /auth/gmail/start` redirects to Google OAuth, and `GET /auth/gmail/callback` stores tokens in local SQLite and returns safe token metadata after the callback. Full tokens are not logged or returned.

Verify Gmail connection status:

```bash
curl http://localhost:3000/auth/gmail/status
```

Verify the Gmail profile endpoint after OAuth:

```bash
curl http://localhost:3000/auth/gmail/profile
```

`GET /auth/gmail/status` returns safe connection metadata. `GET /auth/gmail/profile` verifies the Gmail API connection with safe profile data.

Fetch recent Gmail message metadata after OAuth:

```bash
curl http://localhost:3000/gmail/messages/recent
```

Optionally limit the result count:

```bash
curl "http://localhost:3000/gmail/messages/recent?limit=5"
```

`GET /gmail/messages/recent` uses the stored Gmail OAuth token and returns normalized message metadata only. Attachment contents are not downloaded. Gmail scanning is not implemented yet. This does not use OpenAI or MCP.

Fetch one Gmail message as `NormalizedEmail` after OAuth:

```bash
curl http://localhost:3000/gmail/messages/<gmail-message-id>/normalized
```

`GET /gmail/messages/:id/normalized` uses the stored Gmail OAuth token, fetches one real Gmail message, and converts it into the existing `NormalizedEmail` shape for future `StaticThreatAgent` input. Attachment contents are not downloaded, the normalized email is not persisted, and Gmail scanning is not implemented yet. This does not use OpenAI or MCP.

To reset local data, stop the backend and delete `apps/core/data/mailshield.sqlite`.
