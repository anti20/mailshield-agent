const defaultPort = 3000;

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
  port: readPort()
};
