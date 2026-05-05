# Setup

## Current Status

Step 5 connects the macOS dashboard to the backend mock scan results endpoint.

No Gmail credentials, OpenAI configuration, MCP setup, or database setup exists yet.

## Codex Setup

Run Codex from the repository root so it can pick up the project instructions in `AGENTS.md`.

## macOS App Setup

1. Open `apps/macos/MailShieldAgent.xcodeproj` in Xcode.
2. Select the `MailShieldAgent` scheme.
3. Run the app.

The app uses `URLSession` to call the local backend health endpoint and mock scan results endpoint from the dashboard.

Local Xcode user data and `.DS_Store` files are ignored and should stay out of git.

## Core Backend Setup

Install dependencies:

```bash
cd apps/core
npm install
```

Start the development server:

```bash
npm run dev
```

The backend is a TypeScript Node project. It uses Express as the HTTP server and listens on port `3000` by default.

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

`GET /scan-results` returns mock email scan result data. Each item includes per-agent checks, and each check has a `passed`, `warning`, or `failed` status. The data is not persisted and does not use Gmail, OpenAI Agents SDK, MCP, or a database yet.

## Run Both Parts Together

1. Start the backend:

```bash
cd apps/core
npm run dev
```

2. Run the macOS app from Xcode.
3. Click "Check backend" in the dashboard.
4. Click "Load mock scans" in the dashboard.

The status card should show `Online` and the `mailshield-core` service name when the backend responds with `status: "ok"`. It should show `Offline` with an error message if the backend is not running.

The scan UI should show recent mock scans. Selecting a scan shows subject, sender, risk level, risk score, summary, and per-agent checks. Each per-agent check is displayed as `passed`, `warning`, or `failed`.

The backend must be running before loading scans. If `GET /scan-results` fails, the dashboard shows a simple error message.

No Gmail, OpenAI Agents SDK, MCP, or database integration exists yet.

The mock scan results are static backend data. They are not persisted and do not use Gmail, OpenAI Agents SDK, MCP, or SQLite yet.
