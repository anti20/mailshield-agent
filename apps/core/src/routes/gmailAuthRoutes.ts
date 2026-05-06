import { Router } from "express";
import {
  GmailAuthConfigurationError,
  type GmailAuthService
} from "../gmail/GmailAuthService.js";

export function gmailAuthRoutes(gmailAuthService: GmailAuthService): Router {
  const router = Router();

  router.get("/auth/gmail/start", (_request, response, next) => {
    try {
      response.redirect(gmailAuthService.buildAuthorizationUrl());
    } catch (error) {
      handleGmailAuthError(error, response, next);
    }
  });

  router.get("/auth/gmail/callback", async (request, response, next) => {
    try {
      const code = readCode(request.query.code);
      const tokenMetadata = await gmailAuthService.exchangeCodeForTokenMetadata(code);

      response.json({
        status: "ok",
        message: "Gmail OAuth callback received. Token persistence is not implemented yet.",
        tokenMetadata
      });
    } catch (error) {
      handleGmailAuthError(error, response, next);
    }
  });

  return router;
}

function readCode(code: unknown): string {
  if (typeof code !== "string" || code.length === 0) {
    throw new GmailAuthConfigurationError("Missing OAuth authorization code.");
  }

  return code;
}

function handleGmailAuthError(
  error: unknown,
  response: { status: (statusCode: number) => { json: (body: unknown) => void } },
  next: (error: unknown) => void
): void {
  if (error instanceof GmailAuthConfigurationError) {
    response.status(400).json({
      error: error.message
    });
    return;
  }

  next(error);
}
