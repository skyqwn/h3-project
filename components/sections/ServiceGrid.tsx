"use client";

import { useTranslations } from "next-intl";
import {
  PencilRuler,
  Cpu,
  Flame,
  Box,
  Wind,
  HardHat,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";

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
    <section className="bg-canvas py-section">
      <div className="max-w-reading mx-auto px-6">
        <p className="text-caption-md uppercase tracking-wider text-mute mb-3">
          {t("eyebrow")}
        </p>
        <h2 className="text-heading-xl text-ink mb-10">{t("title")}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map(({ key, Icon }) => (
            <Card
              key={key}
              className="group transition-colors hover:border-primary"
            >
              <span className="mb-4 inline-flex size-10 items-center justify-center rounded-md bg-surface-elevated text-mute transition-colors group-hover:text-primary">
                <Icon aria-hidden className="size-5" />
              </span>
              <h3 className="text-heading-md text-ink mb-1">
                {t(`items.${key}.title`)}
              </h3>
              <p className="text-body-sm text-body leading-relaxed">
                {t(`items.${key}.desc`)}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
