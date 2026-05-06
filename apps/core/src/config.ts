import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const defaultPort = 3000;
const coreRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({
  path: path.join(coreRoot, ".env"),
  quiet: true
});

const projectRoot = coreRoot;
const defaultGoogleRedirectUri = "http://localhost:3000/auth/gmail/callback";
const defaultGmailScopes = ["https://www.googleapis.com/auth/gmail.readonly"];

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

function readScopes(): string[] {
  const rawScopes = process.env.GMAIL_SCOPES;

  if (!rawScopes) {
    return defaultGmailScopes;
  }

  return rawScopes
    .split(/[,\s]+/)
    .map((scope) => scope.trim())
    .filter(Boolean);
}

export const config = {
  databasePath: path.join(projectRoot, "data", "mailshield.sqlite"),
  gmail: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI ?? defaultGoogleRedirectUri,
    scopes: readScopes()
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini"
  },
  port: readPort()
};
