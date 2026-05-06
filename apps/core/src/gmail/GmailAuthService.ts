import { google } from "googleapis";
import type { StoredGmailToken } from "../storage/GmailTokenStore.js";

export type GmailAuthConfig = {
  clientId?: string;
  clientSecret?: string;
  redirectUri: string;
  scopes: string[];
};

export type GmailTokenMetadata = {
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
  expiryDate?: number;
  scope?: string;
  tokenType?: string;
};

export type GmailOAuthToken = {
  accessToken?: string;
  refreshToken?: string;
  expiryDate?: number;
  scope?: string;
  tokenType?: string;
};

export class GmailAuthConfigurationError extends Error {
  constructor(message = "Missing Gmail OAuth configuration.") {
    super(message);
    this.name = "GmailAuthConfigurationError";
  }
}

export class GmailAuthRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GmailAuthRequestError";
  }
}

export class GmailAuthService {
  constructor(private readonly config: GmailAuthConfig) {}

  buildAuthorizationUrl(): string {
    const client = this.createClient();

    return client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: this.config.scopes,
      state: this.createStatePlaceholder()
    });
  }

  async exchangeCodeForTokens(code: string): Promise<GmailOAuthToken> {
    const client = this.createClient();
    const { tokens } = await client.getToken(code);

    return {
      accessToken: tokens.access_token ?? undefined,
      refreshToken: tokens.refresh_token ?? undefined,
      expiryDate: tokens.expiry_date ?? undefined,
      scope: tokens.scope ?? undefined,
      tokenType: tokens.token_type ?? undefined
    };
  }

  toSafeTokenMetadata(token: GmailOAuthToken | StoredGmailToken): GmailTokenMetadata {
    return {
      hasAccessToken: Boolean(token.accessToken),
      hasRefreshToken: Boolean(token.refreshToken),
      expiryDate: token.expiryDate,
      scope: token.scope,
      tokenType: token.tokenType
    };
  }

  createAuthorizedClient(token: StoredGmailToken) {
    const client = this.createClient();

    client.setCredentials({
      access_token: token.accessToken,
      refresh_token: token.refreshToken,
      expiry_date: token.expiryDate,
      scope: token.scope,
      token_type: token.tokenType
    });

    return client;
  }

  private createClient() {
    this.assertConfigured();

    return new google.auth.OAuth2(
      this.config.clientId,
      this.config.clientSecret,
      this.config.redirectUri
    );
  }

  private assertConfigured(): void {
    if (!this.config.clientId || !this.config.clientSecret || !this.config.redirectUri) {
      throw new GmailAuthConfigurationError(
        "Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI before starting Gmail OAuth."
      );
    }

    if (this.config.scopes.length === 0) {
      throw new GmailAuthConfigurationError("Set GMAIL_SCOPES before starting Gmail OAuth.");
    }
  }

  private createStatePlaceholder(): string {
    return "gmail-oauth-development-state";
  }
}
