import { google } from "googleapis";

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

export class GmailAuthConfigurationError extends Error {
  constructor(message = "Missing Gmail OAuth configuration.") {
    super(message);
    this.name = "GmailAuthConfigurationError";
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

  async exchangeCodeForTokenMetadata(code: string): Promise<GmailTokenMetadata> {
    const client = this.createClient();
    const { tokens } = await client.getToken(code);

    return {
      hasAccessToken: Boolean(tokens.access_token),
      hasRefreshToken: Boolean(tokens.refresh_token),
      expiryDate: tokens.expiry_date ?? undefined,
      scope: tokens.scope ?? undefined,
      tokenType: tokens.token_type ?? undefined
    };
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
