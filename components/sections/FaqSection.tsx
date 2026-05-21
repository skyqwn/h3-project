"use client";

import { useTranslations } from "next-intl";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const QUESTIONS = ["q1", "q2", "q3", "q4", "q5", "q6"];

export function FaqSection() {
  const t = useTranslations("home.faq");
  return (
    <section className="bg-canvas py-section">
      <div className="max-w-reading mx-auto px-6">
        <SectionHeader index="05" eyebrow={t("eyebrow")} title={t("title")} />
        <Accordion
          type="single"
          collapsible
          className="border-t border-hairline"
        >
          {QUESTIONS.map((q) => (
            <AccordionItem key={q} value={q}>
              <AccordionTrigger>{t(`${q}.q`)}</AccordionTrigger>
              <AccordionContent>{t(`${q}.a`)}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
