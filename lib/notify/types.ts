export type Lead = {
  contactName: string;
  email: string;
  company: string;
  phone: string;
  purpose: "product" | "technical" | "partnership" | "etc";
  message: string;
  locale: "ko" | "en";
  attachmentName: string | null;
  submittedAt: string; // ISO 8601
};

export type NotifyChannel = {
  name: string;
  send: (lead: Lead) => Promise<void>;
};
