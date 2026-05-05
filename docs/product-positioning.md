# Product Positioning

## What MailShield Agent Does

MailShield Agent is planned as a local-first macOS assistant for monitoring Gmail messages for suspicious content. It will help surface risky email, summarize why a message looks suspicious, and keep a local history of scan results.

## How It Is Planned To Work

The app will start as a native macOS menu bar client. A later local backend will connect to Gmail, run scan workflows, coordinate threat analysis through the OpenAI Agents SDK, and store scan history locally.

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

This step only creates the native macOS UI shell. It uses placeholder data and does not connect to Gmail, a backend service, OpenAI, MCP, notifications, or a database yet.
