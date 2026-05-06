import express, { type NextFunction, type Request, type Response } from "express";
import { gmailAuthRoutes } from "./routes/gmailAuthRoutes.js";
import { gmailMessageRoutes } from "./routes/gmailMessageRoutes.js";
import { healthRoutes } from "./routes/healthRoutes.js";
import { mcpToolRoutes } from "./routes/mcpToolRoutes.js";
import { scanPreviewRoutes } from "./routes/scanPreviewRoutes.js";
import { scanResultRoutes } from "./routes/scanResultRoutes.js";
import type { GmailAuthService } from "./gmail/GmailAuthService.js";
import type { GmailMessageService } from "./gmail/GmailMessageService.js";
import type { GmailProfileService } from "./gmail/GmailProfileService.js";
import type { McpToolService } from "./mcp/McpToolService.js";
import type { GmailAgentScanService } from "./services/GmailAgentScanService.js";
import type { GmailStaticScanService } from "./services/GmailStaticScanService.js";
import type { ScanPipeline } from "./services/ScanPipeline.js";
import type { GmailTokenStore } from "./storage/GmailTokenStore.js";
import type { ScanStore } from "./storage/ScanStore.js";

export function createApp(
  scanStore: ScanStore,
  scanPipeline: ScanPipeline,
  gmailAuthService: GmailAuthService,
  gmailTokenStore: GmailTokenStore,
  gmailProfileService: GmailProfileService,
  gmailMessageService: GmailMessageService,
  mcpToolService: McpToolService,
  gmailStaticScanService: GmailStaticScanService,
  gmailAgentScanService: GmailAgentScanService
) {
  const app = express();

  app.use(express.json());
  app.use(healthRoutes);
  app.use(scanResultRoutes(scanStore));
  app.use(scanPreviewRoutes(scanPipeline));
  app.use(gmailAuthRoutes(gmailAuthService, gmailTokenStore, gmailProfileService));
  app.use(gmailMessageRoutes(gmailMessageService, gmailStaticScanService, gmailAgentScanService));
  app.use(mcpToolRoutes(mcpToolService));
  app.use(handleError);

  return app;
}

function handleError(
  error: Error,
  _request: Request,
  response: Response,
  _next: NextFunction
) {
  const message = sanitizeLogMessage(error.message ?? "Unknown error");
  console.error(`Request failed: ${message}`);
  response.status(500).json({
    error: "Internal server error"
  });
}

function sanitizeLogMessage(message: string): string {
  return message
    .replace(/(access[_-]?token=)[^&\s]+/gi, "$1[redacted]")
    .replace(/(refresh[_-]?token=)[^&\s]+/gi, "$1[redacted]")
    .replace(/(Bearer\s+)[A-Za-z0-9._-]+/gi, "$1[redacted]");
}
