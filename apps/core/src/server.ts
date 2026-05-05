import { createApp } from "./app.js";
import { config } from "./config.js";

const app = createApp();

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
