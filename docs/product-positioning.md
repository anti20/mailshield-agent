# Product Positioning

## What MailShield Agent Does

MailShield Agent is planned as a local-first macOS assistant for monitoring Gmail messages for suspicious content. It will help surface risky email, summarize why a message looks suspicious, and keep a local history of scan results.

## How It Is Planned To Work

The app starts as a native macOS menu bar client connected to a local TypeScript Node backend. The current backend uses Express, runs locally on port `3000`, exposes `GET /health` to verify that the core service is running, and exposes `GET /scan-results` with SQLite-backed mock email scan result data.

The macOS app can now demonstrate the planned explainable threat review UI with mock data. It loads scan results, shows risk level and score, and displays per-agent checks as `passed`, `warning`, or `failed`. The backend now has a local-first persistence foundation using SQLite at `apps/core/data/mailshield.sqlite`.

A later backend will connect to Gmail, run scan workflows, coordinate threat analysis through the OpenAI Agents SDK, expose controlled actions through MCP, and store scan history locally.

## Planned Extensions

- Gmail message list and detail views
- Local scan history
- Threat analysis agents
- Controlled MCP tool layer
- User notifications for risky email
- Additional email providers after the Gmail MVP

## How It Differs From Similar Apps Or Tools

MailShield Agent is intended to combine a focused macOS menu bar experience with local-first scan history and agent-based analysis. Unlike general email clients, the product is centered on threat monitoring and explanation. Unlike cloud-only scanning tools, the planned architecture keeps the desktop client and local backend as first-class parts of the workflow.

## Current Limitation

The current app is still a local shell and backend demo. The backend returns mock scan result data from SQLite, and the macOS app displays those results through `URLSession` calls to `GET /scan-results`. Gmail scanning does not work yet, and no Gmail, OpenAI Agents SDK, MCP, or notifications integration exists yet.
