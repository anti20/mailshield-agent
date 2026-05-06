import { Router } from "express";
import {
  McpToolInputError,
  McpToolNotFoundError,
  type McpToolService
} from "../mcp/McpToolService.js";
import {
  GmailMessageNormalizationError,
  GmailMessageNotFoundError
} from "../gmail/GmailMessageService.js";
import { GmailAuthNotConnectedError } from "../gmail/GmailProfileService.js";

type InvokeRequestBody = {
  input?: unknown;
};

export function mcpToolRoutes(mcpToolService: McpToolService): Router {
  const router = Router();

  router.get("/mcp/tools", (_request, response, next) => {
    try {
      response.json({ items: mcpToolService.listTools() });
    } catch (error) {
      next(error);
    }
  });

  router.post("/mcp/tools/:name/invoke", async (request, response, next) => {
    try {
      if (!isLocalRequest(request.ip)) {
        response.status(403).json({
          error: "MCP tool endpoint is local-only."
        });
        return;
      }

      const toolName = readToolName(request.params.name);
      const body = (request.body ?? {}) as InvokeRequestBody;
      const result = await mcpToolService.invokeTool(toolName, body.input ?? {});
      response.json({ result });
    } catch (error) {
      if (error instanceof McpToolNotFoundError) {
        response.status(404).json({ error: error.message });
        return;
      }

      if (error instanceof McpToolInputError) {
        response.status(400).json({ error: error.message });
        return;
      }

      if (error instanceof GmailAuthNotConnectedError) {
        response.status(401).json({ error: error.message });
        return;
      }

      if (error instanceof GmailMessageNotFoundError) {
        response.status(404).json({ error: error.message });
        return;
      }

      if (error instanceof GmailMessageNormalizationError) {
        response.status(422).json({ error: error.message });
        return;
      }

      next(error);
    }
  });

  return router;
}

function readToolName(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new McpToolInputError("Tool name must be a non-empty string.");
  }

  return value.trim();
}

function isLocalRequest(requestIp?: string): boolean {
  if (!requestIp) {
    return false;
  }

  return requestIp === "127.0.0.1" || requestIp === "::1" || requestIp.endsWith("127.0.0.1");
}
