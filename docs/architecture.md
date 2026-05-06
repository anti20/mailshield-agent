# Architecture

MailShield Agent is planned as a local-first macOS email safety assistant. The system keeps user interaction in a SwiftUI menu bar app while delegating scanning and integrations to a local TypeScript backend.

## Planned Components

- SwiftUI macOS menu bar app: the desktop UI for email status, scan results, and notifications.
- Local TypeScript backend: a Node-based service that exposes local endpoints to the macOS app.
- OpenAI Agents SDK workflow: the future threat analysis workflow that coordinates email inspection.
- Local MCP tool layer: a controlled tool layer for local actions and integration boundaries.
- Gmail API integration: the first email provider integration, starting with readonly OAuth.
- SQLite scan history: local storage for scan results and audit history.

## Current Implementation

The current implementation includes a native SwiftUI macOS menu bar app in `apps/macos`. It shows a menu bar item, can open a dashboard window, checks backend health, loads mock scan results into a recent scans UI, and visualizes Static Threat Agent preview checks.

The current backend skeleton lives in `apps/core`. It is a local TypeScript Node project that uses Express as the HTTP server on local port `3000`, SQLite for local scan history, and prepared Gmail OAuth configuration.

## Current Backend Routes

- `GET /health`: verifies that the core service is running.
- `GET /scan-results`: returns SQLite-backed email scan result data.
- `GET /scan-preview`: runs the rule-based Static Threat Agent against mock normalized emails.
- `GET /auth/gmail/start`: begins the prepared Gmail OAuth flow.
- `GET /auth/gmail/callback`: handles the prepared Gmail OAuth callback.

The scan result model includes per-agent checks. Each check has a `passed`, `warning`, or `failed` status, plus a reason and optional evidence. The backend seeds the current mock scan results into SQLite only when the database is empty. Gmail OAuth is prepared, but Gmail message fetching is not implemented yet. The backend does not use OpenAI Agents SDK or MCP yet.

## Current Gmail OAuth Preparation

Gmail OAuth is prepared in the TypeScript backend with `GmailAuthService` and these environment variables:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `GMAIL_SCOPES`

The only intended Gmail scope for now is:

```text
https://www.googleapis.com/auth/gmail.readonly
```

The prepared OAuth flow is:

```text
browser
  |
  v
GET /auth/gmail/start
  |
  v
Google OAuth
  |
  v
GET /auth/gmail/callback
```

`GET /auth/gmail/start` redirects the browser to Google OAuth with readonly Gmail access, offline access, a development consent prompt, and a simple placeholder state value. Stronger state validation is required later.

`GET /auth/gmail/callback` accepts the OAuth code and exchanges it for tokens when the required configuration exists. The callback returns safe token metadata only. Full access tokens and refresh tokens are not logged or returned in responses. Token persistence and real Gmail message fetching are planned for later steps.

## Current Static Threat Agent

`StaticThreatAgent` is a deterministic rule-based scanner. It works with `NormalizedEmail`, a provider-neutral email input model that includes subject, sender, optional reply-to, optional text and HTML bodies, links, attachments, and received time.

The agent does not use OpenAI, Gmail, or MCP. It checks for sender/reply-to domain mismatch, risky attachment names, URL shorteners, IP link hosts, punycode domains, visible-link domain mismatch, risky HTML patterns, hidden text indicators, and suspicious prompt-injection-like phrases.

`GET /scan-preview` runs `StaticThreatAgent` against static mock emails. It returns explainable checks with `passed`, `warning`, or `failed` statuses. The preview endpoint is for development and demo use only, and it does not persist preview scan results.

This prepares the backend contract for later Gmail ingestion and OpenAI agent workflows while keeping the first security baseline deterministic and local.

## Current Persistence

SQLite is used for local scan history. The local database path is:

```text
apps/core/data/mailshield.sqlite
```

The backend initializes these tables on startup:

- `email_scan_results`
- `agent_checks`
- `seen_messages`

`email_scan_results` stores scan-level email findings. `agent_checks` stores explainable per-agent checks for each scan. `seen_messages` can store seen Gmail message IDs and timestamps for future Gmail polling, but Gmail is not connected yet.

The macOS dashboard now calls `http://localhost:3000/health` with `URLSession` through `BackendClient`. The response is decoded into a Swift model and updates the backend status card.

The macOS dashboard also calls `http://localhost:3000/scan-results` with `URLSession` through `BackendClient`. The response shape is `{ "items": [...] }`, decoded into Swift scan result models, stored in `AppState`, and displayed as selectable recent scans with an explainable detail view.

The macOS dashboard also calls `http://localhost:3000/scan-preview` with `URLSession` through `BackendClient`. The response is decoded into Swift preview models, stored in `AppState`, and displayed as a Static Threat Agent Preview section. The UI shows passed, warning, and failed check counts for each mock email, and the selected detail view shows per-check reason and evidence when available.

## Current App-To-Backend Flow

```text
SwiftUI Dashboard
  |
  v
BackendClient
  |
  v
GET http://localhost:3000/health
  |
  v
Express backend
```

## Current Mock Scan Results Flow

```text
SwiftUI Dashboard
  |
  v
BackendClient
  |
  v
GET http://localhost:3000/scan-results
  |
  v
Express backend
  |
  v
ScanStore
  |
  v
SQLite
```

The route uses `ScanStore`, and `ScanStore` returns scan results from SQLite. Mock results are seeded only when the database is empty. The app shows each scan's subject, sender, risk level, risk score, and summary. It also shows explainable per-agent checks as `passed`, `warning`, or `failed`. This verifies the planned review experience before Gmail, OpenAI Agents SDK, or MCP work begins.

## Current Static Threat Preview Flow

```text
SwiftUI Dashboard
  |
  v
BackendClient
  |
  v
GET http://localhost:3000/scan-preview
  |
  v
Express backend
  |
  v
ScanPipeline
  |
  v
StaticThreatAgent
  |
  v
Mock NormalizedEmail inputs
```

The app now visualizes deterministic threat checks from the preview flow. The data is still mock normalized email data, and the preview flow does not write to SQLite. Persisted scan history still comes from `GET /scan-results` through `ScanStore`.

## Text Diagram

```text
User
  |
  v
SwiftUI macOS menu bar app
  |
  v
Local TypeScript/Express backend
  |
  +--> Gmail API integration
  |
  +--> OpenAI Agents SDK workflow
  |      |
  |      v
  |    Local MCP tool layer
  |
  +--> SQLite scan history
```

## Notes

Gmail OAuth is prepared, but Gmail message fetching will be added in a later step. OpenAI Agents SDK workflow, MCP tool layer, and notifications will also be added later. Mock scan results are persisted locally after seeding, but Static Threat Agent preview results are not persisted.
