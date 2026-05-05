import express from "express";
import { healthRoutes } from "./routes/healthRoutes.js";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(healthRoutes);

  return app;
}
