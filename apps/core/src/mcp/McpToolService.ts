import { z } from "zod";
import type { GmailMessageService } from "../gmail/GmailMessageService.js";
import type { NormalizedEmail } from "../models/normalizedEmail.js";
import type { EmailScanResult } from "../models/scanResult.js";
import type { ScanPipeline } from "../services/ScanPipeline.js";
import type { ScanStore } from "../storage/ScanStore.js";

const recentMessagesInputSchema = z.object({
  limit: z.number().int().min(1).max(25).optional()
});

const normalizedMessageInputSchema = z.object({
  messageId: z.string().trim().min(1)
});

const runStaticThreatScanInputSchema = z.object({
  email: z.object({
    id: z.string(),
    gmailMessageId: z.string().optional(),
    threadId: z.string().optional(),
    subject: z.string(),
    sender: z.string(),
    replyTo: z.string().optional(),
    bodyText: z.string().optional(),
    bodyHtml: z.string().optional(),
    links: z.array(
      z.object({
        text: z.string().optional(),
        url: z.string().url()
      })
    ),
    attachments: z.array(
      z.object({
        filename: z.string(),
        mimeType: z.string().optional(),
        sizeBytes: z.number().int().nonnegative().optional()
      })
    ),
    receivedAt: z.string()
  })
});

const emptyInputSchema = z.object({}).strict();

export type McpToolDefinition = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
};

export class McpToolNotFoundError extends Error {
  constructor(toolName: string) {
    super(`MCP tool not found: ${toolName}`);
    this.name = "McpToolNotFoundError";
  }
}

export class McpToolInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "McpToolInputError";
  }
}

type ToolHandler = (input: unknown) => Promise<unknown>;

type Tool = {
  definition: McpToolDefinition;
  handler: ToolHandler;
};

export class McpToolService {
  private readonly tools: Map<string, Tool>;

  constructor(
    private readonly gmailMessageService: GmailMessageService,
    private readonly scanPipeline: ScanPipeline,
    private readonly scanStore: ScanStore
  ) {
    this.tools = new Map<string, Tool>([
      ["gmail.getRecentMessages", this.buildGetRecentMessagesTool()],
      ["gmail.getNormalizedMessage", this.buildGetNormalizedMessageTool()],
      ["scan.runStaticThreatScan", this.buildRunStaticThreatScanTool()],
      ["scan.getHistory", this.buildGetHistoryTool()]
    ]);
  }

  listTools(): McpToolDefinition[] {
    return [...this.tools.values()].map((tool) => tool.definition);
  }

  async invokeTool(toolName: string, input: unknown): Promise<unknown> {
    const tool = this.tools.get(toolName);

    if (!tool) {
      throw new McpToolNotFoundError(toolName);
    }

    return tool.handler(input ?? {});
  }

  private buildGetRecentMessagesTool(): Tool {
    return {
      definition: {
        name: "gmail.getRecentMessages",
        description:
          "Returns recent Gmail message metadata from the connected account using the stored OAuth token.",
        inputSchema: {
          type: "object",
          properties: {
            limit: { type: "integer", minimum: 1, maximum: 25, default: 10 }
          },
          additionalProperties: false
        },
        outputSchema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  threadId: { type: "string" },
                  subject: { type: "string" },
                  sender: { type: "string" },
                  snippet: { type: "string" },
                  receivedAt: { type: "string" },
                  labelIds: { type: "array", items: { type: "string" } },
                  hasAttachments: { type: "boolean" }
                },
                required: [
                  "id",
                  "threadId",
                  "subject",
                  "sender",
                  "snippet",
                  "receivedAt",
                  "labelIds",
                  "hasAttachments"
                ]
              }
            }
          },
          required: ["items"]
        }
      },
      handler: async (input) => {
        const parsed = recentMessagesInputSchema.safeParse(input);

        if (!parsed.success) {
          throw new McpToolInputError("gmail.getRecentMessages requires limit between 1 and 25.");
        }

        const items = await this.gmailMessageService.listRecentMessages(parsed.data.limit ?? 10);
        return { items };
      }
    };
  }

  private buildGetNormalizedMessageTool(): Tool {
    return {
      definition: {
        name: "gmail.getNormalizedMessage",
        description:
          "Fetches one Gmail message by id from the connected account and returns the existing NormalizedEmail shape.",
        inputSchema: {
          type: "object",
          properties: {
            messageId: { type: "string", minLength: 1 }
          },
          required: ["messageId"],
          additionalProperties: false
        },
        outputSchema: {
          type: "object",
          properties: {
            item: { type: "object" }
          },
          required: ["item"]
        }
      },
      handler: async (input) => {
        const parsed = normalizedMessageInputSchema.safeParse(input);

        if (!parsed.success) {
          throw new McpToolInputError("gmail.getNormalizedMessage requires a non-empty messageId.");
        }

        const item = await this.gmailMessageService.getNormalizedMessage(parsed.data.messageId);
        return { item };
      }
    };
  }

  private buildRunStaticThreatScanTool(): Tool {
    return {
      definition: {
        name: "scan.runStaticThreatScan",
        description: "Runs StaticThreatAgent checks on a NormalizedEmail input.",
        inputSchema: {
          type: "object",
          properties: {
            email: { type: "object" }
          },
          required: ["email"],
          additionalProperties: false
        },
        outputSchema: {
          type: "object",
          properties: {
            checks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  agentName: { type: "string" },
                  title: { type: "string" },
                  status: { type: "string", enum: ["passed", "warning", "failed"] },
                  reason: { type: "string" },
                  evidence: { type: "string" }
                },
                required: ["id", "agentName", "title", "status", "reason"]
              }
            }
          },
          required: ["checks"]
        }
      },
      handler: async (input) => {
        const parsed = runStaticThreatScanInputSchema.safeParse(input);

        if (!parsed.success) {
          throw new McpToolInputError("scan.runStaticThreatScan requires a valid NormalizedEmail input.");
        }

        const checks = this.scanPipeline.scanEmail(parsed.data.email as NormalizedEmail);
        return { checks };
      }
    };
  }

  private buildGetHistoryTool(): Tool {
    return {
      definition: {
        name: "scan.getHistory",
        description: "Returns persisted scan results from local SQLite history.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false
        },
        outputSchema: {
          type: "object",
          properties: {
            items: { type: "array", items: { type: "object" } }
          },
          required: ["items"]
        }
      },
      handler: async (input) => {
        const parsed = emptyInputSchema.safeParse(input);

        if (!parsed.success) {
          throw new McpToolInputError("scan.getHistory does not take input fields.");
        }

        return {
          items: this.scanStore.listScanResults() as EmailScanResult[]
        };
      }
    };
  }
}
