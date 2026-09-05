import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { Stagger } from "@/components/primitives/Stagger";
import { Section } from "@/components/layout/Section";

const PHASES = ["p1", "p2", "p3"] as const;

export async function AboutVision() {
  const t = await getTranslations("about.vision");

  return (
    <Section tone="dark" className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
      <div>
        <SectionHeader
          index="03"
          eyebrow={t("eyebrow")}
          title={t("title")}
          tone="dark"
        />
        <p className="max-w-[48ch] text-body-md text-on-dark-mute">{t("body")}</p>
      </div>

      <Stagger as="ol" className="flex flex-col">
        {PHASES.map((key) => (
          <li
            key={key}
            className="grid grid-cols-[80px_1fr] gap-4 border-t border-white/15 py-5 last:border-b"
          >
            <span className="pt-0.5 text-caption-md tabular-nums text-primary">
              {t(`phases.${key}.label`)}
            </span>
            <div>
              <h4 className="text-body-strong text-on-dark">
                {t(`phases.${key}.title`)}
              </h4>
              <p className="mt-1 text-body-sm text-on-dark-mute">
                {t(`phases.${key}.body`)}
              </p>
            </div>
          </li>
        ))}
      </Stagger>
    </Section>
  );
}
