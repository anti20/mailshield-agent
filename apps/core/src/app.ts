import express, { type NextFunction, type Request, type Response } from "express";
import { healthRoutes } from "./routes/healthRoutes.js";
import { scanResultRoutes } from "./routes/scanResultRoutes.js";
import type { ScanStore } from "./storage/ScanStore.js";

export function createApp(scanStore: ScanStore) {
  const app = express();

  app.use(express.json());
  app.use(healthRoutes);
  app.use(scanResultRoutes(scanStore));
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
