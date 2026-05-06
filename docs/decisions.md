# Decisions

## Initial Decisions

- Project name: MailShield Agent
- Folder name: mailshield-agent
- macOS app will use SwiftUI
- Backend will use TypeScript/Node
- Agent workflow will use OpenAI Agents SDK later
- MCP will be added later as a tool layer
- Gmail is the first supported email provider
- Documentation and code are English-only
- Work is done in small commit-friendly steps
- The first UI client is a native SwiftUI macOS menu bar app
- The backend is intentionally not connected in the macOS skeleton step
- Repeated Codex project instructions are stored in `AGENTS.md`
- The core backend starts as a local TypeScript/Express service
- Backend integration is intentionally limited to `GET /health` in this step
- The macOS app talks to the local backend over localhost HTTP.
- Health check integration is implemented before Gmail or AI features.
- Mock scan data is introduced before Gmail and SQLite.
- Static mock results keep UI development independent from external integrations and persistence.
- The macOS UI is built against mock scan results before Gmail integration.
- Mock scan results keep frontend development independent from external accounts, OAuth setup, Gmail API permissions, OpenAI usage, MCP tooling, and local persistence.
- SQLite is used for local scan history in the backend.
- Mock scan results are seeded into SQLite before real Gmail integration.
- Seen Gmail message IDs are tracked locally so future Gmail polling can avoid reprocessing messages.
