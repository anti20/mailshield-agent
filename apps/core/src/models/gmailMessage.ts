export type GmailMessageMetadata = {
  id: string;
  threadId: string;
  subject: string;
  sender: string;
  snippet: string;
  receivedAt: string;
  labelIds: string[];
  hasAttachments: boolean;
};
