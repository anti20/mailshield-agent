import express, { type NextFunction, type Request, type Response } from "express";
import { gmailAuthRoutes } from "./routes/gmailAuthRoutes.js";
import { healthRoutes } from "./routes/healthRoutes.js";
import { scanPreviewRoutes } from "./routes/scanPreviewRoutes.js";
import { scanResultRoutes } from "./routes/scanResultRoutes.js";
import type { GmailAuthService } from "./gmail/GmailAuthService.js";
import type { GmailProfileService } from "./gmail/GmailProfileService.js";
import type { ScanPipeline } from "./services/ScanPipeline.js";
import type { GmailTokenStore } from "./storage/GmailTokenStore.js";
import type { ScanStore } from "./storage/ScanStore.js";

export function createApp(
  scanStore: ScanStore,
  scanPipeline: ScanPipeline,
  gmailAuthService: GmailAuthService,
  gmailTokenStore: GmailTokenStore,
  gmailProfileService: GmailProfileService
) {
  const app = express();

  app.use(express.json());
  app.use(healthRoutes);
  app.use(scanResultRoutes(scanStore));
  app.use(scanPreviewRoutes(scanPipeline));
  app.use(gmailAuthRoutes(gmailAuthService, gmailTokenStore, gmailProfileService));
  app.use(handleError);

  return app;
}

function handleError(
  error: Error,
  _request: Request,
  response: Response,
  _next: NextFunction
) {
  console.error(error);
  response.status(500).json({
    error: "Internal server error"
  });
}
