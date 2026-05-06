# MailShield Agent — Codex Instructions

## Project overview

MailShield Agent is a native macOS menu bar app that monitors Gmail, analyzes emails through an agent workflow, and shows explainable threat results.

## Project structure

- apps/macos: native SwiftUI macOS menu bar app
- apps/core: local TypeScript backend and agent service
- docs: project documentation

## Language rules

- All code must be written in English.
- All documentation must be written in English.
- File names, model names, comments, commit summaries, and technical terms must be written in English.

## Development rules

- Work in small, commit-friendly steps.
- Do not combine unrelated features in one step.
- Keep code clean, readable, and split by responsibility.
- Prefer small files with one clear responsibility.
- Use short one-line comments only when they help explain behavior.
- Use explicit error handling.
- Prefer mock data before real external integrations.

## Documentation rules

- Documentation must be created and updated automatically as part of each step.
- Do not ask the user to manually write documentation.
- Update relevant docs when behavior, architecture, setup, or decisions change.
- Keep documentation concise and practical.

## App architecture rules

- The first UI client is a native SwiftUI macOS menu bar app.
- The backend is a local TypeScript/Node service.
- Gmail is the first supported email provider.
- OpenAI Agents SDK will be used later for the agent workflow.
- MCP will be added later as the tool layer.
- SQLite will be used later for local scan history.

## Workflow rules

- Include how to run or verify the change when applicable.
- Do not commit automatically.

## Current constraints

- Do not add paid third-party services unless explicitly requested.
- Do not request broad Gmail permissions.
- Prefer Gmail readonly access when Gmail is added later.
- Keep security and privacy considerations visible in documentation.
