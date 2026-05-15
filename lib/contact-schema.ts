import { z } from "zod";

export const ContactInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  company: z.string().trim().max(120).optional().default(""),
  message: z.string().trim().min(1).max(2000),
  turnstileToken: z.string().min(1),
  // Honeypot field — real users leave it empty; bots populate it.
  honeypot: z
    .string()
    .max(0, "spam detected")
    .optional()
    .default(""),
});

export type ContactInput = z.infer<typeof ContactInputSchema>;

export type ContactResult =
  | { ok: true }
  | { ok: false; error: string };
