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
        <h2 className="text-heading-xl text-ink mb-12">{t("title")}</h2>
        {/* Editorial capability index — top hairline + brand-red icon per
            item, no card boxes or icon chips (avoids the generic SaaS
            feature-grid look). */}
        <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map(({ key, Icon }) => (
            <div key={key} className="border-t border-hairline pt-5">
              <Icon aria-hidden className="size-6 text-primary mb-3" />
              <h3 className="text-heading-md text-ink mb-1">
                {t(`items.${key}.title`)}
              </h3>
              <p className="text-body-sm text-body leading-relaxed">
                {t(`items.${key}.desc`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
