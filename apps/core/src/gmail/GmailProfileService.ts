import { google } from "googleapis";
import { GmailAuthService } from "./GmailAuthService.js";
import type { GmailTokenInput, GmailTokenStore, StoredGmailToken } from "../storage/GmailTokenStore.js";

export type GmailProfile = {
  emailAddress?: string;
  messagesTotal?: number;
  threadsTotal?: number;
  historyId?: string;
};

export class GmailAuthNotConnectedError extends Error {
  constructor(message = "Gmail is not connected. Complete OAuth before testing the profile endpoint.") {
    super(message);
    this.name = "GmailAuthNotConnectedError";
  }
}

export class GmailProfileService {
  constructor(
    private readonly gmailAuthService: GmailAuthService,
    private readonly gmailTokenStore: GmailTokenStore
  ) {}

  async getProfile(): Promise<GmailProfile> {
    const storedToken = this.gmailTokenStore.getToken();

    if (!storedToken?.accessToken && !storedToken?.refreshToken) {
      throw new GmailAuthNotConnectedError();
    }

    const client = this.gmailAuthService.createAuthorizedClient(storedToken);
    const gmail = google.gmail({ version: "v1", auth: client });
    const profileResponse = await gmail.users.getProfile({ userId: "me" });

    this.saveRefreshedTokenIfNeeded(storedToken, client.credentials);

    return {
      emailAddress: profileResponse.data.emailAddress ?? undefined,
      messagesTotal: profileResponse.data.messagesTotal ?? undefined,
      threadsTotal: profileResponse.data.threadsTotal ?? undefined,
      historyId: profileResponse.data.historyId ?? undefined
    };
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
