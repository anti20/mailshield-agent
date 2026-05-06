import { Router } from "express";
import {
  GmailMessageNormalizationError,
  GmailMessageNotFoundError
} from "../gmail/GmailMessageService.js";
import { GmailAuthNotConnectedError } from "../gmail/GmailProfileService.js";
import {
  OpenAIConfigurationError,
  OpenAIRateLimitError
} from "../services/GmailAgentScanService.js";
import type { GmailMessageService } from "../gmail/GmailMessageService.js";
import type { GmailAgentScanService } from "../services/GmailAgentScanService.js";
import type { GmailStaticScanService } from "../services/GmailStaticScanService.js";

const defaultLimit = 10;
const maxLimit = 25;

class GmailMessageRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GmailMessageRequestError";
  }
}

export function gmailMessageRoutes(
  gmailMessageService: GmailMessageService,
  gmailStaticScanService: GmailStaticScanService,
  gmailAgentScanService: GmailAgentScanService
): Router {
  const router = Router();

  router.get("/gmail/messages/recent", async (request, response, next) => {
    try {
      const limit = readLimit(request.query.limit);
      const items = await gmailMessageService.listRecentMessages(limit);

      response.json({ items });
    } catch (error) {
      handleGmailMessageError(error, response, next);
    }
  });

  router.get("/gmail/messages/:id/normalized", async (request, response, next) => {
    try {
      const messageId = readMessageId(request.params.id);
      const item = await gmailMessageService.getNormalizedMessage(messageId);

      response.json({ item });
    } catch (error) {
      handleGmailMessageError(error, response, next);
    }
  });

  router.get("/gmail/messages/:id/static-scan", async (request, response, next) => {
    try {
      const messageId = readMessageId(request.params.id);
      const result = await gmailStaticScanService.scanMessage(messageId);

      response.json(result);
    } catch (error) {
      handleGmailMessageError(error, response, next);
    }
  });

  router.post("/gmail/messages/:id/agent-scan", async (request, response, next) => {
    try {
      const messageId = readMessageId(request.params.id);
      const result = await gmailAgentScanService.scanMessage(messageId);

      response.json(result);
    } catch (error) {
      handleGmailMessageError(error, response, next);
    }
  });

  router.get("/gmail/messages/:id/agent-scan", async (request, response, next) => {
    try {
      const messageId = readMessageId(request.params.id);
      const result = await gmailAgentScanService.scanMessage(messageId);

      response.json(result);
    } catch (error) {
      handleGmailMessageError(error, response, next);
    }
  });

  return router;
}

function readLimit(limit: unknown): number {
  if (limit === undefined) {
    return defaultLimit;
  }

  if (typeof limit !== "string" || limit.trim().length === 0) {
    throw new GmailMessageRequestError("limit must be a number between 1 and 25.");
  }

  const parsedLimit = Number(limit);

  if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
    throw new GmailMessageRequestError("limit must be a number between 1 and 25.");
  }

  return Math.min(parsedLimit, maxLimit);
}

function readMessageId(messageId: unknown): string {
  if (typeof messageId !== "string" || messageId.trim().length === 0) {
    throw new GmailMessageRequestError("message id must be a non-empty string.");
  }

  return messageId.trim();
}

function handleGmailMessageError(
  error: unknown,
  response: { status: (statusCode: number) => { json: (body: unknown) => void } },
  next: (error: unknown) => void
): void {
  if (error instanceof GmailAuthNotConnectedError) {
    response.status(401).json({
      error: error.message
    });
    return;
  }

  if (error instanceof GmailMessageRequestError) {
    response.status(400).json({
      error: error.message
    });
    return;
  }

  if (error instanceof GmailMessageNotFoundError) {
    response.status(404).json({
      error: error.message
    });
    return;
  }

  if (error instanceof GmailMessageNormalizationError) {
    response.status(422).json({
      error: error.message
    });
    return;
  }

  if (error instanceof OpenAIConfigurationError) {
    response.status(400).json({
      error: error.message
    });
    return;
  }

  if (error instanceof OpenAIRateLimitError) {
    response.status(429).json({
      error: error.message
    });
    return;
  }

  next(error);
}
