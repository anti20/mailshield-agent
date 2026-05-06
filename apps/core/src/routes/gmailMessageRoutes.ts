import { Router } from "express";
import { GmailAuthNotConnectedError } from "../gmail/GmailProfileService.js";
import type { GmailMessageService } from "../gmail/GmailMessageService.js";

const defaultLimit = 10;
const maxLimit = 25;

class GmailMessageRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GmailMessageRequestError";
  }
}

export function gmailMessageRoutes(gmailMessageService: GmailMessageService): Router {
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

  next(error);
}
