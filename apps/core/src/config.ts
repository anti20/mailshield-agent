import path from "node:path";
import { fileURLToPath } from "node:url";

const defaultPort = 3000;
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readPort(): number {
  const rawPort = process.env.PORT;

  if (!rawPort) {
    return defaultPort;
  }

  const port = Number(rawPort);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }

  return port;
}

export const config = {
  databasePath: path.join(projectRoot, "data", "mailshield.sqlite"),
  port: readPort()
};
