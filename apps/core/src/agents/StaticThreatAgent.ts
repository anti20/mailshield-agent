import type { NormalizedEmail } from "../models/normalizedEmail.js";
import type { AgentCheck, AgentCheckStatus } from "../models/scanResult.js";

const agentName = "Static Threat Agent";
const dangerousExtensions = new Set([
  ".exe",
  ".scr",
  ".js",
  ".vbs",
  ".hta",
  ".bat",
  ".cmd",
  ".ps1",
  ".jar",
  ".dmg",
  ".pkg"
]);
const macroExtensions = new Set([".docm", ".xlsm", ".pptm"]);
const archiveExtensions = new Set([".zip", ".rar", ".7z"]);
const urlShortenerHosts = new Set(["bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly"]);
const promptInjectionPhrases = [
  "ignore previous instructions",
  "disregard previous instructions",
  "system prompt",
  "developer message",
  "hidden instruction"
];

export class StaticThreatAgent {
  analyze(email: NormalizedEmail): AgentCheck[] {
    return [
      this.checkSenderReplyTo(email),
      this.checkAttachments(email),
      this.checkLinks(email),
      this.checkHtml(email),
      this.checkPromptInjection(email)
    ];
  }

  private checkSenderReplyTo(email: NormalizedEmail): AgentCheck {
    const senderDomain = getAddressDomain(email.sender);
    const replyToDomain = email.replyTo ? getAddressDomain(email.replyTo) : undefined;

    if (senderDomain && replyToDomain && senderDomain !== replyToDomain) {
      return createCheck(email, "sender-reply-to", "Sender and reply-to mismatch", "warning", "The reply-to domain does not match the sender domain.", `${senderDomain} -> ${replyToDomain}`);
    }

    return createCheck(email, "sender-reply-to", "Sender and reply-to aligned", "passed", "No sender and reply-to domain mismatch was detected.", senderDomain);
  }

  private checkAttachments(email: NormalizedEmail): AgentCheck {
    const dangerous = email.attachments.filter((attachment) =>
      dangerousExtensions.has(getFileExtension(attachment.filename))
    );
    const macroEnabled = email.attachments.filter((attachment) =>
      macroExtensions.has(getFileExtension(attachment.filename))
    );
    const doubleExtension = email.attachments.filter((attachment) =>
      hasDoubleExtension(attachment.filename)
    );
    const archives = email.attachments.filter((attachment) =>
      archiveExtensions.has(getFileExtension(attachment.filename))
    );

    if (dangerous.length > 0 || macroEnabled.length > 0 || doubleExtension.length > 0) {
      const evidence = [
        ...dangerous.map((attachment) => attachment.filename),
        ...macroEnabled.map((attachment) => attachment.filename),
        ...doubleExtension.map((attachment) => attachment.filename)
      ];

      return createCheck(email, "attachments", "Dangerous attachment pattern", "failed", "One or more attachments use dangerous, macro-enabled, or double-extension file names.", unique(evidence).join(", "));
    }

    if (archives.length > 0) {
      return createCheck(email, "attachments", "Archive attachment present", "warning", "Archive attachments can hide risky files and should be reviewed before opening.", archives.map((attachment) => attachment.filename).join(", "));
    }

    return createCheck(email, "attachments", "No risky attachment names", "passed", "No dangerous, macro-enabled, double-extension, or archive attachment names were detected.");
  }

  private checkLinks(email: NormalizedEmail): AgentCheck {
    const issues: string[] = [];

    for (const link of email.links) {
      const host = getUrlHost(link.url);

      if (!host) {
        issues.push(`Invalid URL: ${link.url}`);
        continue;
      }

      if (urlShortenerHosts.has(host)) {
        issues.push(`URL shortener: ${host}`);
      }

      if (isIpAddress(host)) {
        issues.push(`IP link host: ${host}`);
      }

      if (host.startsWith("xn--") || host.includes(".xn--")) {
        issues.push(`Punycode host: ${host}`);
      }

      const visibleDomain = link.text ? findVisibleDomain(link.text) : undefined;

      if (visibleDomain && visibleDomain !== host) {
        issues.push(`Visible domain mismatch: ${visibleDomain} -> ${host}`);
      }
    }

    if (issues.length > 0) {
      return createCheck(email, "links", "Suspicious link pattern", "warning", "One or more links use a risky host, misleading text, or suspicious domain format.", issues.join("; "));
    }

    return createCheck(email, "links", "No suspicious link patterns", "passed", "No URL shorteners, IP hosts, punycode hosts, or visible-domain mismatches were detected.");
  }

  private checkHtml(email: NormalizedEmail): AgentCheck {
    const html = email.bodyHtml ?? "";
    const issues: string[] = [];

    if (/<form\b/i.test(html)) {
      issues.push("form tag");
    }

    if (/<script\b/i.test(html)) {
      issues.push("script tag");
    }

    if (/\son[a-z]+\s*=/i.test(html)) {
      issues.push("inline event handler");
    }

    if (/display\s*:\s*none/i.test(html)) {
      issues.push("display:none");
    }

    if (/visibility\s*:\s*hidden/i.test(html)) {
      issues.push("visibility:hidden");
    }

    if (/opacity\s*:\s*0(?:[;"'\s]|$)/i.test(html)) {
      issues.push("opacity:0");
    }

    if (/font-size\s*:\s*0/i.test(html)) {
      issues.push("font-size:0");
    }

    if (issues.some((issue) => issue === "form tag" || issue === "script tag" || issue === "inline event handler")) {
      return createCheck(email, "html", "Active HTML content detected", "failed", "HTML contains active content that can collect input or execute browser behavior.", issues.join(", "));
    }

    if (issues.length > 0) {
      return createCheck(email, "html", "Hidden HTML content detected", "warning", "HTML contains styling that can hide text from users while leaving it visible to scanners.", issues.join(", "));
    }

    return createCheck(email, "html", "No risky HTML patterns", "passed", "No forms, scripts, inline event handlers, or hidden text indicators were detected.");
  }

  private checkPromptInjection(email: NormalizedEmail): AgentCheck {
    const content = `${email.subject}\n${email.bodyText ?? ""}\n${stripHtml(email.bodyHtml ?? "")}`.toLowerCase();
    const matches = promptInjectionPhrases.filter((phrase) => content.includes(phrase));

    if (matches.length > 0) {
      return createCheck(email, "prompt-injection", "Suspicious instruction language", "warning", "The email contains instruction-like text that could target automated analysis workflows.", matches.join(", "));
    }

    return createCheck(email, "prompt-injection", "No prompt-injection phrases", "passed", "No suspicious instruction phrases were detected.");
  }
}

function createCheck(
  email: NormalizedEmail,
  idSuffix: string,
  title: string,
  status: AgentCheckStatus,
  reason: string,
  evidence?: string
): AgentCheck {
  return {
    id: `${email.id}_static_${idSuffix}`,
    agentName,
    title,
    status,
    reason,
    evidence: evidence || undefined
  };
}

function getAddressDomain(address: string): string | undefined {
  const match = address.match(/<[^@\s<>]+@([^>\s]+)>|[^@\s<>]+@([^\s<>]+)/);
  return normalizeHost(match?.[1] ?? match?.[2]);
}

function getUrlHost(url: string): string | undefined {
  try {
    return normalizeHost(new URL(url).hostname);
  } catch {
    return undefined;
  }
}

function getFileExtension(filename: string): string {
  const normalized = filename.toLowerCase();
  const index = normalized.lastIndexOf(".");

  return index === -1 ? "" : normalized.slice(index);
}

function hasDoubleExtension(filename: string): boolean {
  const parts = filename.toLowerCase().split(".").filter(Boolean);

  if (parts.length < 3) {
    return false;
  }

  const finalExtension = `.${parts.at(-1)}`;
  const previousExtension = `.${parts.at(-2)}`;

  return dangerousExtensions.has(finalExtension) && previousExtension.length > 1;
}

function findVisibleDomain(text: string): string | undefined {
  const match = text.toLowerCase().match(/\b([a-z0-9-]+(?:\.[a-z0-9-]+)+)\b/);
  return normalizeHost(match?.[1]);
}

function normalizeHost(host?: string): string | undefined {
  return host?.toLowerCase().replace(/\.$/, "");
}

function isIpAddress(host: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(host) || /^\[[0-9a-f:]+\]$/i.test(host);
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ");
}

function unique(items: string[]): string[] {
  return [...new Set(items)];
}
