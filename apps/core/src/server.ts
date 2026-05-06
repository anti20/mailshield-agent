import { createApp } from "./app.js";
import { config } from "./config.js";
import { mockScanResults } from "./data/mockScanResults.js";
import { openDatabase } from "./db/database.js";
import { GmailAuthService } from "./gmail/GmailAuthService.js";
import { GmailMessageService } from "./gmail/GmailMessageService.js";
import { GmailProfileService } from "./gmail/GmailProfileService.js";
import { GmailStaticScanService } from "./services/GmailStaticScanService.js";
import { ScanPipeline } from "./services/ScanPipeline.js";
import { GmailTokenStore } from "./storage/GmailTokenStore.js";
import { ScanStore } from "./storage/ScanStore.js";

try {
  const database = openDatabase(config.databasePath);
  const scanStore = new ScanStore(database);
  const gmailTokenStore = new GmailTokenStore(database);
  const scanPipeline = new ScanPipeline();
  const gmailAuthService = new GmailAuthService(config.gmail);
  const gmailProfileService = new GmailProfileService(gmailAuthService, gmailTokenStore);
  const gmailMessageService = new GmailMessageService(gmailAuthService, gmailTokenStore);
  const gmailStaticScanService = new GmailStaticScanService(gmailMessageService, scanPipeline);
  scanStore.initialize(mockScanResults);
  gmailTokenStore.initialize();

  const app = createApp(
    scanStore,
    scanPipeline,
    gmailAuthService,
    gmailTokenStore,
    gmailProfileService,
    gmailMessageService,
    gmailStaticScanService
  );

  const server = app.listen(config.port, () => {
    console.log(`mailshield-core listening on port ${config.port}`);
  });

  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${config.port} is already in use.`);
    } else {
      console.error("Failed to start mailshield-core.", error);
    }

    process.exit(1);
  });
} catch (error) {
  console.error("Failed to initialize mailshield-core.", error);
  process.exit(1);
}
