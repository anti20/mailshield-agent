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
It also shows Gmail connection status, can open Gmail OAuth login in the default browser, displays the connected Gmail email address when available, loads recent Gmail message metadata, runs static scan for one selected Gmail message, and can run an OpenAI-powered AI agent scan for that selected message.

The current backend skeleton lives in `apps/core`. It is a local TypeScript Node project that uses Express as the HTTP server on local port `3000`, SQLite for local scan history and local development Gmail OAuth token storage, Gmail profile testing, recent Gmail message metadata fetching, one-message conversion into `NormalizedEmail`, one-message static scanning, and one-message OpenAI agent scanning.

## Current Backend Routes

- `GET /health`: verifies that the core service is running.
- `GET /scan-results`: returns SQLite-backed email scan result data.
- `GET /scan-preview`: runs the rule-based Static Threat Agent against mock normalized emails.
- `GET /auth/gmail/start`: begins the prepared Gmail OAuth flow.
- `GET /auth/gmail/callback`: handles the prepared Gmail OAuth callback.
- `GET /auth/gmail/config-status`: reports OAuth app configuration status without secrets.
- `GET /auth/gmail/status`: returns safe Gmail connection metadata.
- `GET /auth/gmail/profile`: verifies the Gmail API connection with safe profile data.
- `GET /gmail/messages/recent`: fetches recent Gmail message metadata.
- `GET /gmail/messages/:id/normalized`: fetches one Gmail message and converts it to `NormalizedEmail`.
- `GET /gmail/messages/:id/static-scan`: runs static checks on one normalized Gmail message.
- `POST /gmail/messages/:id/agent-scan`: runs the OpenAI-powered agent chain on one normalized Gmail message.
- `GET /mcp/tools`: lists local MCP-compatible tools and schemas.
- `POST /mcp/tools/:name/invoke`: invokes one local MCP-compatible tool.

The scan result model includes per-agent checks. Each check has a `passed`, `warning`, or `failed` status, plus a reason and optional evidence. The backend seeds the current mock scan results into SQLite only when the database is empty. Gmail OAuth tokens are persisted locally, recent Gmail message metadata can be fetched, one Gmail message can be converted into `NormalizedEmail`, one Gmail message can be scanned with deterministic static checks, and one Gmail message can be scanned with the OpenAI-powered agent chain. Scan results for this Gmail flow are not persisted yet. A local MCP-compatible layer now wraps existing Gmail and scan services for tool-style access.

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

`GET /auth/gmail/callback` accepts the OAuth code and exchanges it for tokens when the required configuration exists. The callback stores token data through `GmailTokenStore` in local SQLite and returns safe token metadata only. Full access tokens and refresh tokens are not logged or returned in responses.

`GET /auth/gmail/config-status` distinguishes app-level OAuth configuration from user account connection. It returns whether `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are configured, without exposing secret values.

The Gmail auth persistence flow is:

```text
OAuth callback
  |
  v
GmailAuthService
  |
  v
GmailTokenStore
  |
  v
SQLite gmail_auth_tokens
```

`GET /auth/gmail/status` reads `GmailTokenStore` and returns safe connection metadata only. `GET /auth/gmail/profile` reads the stored token, calls Gmail through `GmailProfileService`, and returns safe Gmail profile data:

```text
GET /auth/gmail/profile
  |
  v
GmailProfileService
  |
  v
Gmail API users.getProfile
```

If the access token is expired and a refresh token exists, the profile service attempts to refresh credentials through the Google client and update local token storage. This is local development storage only; production should use stronger secure storage later.

The Gmail message metadata flow is:

```text
GET /gmail/messages/recent
  |
  v
GmailMessageService
  |
  v
Gmail API users.messages.list
  |
  v
Gmail API users.messages.get
```

`GET /gmail/messages/recent` uses the stored Gmail OAuth token. `GmailMessageService` first lists recent message ids with `users.messages.list`, then reads each message with `users.messages.get` and a constrained fields projection for headers, snippet, labels, internal date, and attachment metadata. The response is normalized before returning to the app, so raw Gmail API responses are not exposed directly. Attachment contents are not downloaded, attachment files are not downloaded, fetched messages are not persisted in this step, and Gmail email scanning will be added later.

The Gmail message normalization flow is:

```text
GET /gmail/messages/:id/normalized
  |
  v
GmailMessageService
  |
  v
Gmail API users.messages.get (full message payload)
  |
  v
NormalizedEmail
```

`GET /gmail/messages/:id/normalized` uses the stored Gmail OAuth token and maps one Gmail message into the existing `NormalizedEmail` structure. It extracts subject, sender, optional reply-to, text/html body when available, links from text/html, attachment metadata only, and received time. Attachment contents are not downloaded, this endpoint does not run scanning, and normalized output is not persisted in this step.

The one-message Gmail static scan flow is:

```text
GET /gmail/messages/:id/static-scan
  |
  v
GmailStaticScanService
  |
  +--> GmailMessageService.getNormalizedMessage
  |      |
  |      v
  |    NormalizedEmail
  |
  +--> StaticThreatAgent
         |
         v
       checks
```

`GET /gmail/messages/:id/static-scan` reuses the Gmail normalization flow, then runs the deterministic rule-based `StaticThreatAgent` checks for sender/reply-to mismatch, attachment name patterns, links, risky HTML patterns, and prompt-injection-like phrases. The response includes the normalized email and checks, attachment contents are not downloaded, raw Gmail API responses are not exposed, and scan results are not persisted in this step.

## Current OpenAI Agent Workflow

The first real OpenAI-powered agent chaining workflow uses the official OpenAI Agents SDK TypeScript package. It requires:

```text
OPENAI_API_KEY
```

The backend validates that `OPENAI_API_KEY` exists before running AI agent scans. The key is never logged or returned. `StaticThreatAgent` and the existing static scan endpoints still work without OpenAI.

The selected Gmail message AI scan flow is:

```text
POST /gmail/messages/:id/agent-scan
  |
  v
GmailAgentScanService
  |
  +--> GmailMessageService.getNormalizedMessage
  |      |
  |      v
  |    NormalizedEmail
  |
  +--> Email Context Agent
  +--> Static Threat Agent
  +--> LLM Threat Reasoning Agent
  +--> Prompt Injection Agent
  +--> Risk Scoring Agent
  +--> Explanation Agent
         |
         v
       combined agent scan result
```

Each step returns structured data. The combined result includes normalized email summary, `agentSteps[]`, combined checks, final risk level, final risk score, final explanation, and limitations. The workflow reuses the existing Gmail normalization flow and `StaticThreatAgent` baseline through the local MCP-compatible tool layer (`gmail.getNormalizedMessage` and `scan.runStaticThreatScan`). It does not persist agent scan results yet, does not download attachment contents, does not expose raw Gmail API responses, does not log or return Gmail tokens, and does not log or return OpenAI API keys.

## Current Local MCP Tool Layer

The backend now includes a local MCP-compatible tool layer that wraps existing services instead of duplicating Gmail or scanner logic.

Implemented tools:

- `gmail.getRecentMessages` -> wraps `GmailMessageService.listRecentMessages`
- `gmail.getNormalizedMessage` -> wraps `GmailMessageService.getNormalizedMessage`
- `scan.runStaticThreatScan` -> wraps `ScanPipeline.scanEmail` (`StaticThreatAgent`)
- `scan.getHistory` -> wraps `ScanStore.listScanResults`

Tool contracts are explicit with input/output schemas, and outputs stay normalized and safe. The MCP layer does not expose raw Gmail API responses, does not expose Gmail tokens, and does not log Gmail tokens or OpenAI keys.

The MCP transport is local HTTP for now:

- `GET /mcp/tools` for tool discovery
- `POST /mcp/tools/:name/invoke` for tool invocation with `{ \"input\": ... }`

The invoke route is local-only to reduce misuse risk in the local MVP.

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
- `gmail_auth_tokens`

`email_scan_results` stores scan-level email findings. `agent_checks` stores explainable per-agent checks for each scan. `seen_messages` can store seen Gmail message IDs and timestamps for future Gmail polling. `gmail_auth_tokens` stores Gmail OAuth token data for a single local Gmail account during development.

The macOS dashboard now calls `http://localhost:3000/health` with `URLSession` through `BackendClient`. The response is decoded into a Swift model and updates the backend status card.

The macOS dashboard also calls `http://localhost:3000/scan-results` with `URLSession` through `BackendClient`. The response shape is `{ "items": [...] }`, decoded into Swift scan result models, stored in `AppState`, and displayed as selectable recent scans with an explainable detail view.

The macOS dashboard also calls `http://localhost:3000/scan-preview` with `URLSession` through `BackendClient`. The response is decoded into Swift preview models, stored in `AppState`, and displayed as a Static Threat Agent Preview section. The UI shows passed, warning, and failed check counts for each mock email, and the selected detail view shows per-check reason and evidence when available.

The macOS dashboard also calls `http://localhost:3000/gmail/messages/recent`, `http://localhost:3000/gmail/messages/:id/static-scan`, and `http://localhost:3000/gmail/messages/:id/agent-scan` through `BackendClient`. It displays recent Gmail message metadata, allows selecting one message, shows deterministic `StaticThreatAgent` checks, and shows AI agent chain steps plus final risk details for the selected message.

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

Gmail OAuth token persistence, profile testing, recent message metadata fetching, one-message `NormalizedEmail` conversion, one-message deterministic static scanning, OpenAI-powered agent scanning, local MCP-compatible tool wrapping, and macOS selected-message scan UI are implemented. Persisted Gmail scan history will be added in a later step, and notifications remain a later step. Mock scan results are persisted locally after seeding, but Static Threat Agent preview results, Gmail static scan results, and Gmail agent scan results are not persisted.
The backend currently supports one local connected Gmail account for development. Multi-account support is planned for a later step.
A future hosted OAuth broker could remove local client-secret setup from the local MVP.
