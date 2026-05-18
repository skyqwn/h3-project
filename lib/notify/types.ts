export type Lead = {
  name: string;
  email: string;
  company: string; // "" when not provided
  message: string;
  locale: "ko" | "en";
  submittedAt: string; // ISO 8601
};

export type NotifyChannel = {
  name: string;
  send: (lead: Lead) => Promise<void>;
};
