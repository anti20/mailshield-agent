# Setup

## Current Status

Step 2 adds a minimal local TypeScript backend with a health endpoint.

No Gmail credentials, OpenAI configuration, MCP setup, or database setup exists yet.

## Codex Setup

Run Codex from the repository root so it can pick up the project instructions in `AGENTS.md`.

## macOS App Setup

1. Open `apps/macos/MailShieldAgent.xcodeproj` in Xcode.
2. Select the `MailShieldAgent` scheme.
3. Run the app.

The app currently uses placeholder data and does not require the backend.

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

The backend listens on port `3000` by default.

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

The macOS app does not call the backend yet.
