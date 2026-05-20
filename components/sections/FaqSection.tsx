"use client";

import { useTranslations } from "next-intl";
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
      <div className="max-w-narrow mx-auto px-6">
        <p className="text-caption-md uppercase tracking-wider text-mute mb-3">
          {t("eyebrow")}
        </p>
        <h2 className="text-heading-xl text-ink mb-8">{t("title")}</h2>
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
