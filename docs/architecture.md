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

The current implementation includes a minimal native SwiftUI macOS menu bar app in `apps/macos`. It shows a menu bar item, can open a dashboard window, and includes placeholder sections for recent scans and agent checks.

The current backend skeleton lives in `apps/core`. It is a local TypeScript Node project that uses Express as the HTTP server on local port `3000`.

## Current Backend Routes

- `GET /health`: verifies that the core service is running.
- `GET /scan-results`: returns static mock email scan result data.

The scan result model includes per-agent checks. Each check has a `passed`, `warning`, or `failed` status, plus a reason and optional evidence. The mock endpoint is not persisted and does not use Gmail, OpenAI Agents SDK, MCP, or SQLite yet.

The macOS dashboard now calls `http://localhost:3000/health` with `URLSession` through `BackendClient`. The response is decoded into a Swift model and updates the backend status card.

`GET /scan-results` prepares the backend contract for the later email scan history screen. The macOS app is not connected to that endpoint yet.

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

This verifies local app/backend communication before Gmail, OpenAI Agents SDK, MCP, or SQLite work begins.

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

Gmail integration, OpenAI Agents SDK workflow, MCP tool layer, notifications, and the SQLite local database will be added in later steps. No Gmail, OpenAI, MCP, or database integration exists yet.
