"use server";

import { Resend } from "resend";
import { env } from "@/lib/env";
import {
  ContactInputSchema,
  type ContactResult,
} from "@/lib/contact-schema";
import { verifyTurnstile } from "@/lib/turnstile";

export async function submitContact(
  _prev: ContactResult | null,
  formData: FormData
): Promise<ContactResult> {
  const parsed = ContactInputSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    company: formData.get("company") ?? "",
    message: formData.get("message"),
    turnstileToken: formData.get("turnstileToken"),
    honeypot: formData.get("honeypot") ?? "",
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const input = parsed.data;

  // Verify the Turnstile token before we touch Resend.
  const captchaOk = await verifyTurnstile(
    input.turnstileToken,
    env.TURNSTILE_SECRET_KEY
  );
  if (!captchaOk) return { ok: false, error: "Bot challenge failed" };

  const resend = new Resend(env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: env.CONTACT_FROM_EMAIL,
    to: env.CONTACT_TO_EMAIL,
    subject: `[H3 contact] ${input.name}`,
    text:
      `From: ${input.name} <${input.email}>\n` +
      `Company: ${input.company || "(none)"}\n\n` +
      `${input.message}`,
  });

  if (error) {
    console.error("Resend send error:", error);
    return { ok: false, error: "Send failed" };
  }

  return { ok: true };
}
