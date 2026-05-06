import type { NormalizedEmail } from "./normalizedEmail.js";
import type { AgentCheck, RiskLevel } from "./scanResult.js";

export type AgentStepStatus = "completed" | "limited";

export type AgentStep = {
  id: string;
  agentName: string;
  status: AgentStepStatus;
  summary: string;
  structuredData: unknown;
};

export type NormalizedEmailSummary = {
  id: string;
  gmailMessageId?: string;
  threadId?: string;
  subject: string;
  sender: string;
  replyTo?: string;
  receivedAt: string;
  linkCount: number;
  attachmentCount: number;
  hasHtml: boolean;
  hasText: boolean;
};

export type GmailAgentScanResult = {
  normalizedEmailSummary: NormalizedEmailSummary;
  agentSteps: AgentStep[];
  checks: AgentCheck[];
  finalRiskLevel: RiskLevel;
  finalRiskScore: number;
  finalSummary: string;
  keyReasons: string[];
  recommendedAction: string;
  finalExplanation: string;
  limitations: string[];
};

export function summarizeNormalizedEmail(email: NormalizedEmail): NormalizedEmailSummary {
  return {
    id: email.id,
    gmailMessageId: email.gmailMessageId,
    threadId: email.threadId,
    subject: email.subject,
    sender: email.sender,
    replyTo: email.replyTo,
    receivedAt: email.receivedAt,
    linkCount: email.links.length,
    attachmentCount: email.attachments.length,
    hasHtml: Boolean(email.bodyHtml),
    hasText: Boolean(email.bodyText)
  };
}
