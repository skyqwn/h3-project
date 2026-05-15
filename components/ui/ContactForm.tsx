"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { submitContact } from "@/actions/contact";
import { Button } from "@/components/ui/Button";
import type { ContactResult } from "@/lib/contact-schema";

declare global {
  interface Window {
    onTurnstileSuccess?: (token: string) => void;
  }
}

export function ContactForm({
  turnstileSiteKey,
}: {
  turnstileSiteKey: string;
}) {
  const t = useTranslations("contact.form");
  const [state, formAction, isPending] = useActionState<
    ContactResult | null,
    FormData
  >(submitContact, null);

  if (state?.ok) {
    return (
      <div
        role="status"
        className="bg-success-pale text-success-deep rounded-md p-6"
      >
        <p className="text-body-md">{t("success")}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state && !state.ok && (
        <div
          role="alert"
          className="bg-error-deep text-on-primary rounded-md p-3 text-body-sm"
        >
          {t("error")}
        </div>
      )}

      {/* Honeypot — hidden from real users; bots fill it and get rejected. */}
      <input
        type="text"
        name="honeypot"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden
      />

      <label className="block">
        <span className="block text-body-sm text-ink mb-1">{t("name")}</span>
        <input
          name="name"
          required
          maxLength={120}
          className="w-full h-11 px-3 bg-canvas border border-ash rounded-md text-body-md text-ink"
        />
      </label>

      <label className="block">
        <span className="block text-body-sm text-ink mb-1">{t("email")}</span>
        <input
          name="email"
          type="email"
          required
          maxLength={200}
          className="w-full h-11 px-3 bg-canvas border border-ash rounded-md text-body-md text-ink"
        />
      </label>

      <label className="block">
        <span className="block text-body-sm text-ink mb-1">{t("company")}</span>
        <input
          name="company"
          maxLength={120}
          className="w-full h-11 px-3 bg-canvas border border-ash rounded-md text-body-md text-ink"
        />
      </label>

      <label className="block">
        <span className="block text-body-sm text-ink mb-1">{t("message")}</span>
        <textarea
          name="message"
          required
          maxLength={2000}
          rows={6}
          className="w-full px-3 py-3 bg-canvas border border-ash rounded-md text-body-md text-ink"
        />
      </label>

      {/* Cloudflare Turnstile widget mounts here and writes its token into
          the hidden field below via the onTurnstileSuccess callback. */}
      <div
        className="cf-turnstile"
        data-sitekey={turnstileSiteKey}
        data-callback="onTurnstileSuccess"
      />
      <input type="hidden" name="turnstileToken" id="turnstileToken" />
      <script
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html:
            "function onTurnstileSuccess(t){var el=document.getElementById('turnstileToken');if(el){el.value=t;}}",
        }}
      />
      <script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        async
        defer
      />

      <Button variant="primary" size="md" disabled={isPending}>
        {isPending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
