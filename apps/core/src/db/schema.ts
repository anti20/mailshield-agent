import type Database from "better-sqlite3";

export function initializeSchema(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS email_scan_results (
      id TEXT PRIMARY KEY,
      gmailMessageId TEXT NOT NULL UNIQUE,
      threadId TEXT NOT NULL,
      subject TEXT NOT NULL,
      sender TEXT NOT NULL,
      receivedAt TEXT NOT NULL,
      scannedAt TEXT NOT NULL,
      riskLevel TEXT NOT NULL,
      riskScore INTEGER NOT NULL,
      summary TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS agent_checks (
      id TEXT PRIMARY KEY,
      scanResultId TEXT NOT NULL,
      agentName TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL,
      reason TEXT NOT NULL,
      evidence TEXT,
      FOREIGN KEY (scanResultId) REFERENCES email_scan_results(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS seen_messages (
      gmailMessageId TEXT PRIMARY KEY,
      seenAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS gmail_auth_tokens (
      id TEXT PRIMARY KEY,
      providerAccount TEXT NOT NULL UNIQUE,
      accessToken TEXT,
      refreshToken TEXT,
      scope TEXT,
      tokenType TEXT,
      expiryDate INTEGER,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_agent_checks_scan_result_id
      ON agent_checks(scanResultId);

    CREATE INDEX IF NOT EXISTS idx_email_scan_results_scanned_at
      ON email_scan_results(scannedAt);
  `);
}
