import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { Stagger } from "@/components/primitives/Stagger";
import { Section } from "@/components/layout/Section";

const ITEMS = ["tech", "site", "company"] as const;

// 회사가 지향하는 방향(기술·현장·회사) 3가지. 회사 소개 인트로 바로 아래.
export async function AboutPrinciples() {
  const t = await getTranslations("about.principles");

  return (
    <Section tone="soft">
      <SectionHeader index="01" eyebrow={t("eyebrow")} title={t("title")} />
      <p className="mb-10 max-w-[56ch] text-body-md text-body">{t("body")}</p>

      <Stagger as="ul" className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {ITEMS.map((key, i) => (
          <li
            key={key}
            className="flex flex-col rounded-lg border border-hairline bg-canvas p-6 lg:p-8"
          >
            <span className="text-caption-md font-bold tabular-nums text-primary">
              {String(i + 1).padStart(2, "0")} / {t(`items.${key}.label`)}
            </span>
            <h3 className="mt-4 text-heading-md text-ink break-keep">
              {t(`items.${key}.title`)}
            </h3>
            <p className="mt-3 text-body-sm leading-relaxed text-body break-keep">
              {t(`items.${key}.body`)}
            </p>
          </li>
        ))}
      </Stagger>
    </Section>
  );
}
