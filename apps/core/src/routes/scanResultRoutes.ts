import { Router } from "express";
import type { ScanResultsResponse } from "../models/scanResult.js";
import type { ScanStore } from "../storage/ScanStore.js";

export function scanResultRoutes(scanStore: ScanStore): Router {
  const router = Router();

  router.get("/scan-results", (_request, response, next) => {
    try {
      const body: ScanResultsResponse = {
        items: scanStore.listScanResults()
      };

      response.json(body);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
