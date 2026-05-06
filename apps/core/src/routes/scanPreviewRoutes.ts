import { Router } from "express";
import { mockEmails } from "../data/mockEmails.js";
import type { ScanPipeline } from "../services/ScanPipeline.js";

export function scanPreviewRoutes(scanPipeline: ScanPipeline): Router {
  const router = Router();

  router.get("/scan-preview", (_request, response, next) => {
    try {
      response.json({
        items: scanPipeline.previewEmails(mockEmails)
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
