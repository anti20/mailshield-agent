import type { GmailMessageService } from "../gmail/GmailMessageService.js";
import type { NormalizedEmail } from "../models/normalizedEmail.js";
import type { AgentCheck } from "../models/scanResult.js";
import type { ScanPipeline } from "./ScanPipeline.js";

export type GmailStaticScanResult = {
  email: NormalizedEmail;
  checks: AgentCheck[];
};

export class GmailStaticScanService {
  constructor(
    private readonly gmailMessageService: GmailMessageService,
    private readonly scanPipeline: ScanPipeline
  ) {}

  async scanMessage(messageId: string): Promise<GmailStaticScanResult> {
    const email = await this.gmailMessageService.getNormalizedMessage(messageId);
    const checks = this.scanPipeline.scanEmail(email);

    return {
      email,
      checks
    };
  }
}
