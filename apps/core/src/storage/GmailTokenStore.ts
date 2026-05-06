import type Database from "better-sqlite3";
import { initializeSchema } from "../db/schema.js";

export type StoredGmailToken = {
  id: string;
  providerAccount: string;
  accessToken?: string;
  refreshToken?: string;
  scope?: string;
  tokenType?: string;
  expiryDate?: number;
  createdAt: string;
  updatedAt: string;
};

type GmailTokenRow = {
  id: string;
  providerAccount: string;
  accessToken: string | null;
  refreshToken: string | null;
  scope: string | null;
  tokenType: string | null;
  expiryDate: number | null;
  createdAt: string;
  updatedAt: string;
};

export type GmailTokenInput = {
  accessToken?: string;
  refreshToken?: string;
  scope?: string;
  tokenType?: string;
  expiryDate?: number;
};

const defaultProviderAccount = "gmail-local";
const defaultTokenId = "gmail-local-token";

export class GmailTokenStore {
  constructor(private readonly database: Database.Database) {}

  initialize(): void {
    try {
      initializeSchema(this.database);
    } catch (error) {
      throw new Error("Failed to initialize Gmail token storage.", {
        cause: error
      });
    }
  }

  getToken(providerAccount = defaultProviderAccount): StoredGmailToken | undefined {
    const row = this.database
      .prepare(
        `
          SELECT
            id,
            providerAccount,
            accessToken,
            refreshToken,
            scope,
            tokenType,
            expiryDate,
            createdAt,
            updatedAt
          FROM gmail_auth_tokens
          WHERE providerAccount = ?
        `
      )
      .get(providerAccount) as GmailTokenRow | undefined;

    return row ? this.toStoredToken(row) : undefined;
  }

  saveToken(token: GmailTokenInput, providerAccount = defaultProviderAccount): StoredGmailToken {
    const existingToken = this.getToken(providerAccount);
    const now = new Date().toISOString();

    const nextToken = {
      id: existingToken?.id ?? defaultTokenId,
      providerAccount,
      accessToken: token.accessToken ?? existingToken?.accessToken ?? null,
      refreshToken: token.refreshToken ?? existingToken?.refreshToken ?? null,
      scope: token.scope ?? existingToken?.scope ?? null,
      tokenType: token.tokenType ?? existingToken?.tokenType ?? null,
      expiryDate: token.expiryDate ?? existingToken?.expiryDate ?? null,
      createdAt: existingToken?.createdAt ?? now,
      updatedAt: now
    };

    this.database
      .prepare(
        `
          INSERT INTO gmail_auth_tokens (
            id,
            providerAccount,
            accessToken,
            refreshToken,
            scope,
            tokenType,
            expiryDate,
            createdAt,
            updatedAt
          )
          VALUES (
            @id,
            @providerAccount,
            @accessToken,
            @refreshToken,
            @scope,
            @tokenType,
            @expiryDate,
            @createdAt,
            @updatedAt
          )
          ON CONFLICT(providerAccount) DO UPDATE SET
            accessToken = excluded.accessToken,
            refreshToken = excluded.refreshToken,
            scope = excluded.scope,
            tokenType = excluded.tokenType,
            expiryDate = excluded.expiryDate,
            updatedAt = excluded.updatedAt
        `
      )
      .run(nextToken);

    const storedToken = this.getToken(providerAccount);

    if (!storedToken) {
      throw new Error("Failed to read saved Gmail token metadata.");
    }

    return storedToken;
  }

  private toStoredToken(row: GmailTokenRow): StoredGmailToken {
    return {
      id: row.id,
      providerAccount: row.providerAccount,
      accessToken: row.accessToken ?? undefined,
      refreshToken: row.refreshToken ?? undefined,
      scope: row.scope ?? undefined,
      tokenType: row.tokenType ?? undefined,
      expiryDate: row.expiryDate ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }
}
