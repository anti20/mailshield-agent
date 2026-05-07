# Architecture

## Overview

MailShield Agent is a local-first system with two parts:

- `apps/macos`: native SwiftUI macOS menu bar app
- `apps/core`: local TypeScript/Node backend (Express)

The app talks to the backend over localhost HTTP. Gmail is the first provider.

## Implemented Components

### macOS app (SwiftUI)

- Backend health status
- Gmail connection status and connected email display
- Recent Gmail message list
- Selected-message static scan view
- Selected-message AI agent scan view with compact user-facing result
- Scan history view from persisted SQLite results

### Backend (TypeScript/Express)

- Health endpoint: `GET /health`
- Scan history endpoint: `GET /scan-results`
- Static preview endpoint: `GET /scan-preview`
- Gmail OAuth endpoints:
  - `GET /auth/gmail/config-status`
  - `GET /auth/gmail/start`
  - `GET /auth/gmail/callback`
  - `GET /auth/gmail/status`
  - `GET /auth/gmail/profile`
- Gmail message endpoints:
  - `GET /gmail/messages/recent`
  - `GET /gmail/messages/:id/normalized`
  - `GET /gmail/messages/:id/static-scan`
  - `POST /gmail/messages/:id/agent-scan`

### Gmail OAuth and message flow

- Uses readonly scope: `https://www.googleapis.com/auth/gmail.readonly`
- Tokens are stored locally for development in SQLite (`gmail_auth_tokens`)
- Recent message metadata is normalized before returning to app
- Attachment contents are not downloaded

### Static Threat Agent

- Deterministic rule-based checks over `NormalizedEmail`
- Outputs explainable checks with `passed | warning | failed`

### OpenAI agent chaining workflow

- Multi-step chain:
  - Email Context Agent
  - Static Threat Agent
  - LLM Threat Reasoning Agent
  - Prompt Injection Agent
  - Risk Scoring Agent
  - Explanation Agent
- Uses compact prompt input (not full raw HTML/body payloads)
- Returns compact user-facing fields (`finalSummary`, `keyReasons`, `recommendedAction`) plus checks
- Detects OpenAI rate limits and returns clear `429` errors

### MCP-compatible tool layer

- Local MCP-compatible endpoints:
  - `GET /mcp/tools`
  - `POST /mcp/tools/:name/invoke`
- Current tools:
  - `gmail.getRecentMessages`
  - `gmail.getNormalizedMessage`
  - `scan.runStaticThreatScan`
  - `scan.getHistory`

### SQLite local persistence

- Database: `apps/core/data/mailshield.sqlite`
- Stores:
  - Scan history (`email_scan_results`, `agent_checks`)
  - Seen message ids (`seen_messages`)
  - Gmail OAuth tokens for local development (`gmail_auth_tokens`)
- Successful AI agent scans are persisted into scan history (practical upsert by Gmail message id)

## Not Implemented

- Background polling
- Automatic inbox monitoring
- macOS notifications
- GitHub/Jira/Teams integrations

