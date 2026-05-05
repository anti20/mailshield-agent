# MailShield Agent

MailShield Agent is a planned local-first email safety assistant for macOS. It will help review Gmail messages for suspicious content, summarize risk, and keep a local scan history.

Codex project instructions live in [AGENTS.md](AGENTS.md).

## MVP Goal

The MVP goal is a macOS menu bar app that can show recent Gmail messages, request local backend scans, display threat findings, and notify the user about risky email.

## High-Level Architecture

MailShield Agent is planned as a small multi-part system:

- A SwiftUI macOS menu bar app in `apps/macos`
- A local TypeScript backend in `apps/core`
- OpenAI Agents SDK workflow for analysis
- A local MCP tool layer for controlled actions
- Gmail API integration for email access
- SQLite for local scan history

## Current Status

Step 0 complete: project structure and base documentation are in place.
Step 0.5 complete: Codex project instructions are documented in `AGENTS.md`.
Step 1 complete: a native SwiftUI macOS menu bar app skeleton is in place.
Step 2 complete: the local TypeScript backend exposes a health endpoint.

## Documentation

- [Architecture](docs/architecture.md)
- [Setup](docs/setup.md)
- [Roadmap](docs/roadmap.md)
- [Decisions](docs/decisions.md)
- [Codex instructions](AGENTS.md)
- [Product positioning](docs/product-positioning.md)

## Run Instructions

The macOS app can be opened in Xcode:

1. Open `apps/macos/MailShieldAgent.xcodeproj`.
2. Select the `MailShieldAgent` scheme.
3. Run the app from Xcode.

The app currently uses placeholder data only and is not connected to the backend yet.

The backend can be started locally:

```bash
cd apps/core
npm install
npm run dev
```

Health check:

```text
http://localhost:3000/health
```
