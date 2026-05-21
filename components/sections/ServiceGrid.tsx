"use client";

import { useTranslations } from "next-intl";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { Stagger } from "@/components/primitives/Stagger";
import { Section } from "@/components/layout/Section";
import {
  PencilRuler,
  Cpu,
  Flame,
  Box,
  Wind,
  HardHat,
  type LucideIcon,
} from "lucide-react";

const SERVICES: { key: string; Icon: LucideIcon }[] = [
  { key: "design", Icon: PencilRuler },
  { key: "cnc", Icon: Cpu },
  { key: "welding", Icon: Flame },
  { key: "fabrication", Icon: Box },
  { key: "scrubber", Icon: Wind },
  { key: "field", Icon: HardHat },
];

export function ServiceGrid() {
  const t = useTranslations("home.services");
  return (
    <Section tone="canvas">
      <SectionHeader index="01" eyebrow={t("eyebrow")} title={t("title")} />
      {/* Editorial capability index — top hairline + ink icon per item,
          no card boxes or icon chips (avoids the generic SaaS
          feature-grid look). */}
      <Stagger className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map(({ key, Icon }) => (
            <div key={key} className="border-t border-hairline pt-5">
              <Icon aria-hidden className="size-6 text-ink mb-3" />
              <h3 className="text-heading-md text-ink mb-1">
                {t(`items.${key}.title`)}
              </h3>
              <p className="text-body-sm text-body leading-relaxed">
                {t(`items.${key}.desc`)}
              </p>
            </div>
          ))}
        </Stagger>
    </Section>
  );
}
