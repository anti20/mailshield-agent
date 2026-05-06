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

On startup, the backend initializes the database and seeds the current mock scan results only when the database is empty. `GET /scan-results` returns scan results from SQLite. The database can also store seen Gmail message IDs for future Gmail polling, but Gmail is not connected yet.

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

No Gmail, OpenAI Agents SDK, or MCP integration exists yet.
