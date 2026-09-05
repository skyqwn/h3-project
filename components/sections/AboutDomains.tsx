import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { Stagger } from "@/components/primitives/Stagger";
import { Section } from "@/components/layout/Section";

const ITEMS = ["parts", "equipment", "ax"] as const;

export async function AboutDomains() {
  const t = await getTranslations("about.domains");

  return (
    <Section tone="canvas">
      <SectionHeader index="01" eyebrow={t("eyebrow")} title={t("title")} />
      <p className="mb-10 max-w-[56ch] text-body-md text-body">{t("body")}</p>

      <Stagger className="grid gap-x-10 gap-y-10 sm:grid-cols-3">
        {ITEMS.map((key) => (
          <div key={key} className="flex flex-col gap-3 border-t border-hairline pt-5">
            <span className="text-caption-md tabular-nums text-primary">
              {t(`items.${key}.idx`)}
            </span>
            <h3 className="text-heading-md text-ink">{t(`items.${key}.title`)}</h3>
            <p className="text-body-sm leading-relaxed text-body">
              {t(`items.${key}.body`)}
            </p>
            <span className="mt-auto w-fit bg-primary/10 px-2.5 py-1 text-caption-md text-primary-pressed">
              {t(`items.${key}.tag`)}
            </span>
          </div>
        ))}
      </Stagger>
    </Section>
  );
}
