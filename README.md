
# MailShield Agent

MailShield Agent is a local-first macOS menu bar app for Gmail threat review. It combines deterministic security checks with an OpenAI agent workflow and keeps scan history in local SQLite.

## What Works Today

- Native SwiftUI macOS app with dashboard and scan views
- Local TypeScript/Node (Express) backend on `localhost:3000`
- Gmail OAuth connection flow and account status/profile checks
- Recent Gmail message metadata loading
- Static Threat Agent scan for a selected Gmail message
- OpenAI multi-step agent scan for a selected Gmail message
- Local MCP-compatible tool layer for Gmail + scan capabilities
- Local SQLite scan history (`apps/core/data/mailshield.sqlite`)
- Successful AI scan results persisted into history

## Run Backend

```bash
cd apps/core
npm install
npm run dev
```

Required env file:

```bash
cp apps/core/.env.example apps/core/.env
```

Then fill `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `OPENAI_API_KEY` (`OPENAI_MODEL` optional).

## Run macOS App

1. Open `apps/macos/MailShieldAgent.xcodeproj` in Xcode.
2. Select the `MailShieldAgent` scheme.
3. Run.

## Docs

- [Architecture](docs/architecture.md)
- [Setup](docs/setup.md)
- [Product Positioning](docs/product-positioning.md)

<img width="762" height="925" alt="Screenshot 2026-05-07 at 17 47 42" src="https://github.com/user-attachments/assets/4f3c3001-0ee8-469d-a4c0-50f8a1dda00a" />
