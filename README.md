# MailShield Agent

MailShield Agent is a planned local-first email safety assistant for macOS. It will help review Gmail messages for suspicious content, summarize risk, and keep a local scan history.

Codex project instructions live in [AGENTS.md](AGENTS.md).

## MVP Goal

The MVP goal is a macOS menu bar app that can show recent Gmail messages, request local backend scans, display threat findings, and notify the user about risky email.

## High-Level Architecture

MailShield Agent is planned as a small multi-part system:

- A SwiftUI macOS menu bar app in `apps/macos`
- A local TypeScript backend in `apps/core`
- OpenAI Agents SDK workflow for analysis
- A local MCP tool layer for controlled actions
- Gmail API integration for email access
- SQLite for local scan history

## Current Status

Step 0 complete: project structure and base documentation are in place.
Step 0.5 complete: Codex project instructions are documented in `AGENTS.md`.
Step 1 complete: a native SwiftUI macOS menu bar app skeleton is in place.
Step 2 complete: the local TypeScript backend exposes a health endpoint.
Step 3 complete: the macOS dashboard can check the local backend health endpoint.
Step 4 complete: the backend exposes mock email scan results.
Step 5 complete: the macOS dashboard can load and display mock scan results.
Step 6 complete: the backend persists scan history in local SQLite.
Step 7 complete: the backend exposes a rule-based Static Threat Agent preview.
Step 8 complete: the macOS dashboard can run and display the Static Threat Agent preview.
Step 9 complete: the backend prepares a readonly Gmail OAuth flow.
Step 10 complete: Gmail OAuth token persistence and profile test endpoint are in place.

## Documentation

- [Architecture](docs/architecture.md)
- [Setup](docs/setup.md)
- [Roadmap](docs/roadmap.md)
- [Decisions](docs/decisions.md)
- [Codex instructions](AGENTS.md)
- [Product positioning](docs/product-positioning.md)

## Run Instructions

Start the TypeScript Node backend first:

```bash
cd apps/core
npm install
npm run dev
```

The backend uses Express as its HTTP server and listens on port `3000` by default. Its first endpoint is:

The backend uses SQLite for local scan history at:

```text
apps/core/data/mailshield.sqlite
```

On startup, the backend initializes the database and seeds the current mock scan results only when the database is empty. `GET /scan-results` returns scan results from SQLite. The database can also store seen Gmail message IDs for future Gmail polling and local Gmail OAuth token data for development.

```text
GET http://localhost:3000/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "mailshield-core"
}
```

The backend also exposes mock scan result data:

```text
GET http://localhost:3000/scan-results
```

Verify it with curl:

```bash
curl http://localhost:3000/scan-results
```

`GET /scan-results` returns scan results from local SQLite with per-agent checks. The initial mock data is seeded only when the database is empty and does not use Gmail, OpenAI Agents SDK, or MCP yet.

The backend also exposes a development-only Static Threat Agent preview:

```text
GET http://localhost:3000/scan-preview
```

Verify it with curl:

```bash
curl http://localhost:3000/scan-preview
```

`GET /scan-preview` runs a deterministic rule-based `StaticThreatAgent` against mock `NormalizedEmail` inputs. The checks are explainable, return `passed`, `warning`, or `failed`, and are not persisted. This preview does not use Gmail, OpenAI Agents SDK, or MCP.

The backend also prepares a Gmail OAuth flow:

```text
GET http://localhost:3000/auth/gmail/start
GET http://localhost:3000/auth/gmail/callback
GET http://localhost:3000/auth/gmail/status
GET http://localhost:3000/auth/gmail/profile
```

Configure `apps/core/.env` from `apps/core/.env.example` before starting OAuth. The intended Gmail scope is readonly access only: `https://www.googleapis.com/auth/gmail.readonly`. The callback persists Gmail OAuth tokens in local SQLite for development and returns safe metadata only. Full tokens are not logged or returned. `GET /auth/gmail/status` returns safe connection metadata, and `GET /auth/gmail/profile` verifies the Gmail API connection with safe profile data. Real Gmail message fetching and Gmail scanning are not implemented yet. See [Setup](docs/setup.md) for the full local Google Cloud setup steps.

Open and run the macOS app in Xcode:

1. Open `apps/macos/MailShieldAgent.xcodeproj`.
2. Select the `MailShieldAgent` scheme.
3. Run the app from Xcode.

The dashboard can now check backend health with `URLSession`. Click "Check backend" to verify that the local core service is running.

To verify the mock scan results UI:

1. Start the backend with `npm run dev` from `apps/core`.
2. Run the macOS app from Xcode.
3. Click "Load mock scans" in the dashboard.

The macOS app uses `URLSession` to call `GET /scan-results`. The backend returns SQLite-backed scan result data with per-agent checks, and the UI displays each check as `passed`, `warning`, or `failed`. Gmail, OpenAI Agents SDK, and MCP are not used yet.

To verify the Static Threat Agent preview UI:

1. Start the backend with `npm run dev` from `apps/core`.
2. Run the macOS app from Xcode.
3. Click "Run static preview" in the dashboard.

The macOS app uses `URLSession` to call `GET /scan-preview`. The backend runs `StaticThreatAgent` against mock normalized emails, and the UI shows passed, warning, and failed check counts plus per-check reason and evidence. Preview results are not persisted and do not use Gmail, OpenAI Agents SDK, or MCP.

Gmail OAuth and profile testing are prepared, but Gmail message fetching and scanning are not implemented yet. OpenAI Agents SDK and MCP integration do not exist yet.
