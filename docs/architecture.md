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

The current implementation includes a minimal native SwiftUI macOS menu bar app skeleton in `apps/macos`. It shows a menu bar item, can open a dashboard window, displays placeholder backend status, and includes placeholder sections for recent scans and agent checks.

Backend integration is planned for a later step. The app does not call any local service yet.

## Text Diagram

```text
User
  |
  v
SwiftUI macOS menu bar app
  |
  v
Local TypeScript backend
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

The backend, Gmail integration, OpenAI Agents SDK workflow, MCP tool layer, notifications, and local database will be added in later steps.
