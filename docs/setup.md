# Setup

## Current Status

Step 10 persists Gmail OAuth tokens locally and adds a Gmail profile test endpoint.

Gmail message fetching, Gmail scanning, OpenAI configuration, and MCP setup do not exist yet.

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

The backend stores local scan history and local development Gmail OAuth token data in SQLite at:

```text
apps/core/data/mailshield.sqlite
```

The database is created automatically on backend startup. Mock scan results are seeded only when the database is empty, and `GET /scan-results` returns scan results from SQLite. Gmail OAuth tokens are stored in the `gmail_auth_tokens` table for local development only; production should use stronger secure storage later.

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

## Gmail OAuth Setup

Gmail OAuth is prepared in the TypeScript backend, and OAuth tokens are persisted locally in SQLite for development. Real Gmail message fetching and Gmail scanning are not implemented yet. Full access tokens or refresh tokens must not be logged or returned in responses.

1. Create or use a Google Cloud project.
2. Enable the Gmail API.
3. Configure the OAuth consent screen for development.
4. Create OAuth client credentials for a desktop or local development app.
5. Add this local redirect URI:

```text
http://localhost:3000/auth/gmail/callback
```

6. Copy the env example:

```bash
cp apps/core/.env.example apps/core/.env
```

7. Fill these variables in `apps/core/.env`:

```text
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/gmail/callback
GMAIL_SCOPES=https://www.googleapis.com/auth/gmail.readonly
```

The only intended Gmail scope for now is:

```text
https://www.googleapis.com/auth/gmail.readonly
```

8. Start the backend:

```bash
cd apps/core
npm run dev
```

9. Open the OAuth start endpoint in a browser:

```text
http://localhost:3000/auth/gmail/start
```

`GET /auth/gmail/start` begins the OAuth flow and redirects to Google. `GET /auth/gmail/callback` handles the OAuth callback, stores token data in the local `gmail_auth_tokens` SQLite table, and returns safe token metadata only when configuration is present. This OAuth flow does not use OpenAI Agents SDK or MCP.

## Test Gmail Connection

1. Start the backend:

```bash
cd apps/core
npm run dev
```

2. Open the OAuth start endpoint:

```text
http://localhost:3000/auth/gmail/start
```

3. Complete Google OAuth in the browser.
4. Open the Gmail status endpoint:

```text
http://localhost:3000/auth/gmail/status
```

Expected connected response shape:

```json
{
  "connected": true,
  "provider": "gmail",
  "scope": "https://www.googleapis.com/auth/gmail.readonly",
  "expiresAt": "2026-05-06T12:00:00.000Z"
}
```

5. Open the Gmail profile test endpoint:

```text
http://localhost:3000/auth/gmail/profile
```

Expected response shape:

```json
{
  "emailAddress": "person@example.com",
  "messagesTotal": 123,
  "threadsTotal": 45,
  "historyId": "123456"
}
```

`GET /auth/gmail/status` returns safe connection metadata only. `GET /auth/gmail/profile` verifies the Gmail API connection and returns safe profile data only. If the access token expires and a refresh token is available, the backend attempts to refresh it and update local storage. Real Gmail message fetching and scanning are planned later.

## Reset Local Data

Stop the backend, then delete the local SQLite file:

```bash
rm apps/core/data/mailshield.sqlite
```

The next backend startup recreates the database and seeds the mock scan results again because the database is empty. This also resets local Gmail auth because the `gmail_auth_tokens` table lives in the same SQLite file.

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

Gmail OAuth tokens are persisted locally for development and the Gmail profile endpoint can verify the Gmail API connection. Gmail message fetching and scanning are not implemented yet. OpenAI Agents SDK and MCP integration do not exist yet.

The mock scan results are persisted in local SQLite after seeding. Static preview results are not persisted. Neither flow uses Gmail, OpenAI Agents SDK, or MCP yet.
