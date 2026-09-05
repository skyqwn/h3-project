import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { Stagger } from "@/components/primitives/Stagger";
import { Section } from "@/components/layout/Section";

const ITEMS = ["tech", "model", "network", "future"] as const;

export async function AboutStrengths() {
  const t = await getTranslations("about.strengths");

  return (
    <Section tone="soft">
      <SectionHeader index="02" eyebrow={t("eyebrow")} title={t("title")} />
      <p className="mb-8 max-w-[56ch] text-body-md text-body">{t("body")}</p>

      <Stagger as="ol" className="flex flex-col">
        {ITEMS.map((key, i) => (
          <li
            key={key}
            className="grid grid-cols-[48px_1fr] gap-5 border-t border-hairline py-6 last:border-b sm:grid-cols-[64px_1fr]"
          >
            <span className="pt-1 text-caption-md tabular-nums text-ash">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-[220px_1fr] sm:items-start sm:gap-6">
              <h3 className="text-heading-md text-ink">{t(`items.${key}.title`)}</h3>
              <p className="text-body-sm leading-relaxed text-body">
                {t(`items.${key}.body`)}
              </p>
            </div>
          </li>
        ))}
      </Stagger>
    </Section>
  );
}
