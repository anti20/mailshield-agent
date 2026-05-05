import { Router } from "express";

export const healthRoutes = Router();

healthRoutes.get("/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "mailshield-core"
  });
});
