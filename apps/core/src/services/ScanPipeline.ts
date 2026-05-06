import { StaticThreatAgent } from "../agents/StaticThreatAgent.js";
import type { NormalizedEmail } from "../models/normalizedEmail.js";
import type { AgentCheck } from "../models/scanResult.js";

export type ScanPreviewItem = {
  email: NormalizedEmail;
  checks: AgentCheck[];
};

export class ScanPipeline {
  private readonly staticThreatAgent = new StaticThreatAgent();

  previewEmails(emails: NormalizedEmail[]): ScanPreviewItem[] {
    return emails.map((email) => ({
      email,
      checks: this.staticThreatAgent.analyze(email)
    }));
  }
}
