"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";

const STEPS = ["s1", "s2", "s3", "s4", "s5", "s6"];

export function ProcessSection() {
  const t = useTranslations("home.process");
  return (
    <section className="bg-surface-soft py-section">
      <div className="max-w-reading mx-auto px-6">
        <p className="text-caption-md uppercase tracking-wider text-mute mb-3">
          {t("eyebrow")}
        </p>
        <h2 className="text-heading-xl text-ink mb-10">{t("title")}</h2>
        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s} className="flex gap-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary text-body-strong">
                {i + 1}
              </span>
              <div>
                <h3 className="text-heading-md text-ink mb-1">
                  {t(`${s}.title`)}
                </h3>
                <p className="text-body-sm text-body leading-relaxed">
                  {t(`${s}.desc`)}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-10">
          <Button href="/contact" variant="primary" size="md">
            {t("cta")}
          </Button>
        </div>
      </div>
    </section>
  );
}
