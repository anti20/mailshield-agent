export type RiskLevel = "low" | "medium" | "high" | "critical";

export type AgentCheckStatus = "passed" | "warning" | "failed";

export type AgentCheck = {
  id: string;
  agentName: string;
  title: string;
  status: AgentCheckStatus;
  reason: string;
  evidence?: string;
};

export type EmailScanResult = {
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
  checks: AgentCheck[];
};

export type ScanResultsResponse = {
  items: EmailScanResult[];
};
