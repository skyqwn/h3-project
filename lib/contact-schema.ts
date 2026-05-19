import { z } from "zod";

export const PURPOSES = [
  "product",
  "technical",
  "partnership",
  "etc",
] as const;
export type Purpose = (typeof PURPOSES)[number];

export const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_FILE_EXT = [
  "pdf",
  "png",
  "jpg",
  "jpeg",
  "doc",
  "docx",
  "xls",
  "xlsx",
] as const;

// Loose phone rule: digits, spaces, +, -, 8–20 chars. Avoids
// over-strict locale formats while blocking junk.
const phone = z
  .string()
  .trim()
  .regex(/^[0-9+\-\s]{8,20}$/, "invalid phone");

export const ContactInputSchema = z.object({
  company: z.string().trim().min(1).max(120),
  contactName: z.string().trim().min(1).max(120),
  phone,
  email: z.string().trim().email().max(200),
  purpose: z.enum(PURPOSES),
  message: z.string().trim().min(1).max(2000),
  locale: z.enum(["ko", "en"]).default("ko"),
  turnstileToken: z.string().min(1),
  honeypot: z.string().max(0, "spam detected").optional().default(""),
});

export type ContactInput = z.infer<typeof ContactInputSchema>;

export type ContactResult = { ok: true } | { ok: false; error: string };

// File validation lives server-side (a real File/Blob from FormData).
// Returns an error message key or null when ok / absent (file optional).
export function validateUpload(
  file: File | null
): "contact.form.fileTooLarge" | "contact.form.fileType" | null {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_FILE_BYTES) return "contact.form.fileTooLarge";
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_FILE_EXT.includes(ext as (typeof ALLOWED_FILE_EXT)[number]))
    return "contact.form.fileType";
  return null;
}
