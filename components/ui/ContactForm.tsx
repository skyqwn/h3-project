"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations, useLocale } from "next-intl";
import Script from "next/script";
import { submitContact } from "@/actions/contact";
import { Button } from "@/components/ui/Button";
import { Step1 } from "@/components/ui/contact/Step1";
import { Step2 } from "@/components/ui/contact/Step2";
import {
  ContactClientSchema,
  composeEmail,
  validateUpload,
  type ContactResult,
} from "@/lib/contact-schema";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => string;
      reset: (id?: string) => void;
    };
  }
}

const STEP1_FIELDS = [
  "company",
  "contactName",
  "phone",
  "emailLocal",
  "emailDomain",
  "purpose",
] as const;

export function ContactForm({
  turnstileSiteKey,
}: {
  turnstileSiteKey: string;
}) {
  const t = useTranslations("contact.form");
  const tStep = useTranslations("contact.step");
  const locale = useLocale();

  const methods = useForm({
    resolver: zodResolver(ContactClientSchema),
    mode: "onTouched",
    defaultValues: {
      company: "",
      contactName: "",
      phone: "",
      emailLocal: "",
      emailDomain: "",
      purpose: "",
      message: "",
      locale,
      turnstileToken: "",
      honeypot: "",
    } as never,
  });

  const [step, setStep] = useState<1 | 2>(1);
  const [fileError, setFileError] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const turnstileRef = useRef<HTMLDivElement | null>(null);
  const widgetRendered = useRef(false);
  const [state, formAction, isPending] = useActionState<
    ContactResult | null,
    FormData
  >(submitContact, null);

  // Explicitly render Turnstile when the user reaches step 2. It must NOT
  // auto-render on load: on step 1 the widget's container is display:none,
  // and Cloudflare's implicit render then yields no challenge/token, which
  // left the submit button permanently disabled. Render once, when visible.
  useEffect(() => {
    if (step !== 2 || widgetRendered.current) return;
    let cancelled = false;
    let timer = 0;
    const tryRender = () => {
      if (cancelled || widgetRendered.current) return;
      const el = turnstileRef.current;
      if (window.turnstile && el) {
        widgetRendered.current = true;
        window.turnstile.render(el, {
          sitekey: turnstileSiteKey,
          callback: (tok: string) => setToken(tok),
          "expired-callback": () => setToken(""),
          "error-callback": () => setToken(""),
        });
        return;
      }
      timer = window.setTimeout(tryRender, 200);
    };
    timer = window.setTimeout(tryRender, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [step, turnstileSiteKey]);

  if (state?.ok) {
    return (
      <div
        role="status"
        className="bg-success-pale text-success-deep rounded-md p-6 space-y-4"
      >
        <p className="text-body-md">{t("success")}</p>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="primary"
            size="md"
            className="cursor-pointer"
            onClick={() => window.location.reload()}
          >
            {t("again")}
          </Button>
          <Button href="/" variant="secondary" size="md">
            {t("home")}
          </Button>
        </div>
      </div>
    );
  }

  const goNext = async () => {
    const ok = await methods.trigger(STEP1_FIELDS as unknown as never);
    if (ok) setStep(2);
  };

  const onSubmit = methods.handleSubmit(async (values) => {
    const fileList = (values as Record<string, unknown>).file as
      | FileList
      | undefined;
    const file =
      fileList && fileList.length > 0 ? (fileList[0] ?? null) : null;
    const fErr = validateUpload(file);
    setFileError(fErr ? fErr.replace("contact.form.", "") : null);
    if (fErr) return;

    const fd = new FormData();
    fd.set("company", values.company);
    fd.set("contactName", values.contactName);
    fd.set("phone", values.phone);
    fd.set("email", composeEmail(values.emailLocal, values.emailDomain));
    fd.set("purpose", values.purpose);
    fd.set("message", values.message);
    fd.set("locale", locale);
    fd.set("turnstileToken", token);
    fd.set("honeypot", values.honeypot ?? "");
    if (file) fd.set("file", file);

    formAction(fd);
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} className="space-y-6" noValidate>
        {state && !state.ok && (
          <div
            role="alert"
            className="bg-error-deep text-on-primary rounded-md p-3 text-body-sm"
          >
            {t("error")}
          </div>
        )}

        <p className="text-caption-md uppercase tracking-wider text-mute">
          {tStep("of", { current: step, total: 2 })}
        </p>

        {/* Honeypot — hidden from users; bots fill it and get rejected. */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden
          {...methods.register("honeypot")}
        />

        <div className={step === 1 ? "" : "hidden"}>
          <Step1 />
        </div>
        <div className={step === 2 ? "" : "hidden"}>
          <Step2 fileError={fileError} />
          <div ref={turnstileRef} className="mt-4" />
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js"
            strategy="afterInteractive"
          />
        </div>

        <div className="flex gap-3">
          {step === 2 && (
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="cursor-pointer"
              onClick={() => setStep(1)}
            >
              {tStep("prev")}
            </Button>
          )}
          {step === 1 ? (
            <Button
              type="button"
              variant="primary"
              size="md"
              className="cursor-pointer"
              onClick={goNext}
            >
              {tStep("next")}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              disabled={isPending || !token}
            >
              {isPending ? t("submitting") : t("submit")}
            </Button>
          )}
        </div>
        {step === 2 && !token && (
          <p className="text-body-sm text-mute">{t("turnstileWait")}</p>
        )}
      </form>
    </FormProvider>
  );
}
