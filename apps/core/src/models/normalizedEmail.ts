export type NormalizedEmail = {
  id: string;
  gmailMessageId?: string;
  threadId?: string;
  subject: string;
  sender: string;
  replyTo?: string;
  bodyText?: string;
  bodyHtml?: string;
  links: EmailLink[];
  attachments: EmailAttachment[];
  receivedAt: string;
};

export type EmailLink = {
  text?: string;
  url: string;
};

export type EmailAttachment = {
  filename: string;
  mimeType?: string;
  sizeBytes?: number;
};
