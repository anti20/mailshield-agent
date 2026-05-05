import express from "express";
import { healthRoutes } from "./routes/healthRoutes.js";
import { scanResultRoutes } from "./routes/scanResultRoutes.js";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(healthRoutes);
  app.use(scanResultRoutes);

  return app;
}
