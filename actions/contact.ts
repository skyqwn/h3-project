"use server";

import { Resend } from "resend";
import { env } from "@/lib/env";
import {
  ContactInputSchema,
  validateUpload,
  type ContactResult,
} from "@/lib/contact-schema";
import { verifyTurnstile } from "@/lib/turnstile";
import { notify } from "@/lib/notify";

const PURPOSE_LABEL: Record<string, string> = {
  product: "제품·견적 문의",
  technical: "기술 상담",
  partnership: "협력·파트너십",
  etc: "기타",
};

export async function submitContact(
  _prev: ContactResult | null,
  formData: FormData
): Promise<ContactResult> {
  const parsed = ContactInputSchema.safeParse({
    company: formData.get("company"),
    contactName: formData.get("contactName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    purpose: formData.get("purpose"),
    message: formData.get("message"),
    locale: formData.get("locale") ?? "ko",
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

  const rawFile = formData.get("file");
  const file = rawFile instanceof File ? rawFile : null;
  const fileError = validateUpload(file);
  if (fileError) return { ok: false, error: fileError };

  const captchaOk = await verifyTurnstile(
    input.turnstileToken,
    env.TURNSTILE_SECRET_KEY
  );
  if (!captchaOk) return { ok: false, error: "Bot challenge failed" };

  const attachments =
    file && file.size > 0
      ? [
          {
            filename: file.name,
            content: Buffer.from(await file.arrayBuffer()),
          },
        ]
      : undefined;

  const resend = new Resend(env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: env.CONTACT_FROM_EMAIL,
    to: env.CONTACT_TO_EMAIL,
    subject: `[H3 contact] ${input.company} — ${PURPOSE_LABEL[input.purpose]}`,
    text:
      `Name: ${input.contactName} <${input.email}>\n` +
      `Company: ${input.company}\n` +
      `Phone: ${input.phone}\n` +
      `Purpose: ${PURPOSE_LABEL[input.purpose]}\n` +
      `Attachment: ${file?.name ?? "(none)"}\n\n` +
      `${input.message}`,
    attachments,
  });

  if (error) {
    console.error("Resend send error:", error);
    return { ok: false, error: "Send failed" };
  }

  await notify({
    contactName: input.contactName,
    email: input.email,
    company: input.company,
    phone: input.phone,
    purpose: input.purpose,
    message: input.message,
    locale: input.locale,
    attachmentName: file?.name ?? null,
    submittedAt: new Date().toISOString(),
  });

  return { ok: true };
}
