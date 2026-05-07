# Product Positioning

MailShield Agent is a native macOS menu bar app that helps users review Gmail threats without leaving desktop context.

## What it does today

- Connects one Gmail account through OAuth
- Loads recent Gmail message metadata
- Runs deterministic static threat checks on a selected message
- Runs OpenAI agent chaining on a selected message
- Shows explainable checks with risk level, score, reasons, and recommended action
- Stores successful AI scan history locally in SQLite

## Why it is different

- Native macOS workflow, not a browser-only dashboard
- Gmail-connected review flow built around explainable security checks
- Combines deterministic checks + LLM reasoning instead of only one opaque score
- MCP-compatible local tool layer for controlled extension paths
- Local-first history (SQLite) rather than requiring cloud storage

## Current limitations (intentional)

- No background polling or automatic inbox monitoring
- No macOS notifications yet
- No GitHub/Jira/Teams integrations yet
- Local development currently supports one connected Gmail account

