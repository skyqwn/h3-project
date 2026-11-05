import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Section } from "@/components/layout/Section";
import { SectionHeader } from "@/components/primitives/SectionHeader";

const QUESTIONS = ["scope", "delivery", "ax", "preparation"] as const;

export async function AboutQuestions() {
  const t = await getTranslations("about.faq");

  return (
    <Section>
      <SectionHeader index="06" eyebrow={t("eyebrow")} title={t("title")} />
      <div className="border-t border-hairline">
        {QUESTIONS.map((key) => (
          <details key={key} className="group border-b border-hairline">
            <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 py-5 text-body-strong text-ink outline-offset-4 focus-visible:outline-2 focus-visible:outline-focus-outer [&::-webkit-details-marker]:hidden">
              <span>{t(`${key}.q`)}</span>
              <Plus aria-hidden className="size-5 shrink-0 transition-transform group-open:rotate-45 motion-reduce:transition-none" />
            </summary>
            <p className="max-w-3xl pb-6 pr-8 text-body-md leading-relaxed text-body">{t(`${key}.a`)}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
