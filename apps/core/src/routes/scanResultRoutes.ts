import { Router } from "express";
import { mockScanResults } from "../data/mockScanResults.js";
import type { ScanResultsResponse } from "../models/scanResult.js";

export const scanResultRoutes = Router();

scanResultRoutes.get("/scan-results", (_request, response) => {
  const body: ScanResultsResponse = {
    items: mockScanResults
  };

  response.json(body);
});
