import { createApp } from "./app.js";
import { config } from "./config.js";
import { mockScanResults } from "./data/mockScanResults.js";
import { openDatabase } from "./db/database.js";
import { ScanStore } from "./storage/ScanStore.js";

try {
  const database = openDatabase(config.databasePath);
  const scanStore = new ScanStore(database);
  scanStore.initialize(mockScanResults);

  const app = createApp(scanStore);

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
