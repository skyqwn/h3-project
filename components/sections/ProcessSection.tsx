"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { Stagger } from "@/components/primitives/Stagger";

const STEPS = ["s1", "s2", "s3", "s4", "s5", "s6"];

export function ProcessSection() {
  const t = useTranslations("home.process");
  return (
    <section className="bg-surface-dark py-section">
      <div className="max-w-reading mx-auto px-6">
        <SectionHeader
          index="02"
          eyebrow={t("eyebrow")}
          title={t("title")}
          tone="dark"
        />
        <Stagger as="ol" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s} className="flex gap-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-canvas text-ink text-body-strong">
                {i + 1}
              </span>
              <div>
                <h3 className="text-heading-md text-on-dark mb-1">
                  {t(`${s}.title`)}
                </h3>
                <p className="text-body-sm text-on-dark-mute leading-relaxed">
                  {t(`${s}.desc`)}
                </p>
              </div>
            </li>
          ))}
        </Stagger>
        <div className="mt-10">
          <Button href="/contact" variant="primary" size="md">
            {t("cta")}
          </Button>
        </div>
      </div>
    </section>
  );
}
