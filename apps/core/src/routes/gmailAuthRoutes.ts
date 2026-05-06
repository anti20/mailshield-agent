import { Router } from "express";
import {
  GmailAuthConfigurationError,
  GmailAuthRequestError,
  type GmailAuthService
} from "../gmail/GmailAuthService.js";
import {
  GmailAuthNotConnectedError,
  type GmailProfileService
} from "../gmail/GmailProfileService.js";
import type { GmailTokenStore, StoredGmailToken } from "../storage/GmailTokenStore.js";

export function gmailAuthRoutes(
  gmailAuthService: GmailAuthService,
  gmailTokenStore: GmailTokenStore,
  gmailProfileService: GmailProfileService
): Router {
  const router = Router();

  router.get("/auth/gmail/config-status", (_request, response, next) => {
    try {
      const configStatus = gmailAuthService.getConfigStatus();

      response.json({
        provider: "gmail",
        configured: configStatus.configured,
        missing: configStatus.missing,
        redirectUriConfigured: configStatus.redirectUriConfigured,
        scopesConfigured: configStatus.scopesConfigured
      });
    } catch (error) {
      handleGmailAuthError(error, response, next);
    }
  });

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
      const token = await gmailAuthService.exchangeCodeForTokens(code);
      const storedToken = gmailTokenStore.saveToken(token);
      const tokenMetadata = gmailAuthService.toSafeTokenMetadata(storedToken);

      response.json({
        status: "connected",
        provider: "gmail",
        scope: tokenMetadata.scope,
        hasAccessToken: tokenMetadata.hasAccessToken,
        hasRefreshToken: tokenMetadata.hasRefreshToken
      });
    } catch (error) {
      handleGmailAuthError(error, response, next);
    }
  });

  router.get("/auth/gmail/status", (_request, response, next) => {
    try {
      const storedToken = gmailTokenStore.getToken();

      if (!storedToken?.accessToken && !storedToken?.refreshToken) {
        response.json({
          connected: false,
          provider: "gmail"
        });
        return;
      }

      response.json(toStatusResponse(storedToken));
    } catch (error) {
      handleGmailAuthError(error, response, next);
    }
  });

  router.get("/auth/gmail/profile", async (_request, response, next) => {
    try {
      assertGmailOAuthConfigured(gmailAuthService);
      response.json(await gmailProfileService.getProfile());
    } catch (error) {
      handleGmailAuthError(error, response, next);
    }
  });

  return router;
}

function readCode(code: unknown): string {
  if (typeof code !== "string" || code.length === 0) {
    throw new GmailAuthRequestError("Missing OAuth authorization code.");
  }

  return code;
}

function toStatusResponse(storedToken: StoredGmailToken) {
  return {
    connected: true,
    provider: "gmail",
    scope: storedToken.scope,
    expiresAt: storedToken.expiryDate ? new Date(storedToken.expiryDate).toISOString() : undefined
  };
}

function assertGmailOAuthConfigured(gmailAuthService: GmailAuthService): void {
  const configStatus = gmailAuthService.getConfigStatus();

  if (!configStatus.configured) {
    throw new GmailAuthConfigurationError(
      `Missing Gmail OAuth credentials: ${configStatus.missing.join(", ")}. Add them to apps/core/.env.`
    );
  }
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

  if (error instanceof GmailAuthRequestError) {
    response.status(400).json({
      error: error.message
    });
    return;
  }

  if (error instanceof GmailAuthNotConnectedError) {
    response.status(401).json({
      error: error.message
    });
    return;
  }

  next(error);
}
