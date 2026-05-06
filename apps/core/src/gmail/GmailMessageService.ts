import { google, type gmail_v1 } from "googleapis";
import { GmailAuthService } from "./GmailAuthService.js";
import { GmailAuthNotConnectedError } from "./GmailProfileService.js";
import type { GmailMessageMetadata } from "../models/gmailMessage.js";
import type {
  GmailTokenInput,
  GmailTokenStore,
  StoredGmailToken
} from "../storage/GmailTokenStore.js";

const messageFields = [
  "id",
  "threadId",
  "snippet",
  "labelIds",
  "internalDate",
  "payload(headers,filename,mimeType,body/attachmentId,parts(filename,mimeType,body/attachmentId,parts(filename,mimeType,body/attachmentId,parts(filename,mimeType,body/attachmentId))))"
].join(",");

const metadataHeaders = ["Subject", "From", "Date"];

export class GmailMessageService {
  constructor(
    private readonly gmailAuthService: GmailAuthService,
    private readonly gmailTokenStore: GmailTokenStore
  ) {}

  async listRecentMessages(limit: number): Promise<GmailMessageMetadata[]> {
    const storedToken = this.gmailTokenStore.getToken();

    if (!storedToken?.accessToken && !storedToken?.refreshToken) {
      throw new GmailAuthNotConnectedError(
        "Gmail is not connected. Complete OAuth before fetching recent messages."
      );
    }

    const client = this.gmailAuthService.createAuthorizedClient(storedToken);
    const gmail = google.gmail({ version: "v1", auth: client });
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

  private async getMessageMetadata(
    gmail: gmail_v1.Gmail,
    messageId: string
  ): Promise<GmailMessageMetadata> {
    const messageResponse = await gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "metadata",
      metadataHeaders,
      fields: messageFields
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
