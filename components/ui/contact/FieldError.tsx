"use client";

import { useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";

// Validation message keys that map to a contact.form.* i18n string; anything
// else is shown verbatim (already-localized zod messages).
const VK = new Set(["required", "invalidEmail", "invalidPhone"]);

/**
 * Renders the first present validation error for one or more RHF fields,
 * translating known message keys. Shared by every contact form field so the
 * VK list and markup live in one place.
 */
export function FieldError({ name }: { name: string | string[] }) {
  const t = useTranslations("contact.form");
  const { formState } = useFormContext();
  const errors = formState.errors as Record<string, { message?: string } | undefined>;
  const names = Array.isArray(name) ? name : [name];
  const msg = names.map((n) => errors[n]?.message).find(Boolean);
  if (!msg) return null;
  return (
    <p className="mt-1 text-body-sm text-error">{VK.has(msg) ? t(msg) : msg}</p>
  );
}
