# Setup

## Current Status

Step 8 connects the macOS dashboard to the Static Threat Agent preview endpoint.

No Gmail credentials, OpenAI configuration, or MCP setup exists yet.

## Codex Setup

Run Codex from the repository root so it can pick up the project instructions in `AGENTS.md`.

## macOS App Setup

1. Open `apps/macos/MailShieldAgent.xcodeproj` in Xcode.
2. Select the `MailShieldAgent` scheme.
3. Run the app.

The app uses `URLSession` to call the local backend health endpoint, mock scan results endpoint, and Static Threat Agent preview endpoint from the dashboard.

Local Xcode user data and `.DS_Store` files are ignored and should stay out of git.

## Core Backend Setup

Install dependencies:

```bash
cd apps/core
npm install
```

`npm install` installs the SQLite dependency used by the local scan history store.

Start the development server:

```bash
npm run dev
```

The backend is a TypeScript Node project. It uses Express as the HTTP server and listens on port `3000` by default.

The backend stores local scan history in SQLite at:

```text
apps/core/data/mailshield.sqlite
```

The database is created automatically on backend startup. Mock scan results are seeded only when the database is empty, and `GET /scan-results` returns scan results from SQLite.

Verify the health endpoint:

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

`GET /health` is the first endpoint and verifies that the core service is running.

Verify the mock scan results endpoint:

```bash
curl http://localhost:3000/scan-results
```

Expected response shape:

```json
{
  "items": []
}
```

`GET /scan-results` returns SQLite-backed mock email scan result data. Each item includes per-agent checks, and each check has a `passed`, `warning`, or `failed` status. Seen Gmail message IDs can be stored locally for future Gmail polling. This does not use Gmail, OpenAI Agents SDK, or MCP yet.

Verify the Static Threat Agent preview endpoint:

```bash
curl http://localhost:3000/scan-preview
```

Expected response shape:

```json
{
  "items": [
    {
      "email": {},
      "checks": []
    }
  ]
}
```

`GET /scan-preview` runs the rule-based `StaticThreatAgent` against mock `NormalizedEmail` inputs. It returns explainable per-agent checks with `passed`, `warning`, or `failed` statuses. Preview results are not persisted, and this endpoint does not use Gmail, OpenAI Agents SDK, or MCP.

## Reset Local Data

Stop the backend, then delete the local SQLite file:

```bash
rm apps/core/data/mailshield.sqlite
```

The next backend startup recreates the database and seeds the mock scan results again because the database is empty.

## Run Both Parts Together

1. Start the backend:

```bash
cd apps/core
npm run dev
```

2. Run the macOS app from Xcode.
3. Click "Check backend" in the dashboard.
4. Click "Load mock scans" in the dashboard.
5. Click "Run static preview" in the dashboard.

The status card should show `Online` and the `mailshield-core` service name when the backend responds with `status: "ok"`. It should show `Offline` with an error message if the backend is not running.

The scan UI should show recent mock scans. Selecting a scan shows subject, sender, risk level, risk score, summary, and per-agent checks. Each per-agent check is displayed as `passed`, `warning`, or `failed`.

The Static Threat Agent preview UI should show mock normalized emails with passed, warning, and failed check counts. Selecting a preview email shows the normalized email summary and Static Threat Agent checks, including visual status, reason, and evidence when available.

The backend must be running before loading scans or running the static preview. If `GET /scan-results` or `GET /scan-preview` fails, the dashboard shows a simple error message.

No Gmail, OpenAI Agents SDK, or MCP integration exists yet.

The mock scan results are persisted in local SQLite after seeding. Static preview results are not persisted. Neither flow uses Gmail, OpenAI Agents SDK, or MCP yet.
