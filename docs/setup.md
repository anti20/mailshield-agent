# Setup

## Current Status

Step 3 connects the macOS dashboard to the local TypeScript Node backend health endpoint.

No Gmail credentials, OpenAI configuration, MCP setup, or database setup exists yet.

## Codex Setup

Run Codex from the repository root so it can pick up the project instructions in `AGENTS.md`.

## macOS App Setup

1. Open `apps/macos/MailShieldAgent.xcodeproj` in Xcode.
2. Select the `MailShieldAgent` scheme.
3. Run the app.

The app uses `URLSession` to call the local backend health endpoint from the dashboard.

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

## Run Both Parts Together

1. Start the backend:

```bash
cd apps/core
npm run dev
```

2. Run the macOS app from Xcode.
3. Click "Check backend" in the dashboard.

The status card should show `Online` and the `mailshield-core` service name when the backend responds with `status: "ok"`. It should show `Offline` with an error message if the backend is not running.

No Gmail, OpenAI Agents SDK, MCP, or database integration exists yet.
