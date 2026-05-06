import { google } from "googleapis";
import type { StoredGmailToken } from "../storage/GmailTokenStore.js";

export type GmailAuthConfig = {
  clientId?: string;
  clientSecret?: string;
  redirectUri: string;
  scopes: string[];
};

export type GmailOAuthConfigStatus = {
  configured: boolean;
  missing: string[];
  redirectUriConfigured: boolean;
  scopesConfigured: boolean;
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

  getConfigStatus(): GmailOAuthConfigStatus {
    const missing: string[] = [];

    if (!this.config.clientId) {
      missing.push("GOOGLE_CLIENT_ID");
    }

    if (!this.config.clientSecret) {
      missing.push("GOOGLE_CLIENT_SECRET");
    }

    return {
      configured: missing.length === 0,
      missing,
      redirectUriConfigured: Boolean(this.config.redirectUri),
      scopesConfigured: this.config.scopes.length > 0
    };
  }

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
    const configStatus = this.getConfigStatus();

    if (!configStatus.configured) {
      throw new GmailAuthConfigurationError(
        `Missing Gmail OAuth credentials: ${configStatus.missing.join(", ")}. Add them to apps/core/.env.`
      );
    }

    if (!this.config.redirectUri) {
      throw new GmailAuthConfigurationError(
        "Missing GOOGLE_REDIRECT_URI. Add it to apps/core/.env before starting Gmail OAuth."
      );
    }

    if (this.config.scopes.length === 0) {
      throw new GmailAuthConfigurationError(
        "Missing GMAIL_SCOPES. Add at least one scope before starting Gmail OAuth."
      );
    }
  }

  private createStatePlaceholder(): string {
    return "gmail-oauth-development-state";
  }
}
