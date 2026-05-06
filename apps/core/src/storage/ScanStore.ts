import type Database from "better-sqlite3";
import type {
  AgentCheck,
  AgentCheckStatus,
  EmailScanResult,
  RiskLevel
} from "../models/scanResult.js";
import { initializeSchema } from "../db/schema.js";

type ScanResultRow = {
  id: string;
  gmailMessageId: string;
  threadId: string;
  subject: string;
  sender: string;
  receivedAt: string;
  scannedAt: string;
  riskLevel: RiskLevel;
  riskScore: number;
  summary: string;
  keyReasonsJson: string | null;
  recommendedAction: string | null;
  agentStepsJson: string | null;
};

type AgentCheckRow = {
  id: string;
  scanResultId: string;
  agentName: string;
  title: string;
  status: AgentCheckStatus;
  reason: string;
  evidence: string | null;
};

export class ScanStore {
  constructor(private readonly database: Database.Database) {}

  initialize(seedScanResults: EmailScanResult[]): void {
    try {
      initializeSchema(this.database);

      if (this.countScanResults() === 0) {
        this.saveScanResults(seedScanResults);
      }
    } catch (error) {
      throw new Error("Failed to initialize scan result storage.", {
        cause: error
      });
    }
  }

  listScanResults(): EmailScanResult[] {
    const scanRows = this.database
      .prepare(
        `
          SELECT
            id,
            gmailMessageId,
            threadId,
            subject,
            sender,
            receivedAt,
            scannedAt,
            riskLevel,
            riskScore,
            summary,
            keyReasonsJson,
            recommendedAction,
            agentStepsJson
          FROM email_scan_results
          ORDER BY scannedAt DESC
        `
      )
      .all() as ScanResultRow[];

    const checkRows = this.database
      .prepare(
        `
          SELECT
            id,
            scanResultId,
            agentName,
            title,
            status,
            reason,
            evidence
          FROM agent_checks
          ORDER BY rowid ASC
        `
      )
      .all() as AgentCheckRow[];

    const checksByScanResultId = new Map<string, AgentCheck[]>();

    for (const checkRow of checkRows) {
      const checks = checksByScanResultId.get(checkRow.scanResultId) ?? [];
      checks.push({
        id: checkRow.id,
        agentName: checkRow.agentName,
        title: checkRow.title,
        status: checkRow.status,
        reason: checkRow.reason,
        evidence: checkRow.evidence ?? undefined
      });
      checksByScanResultId.set(checkRow.scanResultId, checks);
    }

    return scanRows.map((scanRow) => ({
      id: scanRow.id,
      gmailMessageId: scanRow.gmailMessageId,
      threadId: scanRow.threadId,
      subject: scanRow.subject,
      sender: scanRow.sender,
      receivedAt: scanRow.receivedAt,
      scannedAt: scanRow.scannedAt,
      riskLevel: scanRow.riskLevel,
      riskScore: scanRow.riskScore,
      summary: scanRow.summary,
      keyReasons: parseJsonArray<string>(scanRow.keyReasonsJson),
      recommendedAction: scanRow.recommendedAction ?? undefined,
      agentSteps: parseJsonArray<{
        id: string;
        agentName: string;
        status: "completed" | "limited";
        summary: string;
      }>(scanRow.agentStepsJson),
      checks: checksByScanResultId.get(scanRow.id) ?? []
    }));
  }

  upsertScanResult(scanResult: EmailScanResult): void {
    const upsertScanResultStatement = this.database.prepare(`
      INSERT INTO email_scan_results (
        id,
        gmailMessageId,
        threadId,
        subject,
        sender,
        receivedAt,
        scannedAt,
        riskLevel,
        riskScore,
        summary,
        keyReasonsJson,
        recommendedAction,
        agentStepsJson
      )
      VALUES (
        @id,
        @gmailMessageId,
        @threadId,
        @subject,
        @sender,
        @receivedAt,
        @scannedAt,
        @riskLevel,
        @riskScore,
        @summary,
        @keyReasonsJson,
        @recommendedAction,
        @agentStepsJson
      )
      ON CONFLICT(gmailMessageId) DO UPDATE SET
        id = excluded.id,
        threadId = excluded.threadId,
        subject = excluded.subject,
        sender = excluded.sender,
        receivedAt = excluded.receivedAt,
        scannedAt = excluded.scannedAt,
        riskLevel = excluded.riskLevel,
        riskScore = excluded.riskScore,
        summary = excluded.summary,
        keyReasonsJson = excluded.keyReasonsJson,
        recommendedAction = excluded.recommendedAction,
        agentStepsJson = excluded.agentStepsJson
    `);

    const deleteChecksForScan = this.database.prepare(`
      DELETE FROM agent_checks WHERE scanResultId = ?
    `);
    const selectExistingScanId = this.database.prepare(`
      SELECT id FROM email_scan_results WHERE gmailMessageId = ?
    `);

    const insertAgentCheck = this.database.prepare(`
      INSERT INTO agent_checks (
        id,
        scanResultId,
        agentName,
        title,
        status,
        reason,
        evidence
      )
      VALUES (
        @id,
        @scanResultId,
        @agentName,
        @title,
        @status,
        @reason,
        @evidence
      )
    `);

    const saveOne = this.database.transaction((item: EmailScanResult) => {
      const existingRow = selectExistingScanId.get(item.gmailMessageId) as { id: string } | undefined;
      upsertScanResultStatement.run({
        ...item,
        keyReasonsJson: stringifyJson(item.keyReasons),
        recommendedAction: item.recommendedAction ?? null,
        agentStepsJson: stringifyJson(item.agentSteps)
      });
      if (existingRow?.id && existingRow.id !== item.id) {
        deleteChecksForScan.run(existingRow.id);
      }
      deleteChecksForScan.run(item.id);

      for (const check of item.checks) {
        insertAgentCheck.run({
          ...check,
          scanResultId: item.id,
          evidence: check.evidence ?? null
        });
      }
    });

    saveOne(scanResult);
  }

  markMessageSeen(gmailMessageId: string, seenAt = new Date().toISOString()): void {
    this.database
      .prepare(
        `
          INSERT INTO seen_messages (gmailMessageId, seenAt)
          VALUES (@gmailMessageId, @seenAt)
          ON CONFLICT(gmailMessageId) DO UPDATE SET
            seenAt = excluded.seenAt
        `
      )
      .run({ gmailMessageId, seenAt });
  }

  hasSeenMessage(gmailMessageId: string): boolean {
    const row = this.database
      .prepare(
        `
          SELECT gmailMessageId
          FROM seen_messages
          WHERE gmailMessageId = ?
        `
      )
      .get(gmailMessageId);

    return row !== undefined;
  }

  private countScanResults(): number {
    const row = this.database
      .prepare("SELECT COUNT(*) AS count FROM email_scan_results")
      .get() as { count: number };

    return row.count;
  }

  private saveScanResults(scanResults: EmailScanResult[]): void {
    const insertScanResult = this.database.prepare(`
      INSERT INTO email_scan_results (
        id,
        gmailMessageId,
        threadId,
        subject,
        sender,
        receivedAt,
        scannedAt,
        riskLevel,
        riskScore,
        summary,
        keyReasonsJson,
        recommendedAction,
        agentStepsJson
      )
      VALUES (
        @id,
        @gmailMessageId,
        @threadId,
        @subject,
        @sender,
        @receivedAt,
        @scannedAt,
        @riskLevel,
        @riskScore,
        @summary,
        @keyReasonsJson,
        @recommendedAction,
        @agentStepsJson
      )
    `);

    const insertAgentCheck = this.database.prepare(`
      INSERT INTO agent_checks (
        id,
        scanResultId,
        agentName,
        title,
        status,
        reason,
        evidence
      )
      VALUES (
        @id,
        @scanResultId,
        @agentName,
        @title,
        @status,
        @reason,
        @evidence
      )
    `);

    const saveAll = this.database.transaction((items: EmailScanResult[]) => {
      for (const scanResult of items) {
        insertScanResult.run({
          ...scanResult,
          keyReasonsJson: stringifyJson(scanResult.keyReasons),
          recommendedAction: scanResult.recommendedAction ?? null,
          agentStepsJson: stringifyJson(scanResult.agentSteps)
        });

        for (const check of scanResult.checks) {
          insertAgentCheck.run({
            ...check,
            scanResultId: scanResult.id,
            evidence: check.evidence ?? null
          });
        }
      }
    });

    saveAll(scanResults);
  }
}

function parseJsonArray<T>(value: string | null): T[] | undefined {
  if (!value) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : undefined;
  } catch {
    return undefined;
  }
}

function stringifyJson(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  return JSON.stringify(value);
}
