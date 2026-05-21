"use client";

import { useTranslations } from "next-intl";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { Section } from "@/components/layout/Section";
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
    <Section tone="canvas">
      <SectionHeader index="05" eyebrow={t("eyebrow")} title={t("title")} />
      <Accordion type="single" collapsible className="border-t border-hairline">
        {QUESTIONS.map((q) => (
          <AccordionItem key={q} value={q}>
            <AccordionTrigger>{t(`${q}.q`)}</AccordionTrigger>
            <AccordionContent>{t(`${q}.a`)}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Section>
  );
}
