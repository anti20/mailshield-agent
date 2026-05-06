import { google, type gmail_v1 } from "googleapis";
import { GmailAuthService } from "./GmailAuthService.js";
import { GmailAuthNotConnectedError } from "./GmailProfileService.js";
import type { GmailMessageMetadata } from "../models/gmailMessage.js";
import type { EmailAttachment, EmailLink, NormalizedEmail } from "../models/normalizedEmail.js";
import type {
  GmailTokenInput,
  GmailTokenStore,
  StoredGmailToken
} from "../storage/GmailTokenStore.js";

const recentMessageFields = [
  "id",
  "threadId",
  "snippet",
  "labelIds",
  "internalDate",
  "payload(headers,filename,mimeType,body/attachmentId,parts(filename,mimeType,body/attachmentId,parts(filename,mimeType,body/attachmentId,parts(filename,mimeType,body/attachmentId))))"
].join(",");

const normalizedMessageFields = [
  "id",
  "threadId",
  "internalDate",
  "payload(headers,mimeType,filename,body(data,size,attachmentId),parts(mimeType,filename,body(data,size,attachmentId),parts(mimeType,filename,body(data,size,attachmentId),parts(mimeType,filename,body(data,size,attachmentId)))))"
].join(",");

const metadataHeaders = ["Subject", "From", "Date", "Reply-To"];

export class GmailMessageNotFoundError extends Error {
  constructor(messageId: string) {
    super(`Gmail message not found for id: ${messageId}`);
    this.name = "GmailMessageNotFoundError";
  }
}

export class GmailMessageNormalizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GmailMessageNormalizationError";
  }
}

export class GmailMessageService {
  constructor(
    private readonly gmailAuthService: GmailAuthService,
    private readonly gmailTokenStore: GmailTokenStore
  ) {}

  async listRecentMessages(limit: number): Promise<GmailMessageMetadata[]> {
    const { client, gmail, storedToken } = this.createAuthorizedGmail();
    const listResponse = await gmail.users.messages.list({
      userId: "me",
      maxResults: limit
    });

    const messages = listResponse.data.messages ?? [];
    const items = await Promise.all(
      messages
        .filter((message): message is { id: string; threadId?: string } => Boolean(message.id))
        .map(async (message) => this.getMessageMetadata(gmail, message.id))
    );

    this.saveRefreshedTokenIfNeeded(storedToken, client.credentials);

    return items;
  }

  async getNormalizedMessage(messageId: string): Promise<NormalizedEmail> {
    const { client, gmail, storedToken } = this.createAuthorizedGmail();
    let message: gmail_v1.Schema$Message | undefined;

    try {
      const messageResponse = await gmail.users.messages.get({
        userId: "me",
        id: messageId,
        format: "full",
        fields: normalizedMessageFields
      });
      message = messageResponse.data;
    } catch (error) {
      if (readErrorStatus(error) === 404) {
        throw new GmailMessageNotFoundError(messageId);
      }

      throw error;
    }

    if (!message) {
      throw new GmailMessageNormalizationError(
        `Unable to normalize Gmail message ${messageId}: empty message response.`
      );
    }

    const headers = message.payload?.headers ?? [];
    const body = this.extractBodyAndAttachments(message.payload);
    const bodyText = joinBodyContent(body.textParts);
    const bodyHtml = joinBodyContent(body.htmlParts);

    this.saveRefreshedTokenIfNeeded(storedToken, client.credentials);

    const normalizedEmail: NormalizedEmail = {
      id: `email_${message.id ?? messageId}`,
      gmailMessageId: message.id ?? messageId,
      threadId: message.threadId ?? "",
      subject: this.readHeader(headers, "Subject") ?? "(No subject)",
      sender: this.readHeader(headers, "From") ?? "(Unknown sender)",
      replyTo: this.readHeader(headers, "Reply-To"),
      bodyText,
      bodyHtml,
      links: this.extractLinks(bodyText, bodyHtml),
      attachments: body.attachments,
      receivedAt: this.readReceivedAt(this.readHeader(headers, "Date"), message.internalDate)
    };

    if (!normalizedEmail.id || !normalizedEmail.gmailMessageId) {
      throw new GmailMessageNormalizationError(
        `Unable to normalize Gmail message ${messageId}: missing required identifiers.`
      );
    }

    return normalizedEmail;
  }

  private async getMessageMetadata(
    gmail: gmail_v1.Gmail,
    messageId: string
  ): Promise<GmailMessageMetadata> {
    const messageResponse = await gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "metadata",
      metadataHeaders,
      fields: recentMessageFields
    });
    const message = messageResponse.data;
    const headers = message.payload?.headers ?? [];
    const receivedAt = this.readReceivedAt(
      this.readHeader(headers, "Date"),
      message.internalDate
    );

    return {
      id: message.id ?? messageId,
      threadId: message.threadId ?? "",
      subject: this.readHeader(headers, "Subject") ?? "(No subject)",
      sender: this.readHeader(headers, "From") ?? "(Unknown sender)",
      snippet: message.snippet ?? "",
      receivedAt,
      labelIds: message.labelIds ?? [],
      hasAttachments: this.hasAttachment(message.payload)
    };
  }

  private readHeader(
    headers: gmail_v1.Schema$MessagePartHeader[],
    name: string
  ): string | undefined {
    return (
      headers.find((header) => header.name?.toLowerCase() === name.toLowerCase())?.value ??
      undefined
    );
  }

  private readInternalDate(internalDate?: string | null): string {
    if (!internalDate) {
      return new Date(0).toISOString();
    }

    const timestamp = Number(internalDate);
    return Number.isFinite(timestamp)
      ? new Date(timestamp).toISOString()
      : new Date(0).toISOString();
  }

  private readReceivedAt(dateHeader: string | undefined, internalDate?: string | null): string {
    if (dateHeader) {
      const parsedDate = new Date(dateHeader);

      if (!Number.isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString();
      }
    }

    return this.readInternalDate(internalDate);
  }

  private hasAttachment(part?: gmail_v1.Schema$MessagePart): boolean {
    if (!part) {
      return false;
    }

    if (part.filename || part.body?.attachmentId) {
      return true;
    }

    return (part.parts ?? []).some((childPart) => this.hasAttachment(childPart));
  }

  private createAuthorizedGmail(): {
    client: ReturnType<GmailAuthService["createAuthorizedClient"]>;
    gmail: gmail_v1.Gmail;
    storedToken: StoredGmailToken;
  } {
    const storedToken = this.gmailTokenStore.getToken();

    if (!storedToken?.accessToken && !storedToken?.refreshToken) {
      throw new GmailAuthNotConnectedError(
        "Gmail is not connected. Complete OAuth before fetching Gmail messages."
      );
    }

    const client = this.gmailAuthService.createAuthorizedClient(storedToken);
    const gmail = google.gmail({ version: "v1", auth: client });

    return { client, gmail, storedToken };
  }

  private extractBodyAndAttachments(part?: gmail_v1.Schema$MessagePart): {
    textParts: string[];
    htmlParts: string[];
    attachments: EmailAttachment[];
  } {
    const textParts: string[] = [];
    const htmlParts: string[] = [];
    const attachments: EmailAttachment[] = [];

    const walk = (currentPart?: gmail_v1.Schema$MessagePart): void => {
      if (!currentPart) {
        return;
      }

      const isAttachment = Boolean(currentPart.filename) || Boolean(currentPart.body?.attachmentId);

      if (isAttachment) {
        attachments.push({
          filename: currentPart.filename || "(unnamed attachment)",
          mimeType: currentPart.mimeType ?? undefined,
          sizeBytes: toSizeBytes(currentPart.body?.size)
        });
      } else {
        const decodedBody = decodeBodyData(currentPart.body?.data);
        const normalizedMimeType = currentPart.mimeType?.toLowerCase();

        if (decodedBody && normalizedMimeType?.startsWith("text/plain")) {
          textParts.push(decodedBody);
        } else if (decodedBody && normalizedMimeType?.startsWith("text/html")) {
          htmlParts.push(decodedBody);
        }
      }

      for (const childPart of currentPart.parts ?? []) {
        walk(childPart);
      }
    };

    walk(part);

    return {
      textParts,
      htmlParts,
      attachments
    };
  }

  private extractLinks(bodyText?: string, bodyHtml?: string): EmailLink[] {
    const byKey = new Map<string, EmailLink>();

    const addLink = (url: string, text?: string): void => {
      const normalizedUrl = normalizeDetectedUrl(url);

      if (!normalizedUrl) {
        return;
      }

      const normalizedText = text?.trim() || undefined;
      const key = `${normalizedUrl}::${normalizedText ?? ""}`;

      if (!byKey.has(key)) {
        byKey.set(key, {
          text: normalizedText,
          url: normalizedUrl
        });
      }
    };

    for (const link of parseAnchorLinks(bodyHtml)) {
      addLink(link.url, link.text);
    }

    for (const url of parseUrls(bodyText)) {
      addLink(url, url);
    }

    for (const url of parseUrls(stripHtml(bodyHtml))) {
      addLink(url, url);
    }

    return [...byKey.values()];
  }

  private saveRefreshedTokenIfNeeded(
    storedToken: StoredGmailToken,
    credentials: {
      access_token?: string | null;
      refresh_token?: string | null;
      scope?: string | null;
      token_type?: string | null;
      expiry_date?: number | null;
    }
  ): void {
    const refreshedToken: GmailTokenInput = {
      accessToken: credentials.access_token ?? undefined,
      refreshToken: credentials.refresh_token ?? undefined,
      scope: credentials.scope ?? undefined,
      tokenType: credentials.token_type ?? undefined,
      expiryDate: credentials.expiry_date ?? undefined
    };

    if (
      refreshedToken.accessToken !== storedToken.accessToken ||
      refreshedToken.refreshToken !== undefined ||
      refreshedToken.expiryDate !== storedToken.expiryDate ||
      refreshedToken.scope !== undefined ||
      refreshedToken.tokenType !== undefined
    ) {
      this.gmailTokenStore.saveToken(refreshedToken);
    }
  }
}

function decodeBodyData(data?: string | null): string | undefined {
  if (!data) {
    return undefined;
  }

  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");

  try {
    return Buffer.from(normalized, "base64").toString("utf8").trim();
  } catch {
    return undefined;
  }
}

function joinBodyContent(parts: string[]): string | undefined {
  const content = parts.map((part) => part.trim()).filter(Boolean).join("\n\n").trim();
  return content.length > 0 ? content : undefined;
}

function toSizeBytes(size?: number | null): number | undefined {
  return typeof size === "number" && Number.isFinite(size) ? size : undefined;
}

function parseAnchorLinks(bodyHtml?: string): EmailLink[] {
  if (!bodyHtml) {
    return [];
  }

  const links: EmailLink[] = [];
  const anchorRegex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gis;
  let match: RegExpExecArray | null = anchorRegex.exec(bodyHtml);

  while (match) {
    const href = match[1] ?? "";
    const text = stripHtml(match[2] ?? "").replace(/\s+/g, " ").trim() || undefined;

    links.push({
      text,
      url: href
    });

    match = anchorRegex.exec(bodyHtml);
  }

  return links;
}

function parseUrls(content?: string): string[] {
  if (!content) {
    return [];
  }

  const matches = content.match(/https?:\/\/[^\s<>"')\]]+/gi);
  return (matches ?? []).map((url) => normalizeDetectedUrl(url)).filter((url): url is string => Boolean(url));
}

function normalizeDetectedUrl(url: string): string | undefined {
  const cleaned = url.trim().replace(/[),.;!?]+$/g, "");

  try {
    const parsed = new URL(cleaned);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return undefined;
    }

    return parsed.toString();
  } catch {
    return undefined;
  }
}

function stripHtml(html?: string): string {
  if (!html) {
    return "";
  }

  return html.replace(/<[^>]*>/g, " ");
}

function readErrorStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  const maybeError = error as {
    status?: unknown;
    response?: { status?: unknown };
  };

  if (typeof maybeError.status === "number") {
    return maybeError.status;
  }

  if (typeof maybeError.response?.status === "number") {
    return maybeError.response.status;
  }

  return undefined;
}
