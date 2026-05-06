# Setup

## Current Status

Step 18 adds a local MCP-compatible tool layer for existing Gmail and scan capabilities.

Persisted Gmail agent scan history still does not exist yet.

## Codex Setup

Run Codex from the repository root so it can pick up the project instructions in `AGENTS.md`.

## macOS App Setup

1. Open `apps/macos/MailShieldAgent.xcodeproj` in Xcode.
2. Select the `MailShieldAgent` scheme.
3. Run the app.

The app uses `URLSession` to call the local backend health endpoint, mock scan results endpoint, and Static Threat Agent preview endpoint from the dashboard.
The app also calls Gmail auth status/profile endpoints to show Gmail connection state and connected account email.
It can also call recent Gmail message and one-message static scan endpoints for selected-message review.

Local Xcode user data and `.DS_Store` files are ignored and should stay out of git.

## Core Backend Setup

Install dependencies:

```bash
cd apps/core
npm install
```

`npm install` installs the SQLite dependency used by the local scan history store and the OpenAI Agents SDK dependency used by AI agent scans. Use Node.js 22 or newer for the OpenAI Agents SDK path. If you switch Node versions and SQLite fails to load, run `npm rebuild better-sqlite3` from `apps/core`.

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

`GET /scan-results` returns SQLite-backed mock email scan result data. Each item includes per-agent checks, and each check has a `passed`, `warning`, or `failed` status. Seen Gmail message IDs can be stored locally for future Gmail polling. This endpoint does not use Gmail or OpenAI Agents SDK directly.

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

`GET /scan-preview` runs the rule-based `StaticThreatAgent` against mock `NormalizedEmail` inputs. It returns explainable per-agent checks with `passed`, `warning`, or `failed` statuses. Preview results are not persisted, and this endpoint does not use Gmail or OpenAI Agents SDK.

## Gmail OAuth Setup

Gmail OAuth is implemented in the TypeScript backend, and OAuth tokens are persisted locally in SQLite for development. Recent Gmail message metadata fetching is implemented through `GET /gmail/messages/recent`, one-message normalization is implemented through `GET /gmail/messages/:id/normalized`, and one-message static scanning is implemented through `GET /gmail/messages/:id/static-scan`. Full access tokens or refresh tokens must not be logged or returned in responses.

Google OAuth client credentials (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) are app configuration, not the user's Gmail login.

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
OPENAI_API_KEY=
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

`GET /auth/gmail/start` begins the OAuth flow and redirects to Google. `GET /auth/gmail/callback` handles the OAuth callback, stores token data in the local `gmail_auth_tokens` SQLite table, and returns safe token metadata only when configuration is present. This OAuth flow does not use OpenAI Agents SDK directly.
The Gmail account is selected in the browser during this OAuth flow. The backend currently supports one local connected Gmail account for development; multi-account support is planned later.

Verify OAuth app configuration status:

```bash
curl http://localhost:3000/auth/gmail/config-status
```

`GET /auth/gmail/config-status` reports whether backend OAuth credentials are configured without exposing secrets.

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

`GET /auth/gmail/status` returns safe connection metadata only. `GET /auth/gmail/profile` verifies the Gmail API connection and returns safe profile data only. If the access token expires and a refresh token is available, the backend attempts to refresh it and update local storage. Real Gmail message scanning is planned later.

## Test Recent Gmail Messages

1. Start the backend:

```bash
cd apps/core
npm run dev
```

2. Complete Gmail OAuth if needed:

```text
http://localhost:3000/auth/gmail/start
```

3. Open or curl the recent messages endpoint:

```bash
curl http://localhost:3000/gmail/messages/recent
```

4. Optionally request a smaller page:

```bash
curl "http://localhost:3000/gmail/messages/recent?limit=5"
```

`GET /gmail/messages/recent` fetches recent Gmail message metadata with the stored Gmail OAuth token. The default limit is `10`, and the maximum limit is `25`. Returned messages are normalized before leaving the backend and include id, thread id, subject, sender, snippet, received time, label IDs, and whether attachments are present. Attachment contents are not downloaded, fetched messages are not persisted in this step, and this endpoint does not run scanning.

## Test One Normalized Gmail Message

1. Start the backend:

```bash
cd apps/core
npm run dev
```

2. Complete Gmail OAuth if needed:

```text
http://localhost:3000/auth/gmail/start
```

3. Fetch recent message metadata to get an id:

```bash
curl http://localhost:3000/gmail/messages/recent
```

4. Fetch one normalized message:

```bash
curl http://localhost:3000/gmail/messages/<gmail-message-id>/normalized
```

`GET /gmail/messages/:id/normalized` uses the stored Gmail OAuth token to fetch one real Gmail message and convert it into the existing `NormalizedEmail` format that prepares Gmail input for `StaticThreatAgent`. The response includes subject, sender, optional reply-to, body text/html when available, extracted links, attachment metadata, and received time. Attachment contents are not downloaded, the normalized email is not persisted yet, and this endpoint does not run scanning.

## Test One Gmail Static Scan

1. Start the backend:

```bash
cd apps/core
npm run dev
```

2. Complete Gmail OAuth if needed:

```text
http://localhost:3000/auth/gmail/start
```

3. Fetch recent message metadata to get an id:

```bash
curl http://localhost:3000/gmail/messages/recent
```

4. Run static scan on one Gmail message:

```bash
curl http://localhost:3000/gmail/messages/<gmail-message-id>/static-scan
```

`GET /gmail/messages/:id/static-scan` scans one real Gmail message by reusing the normalization flow and running the deterministic rule-based `StaticThreatAgent`. The response includes the normalized email and generated checks. Attachment contents are not downloaded and scan results are not persisted in this step.

## OpenAI Agent Scan Setup

The AI agent scan uses the official OpenAI Agents SDK TypeScript package. Add an OpenAI API key to `apps/core/.env`:

```text
OPENAI_API_KEY=
```

The backend validates that `OPENAI_API_KEY` is present before running AI agent scans. The key must not be logged or returned in API responses. `StaticThreatAgent` still works without OpenAI through `GET /gmail/messages/:id/static-scan` and the macOS static scan button.

The first agent chain contains:

- Email Context Agent: summarizes user-visible context and requested action.
- Static Threat Agent: runs deterministic checks for sender/reply-to, attachments, links, HTML, and prompt-injection-like phrases.
- LLM Threat Reasoning Agent: reasons about phishing, fraud, malware, impersonation, and social engineering signals.
- Prompt Injection Agent: reviews the email as untrusted content for hidden or adversarial instructions.
- Risk Scoring Agent: assigns final `low`, `medium`, `high`, or `critical` risk and a 0-100 score.
- Explanation Agent: writes the final user-facing explanation and limitations.

The workflow returns structured JSON with normalized email summary, `agentSteps[]`, combined checks, final risk level, final risk score, final explanation, and limitations. It does not persist results yet, does not download attachment contents, does not expose raw Gmail API responses, does not log or return Gmail tokens, and does not log or return OpenAI API keys. The workflow now uses the local MCP-compatible tool layer for Gmail normalization and deterministic static threat checks.

## Test One Gmail AI Agent Scan

1. Start the backend:

```bash
cd apps/core
npm run dev
```

2. Complete Gmail OAuth if needed:

```text
http://localhost:3000/auth/gmail/start
```

3. Fetch recent message metadata to get an id:

```bash
curl http://localhost:3000/gmail/messages/recent
```

4. Run AI agent scan on one Gmail message:

```bash
curl -X POST http://localhost:3000/gmail/messages/<gmail-message-id>/agent-scan
```

`POST /gmail/messages/:id/agent-scan` uses the stored Gmail OAuth token, reuses the Gmail normalization flow, runs `StaticThreatAgent`, and runs the OpenAI-powered agent chain. `OPENAI_API_KEY` is required for this endpoint. Attachment contents are not downloaded and scan results are not persisted yet.

## Verify Local MCP Tool Layer

The backend also exposes a local MCP-compatible tool layer that wraps existing services:

- `gmail.getRecentMessages` -> `GmailMessageService.listRecentMessages`
- `gmail.getNormalizedMessage` -> `GmailMessageService.getNormalizedMessage`
- `scan.runStaticThreatScan` -> `ScanPipeline.scanEmail` (`StaticThreatAgent`)
- `scan.getHistory` -> `ScanStore.listScanResults`

List available tools:

```bash
curl http://localhost:3000/mcp/tools
```

Invoke a tool locally:

```bash
curl -X POST http://localhost:3000/mcp/tools/gmail.getRecentMessages/invoke \
  -H 'Content-Type: application/json' \
  -d '{"input":{"limit":5}}'
```

Invoke static scan tool with a normalized email payload:

```bash
curl -X POST http://localhost:3000/mcp/tools/scan.runStaticThreatScan/invoke \
  -H 'Content-Type: application/json' \
  -d '{"input":{"email":{"id":"email_demo","subject":"Demo","sender":"demo@example.com","links":[],"attachments":[],"receivedAt":"2026-01-01T00:00:00.000Z"}}}'
```

These MCP tool endpoints are local-only, return normalized safe data, do not expose raw Gmail API responses, and do not return tokens or API keys.

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

Gmail OAuth tokens are persisted locally for development, the Gmail profile endpoint can verify the Gmail API connection, recent Gmail message metadata can be fetched, one message can be converted into `NormalizedEmail`, one message can be scanned with `StaticThreatAgent`, and one message can be scanned with the OpenAI-powered agent chain. Scan results for this flow are not persisted yet. A local MCP-compatible tool layer now exposes existing Gmail and scan capabilities for controlled local tool usage.

## Verify Gmail Account Visibility In macOS App

1. Start the backend:

```bash
cd apps/core
npm run dev
```

2. Run the macOS app from Xcode.
3. In the dashboard, click "Open Gmail login" to open `http://localhost:3000/auth/gmail/start` in the default browser.
4. Complete Google OAuth in the browser.
5. Return to the app and click "Refresh Gmail status".

The dashboard should show OAuth app configuration status and Gmail account connection status. If OAuth credentials are missing, it shows a clear message to add them to `apps/core/.env`. If OAuth is configured, "Open Gmail login" is available and the connected Gmail email address is shown when available.

A future hosted OAuth broker could remove local client-secret setup from the developer machine.

## Verify Real Gmail Message List And Selected Scan In macOS App

1. Start the backend:

```bash
cd apps/core
npm run dev
```

2. Run the macOS app from Xcode.
3. Confirm Gmail OAuth app config is `Configured` and connect an account if needed.
4. Click "Load recent Gmail" in the "Real Gmail Messages" section.
5. Select a message from the list.
6. Click "Run static scan on selected message".

The app should show recent Gmail metadata rows, selected message details, and deterministic `StaticThreatAgent` checks with passed/warning/failed status, reason, and evidence when available.

The mock scan results are persisted in local SQLite after seeding. Static preview results are not persisted. The real Gmail list and selected-message scan flows use Gmail services, and AI agent scan uses OpenAI Agents SDK. MCP is available as a local tool layer and is not yet the execution path of the AI chain.
