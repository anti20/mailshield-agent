# Architecture

MailShield Agent is planned as a local-first macOS email safety assistant. The system keeps user interaction in a SwiftUI menu bar app while delegating scanning and integrations to a local TypeScript backend.

## Planned Components

- SwiftUI macOS menu bar app: the desktop UI for email status, scan results, and notifications.
- Local TypeScript backend: a Node-based service that exposes local endpoints to the macOS app.
- OpenAI Agents SDK workflow: the future threat analysis workflow that coordinates email inspection.
- Local MCP tool layer: a controlled tool layer for local actions and integration boundaries.
- Gmail API integration: the first email provider integration.
- SQLite scan history: local storage for scan results and audit history.

## Current Implementation

The current implementation includes a native SwiftUI macOS menu bar app in `apps/macos`. It shows a menu bar item, can open a dashboard window, checks backend health, and loads mock scan results into a recent scans UI.

The current backend skeleton lives in `apps/core`. It is a local TypeScript Node project that uses Express as the HTTP server on local port `3000`.

## Current Backend Routes

- `GET /health`: verifies that the core service is running.
- `GET /scan-results`: returns static mock email scan result data.

The scan result model includes per-agent checks. Each check has a `passed`, `warning`, or `failed` status, plus a reason and optional evidence. The mock endpoint is static backend data. It is not persisted and does not use Gmail, OpenAI Agents SDK, MCP, or SQLite yet.

The macOS dashboard now calls `http://localhost:3000/health` with `URLSession` through `BackendClient`. The response is decoded into a Swift model and updates the backend status card.

The macOS dashboard also calls `http://localhost:3000/scan-results` with `URLSession` through `BackendClient`. The response shape is `{ "items": [...] }`, decoded into Swift scan result models, stored in `AppState`, and displayed as selectable recent scans with an explainable detail view.

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
Mock scan results
```

The app shows each mock scan's subject, sender, risk level, risk score, and summary. It also shows explainable per-agent checks as `passed`, `warning`, or `failed`. This verifies the planned review experience before Gmail, OpenAI Agents SDK, MCP, or SQLite work begins.

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

Gmail integration, OpenAI Agents SDK workflow, MCP tool layer, notifications, and the SQLite local database will be added in later steps. Mock scan results are not persisted. No Gmail, OpenAI, MCP, or database integration exists yet.
