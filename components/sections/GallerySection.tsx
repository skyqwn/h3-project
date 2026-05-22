"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { Stagger } from "@/components/primitives/Stagger";
import { Section } from "@/components/layout/Section";

const PHOTOS = ["g1", "g2", "g3", "g4", "g5", "g6", "g7", "g8"];
const CASE_HREF = "/blog/gold-refining-pvc-pp-fumehood-scrubber-duct";

export function GallerySection() {
  const t = useTranslations("home.gallery");
  return (
    <Section tone="soft">
      <SectionHeader index="04" eyebrow={t("eyebrow")} title={t("title")} />
        <Stagger className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {PHOTOS.map((p) => (
            <div
              key={p}
              className="relative aspect-square overflow-hidden rounded-md bg-surface-card"
            >
              <Image
                src={`/gallery/${p}.jpg`}
                alt={t("alt")}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className="object-cover transition-transform duration-300 ease-out hover:scale-105"
              />
            </div>
          ))}
        </Stagger>
        <div className="mt-8">
          <Button href={CASE_HREF} variant="secondary" size="md" arrow>
            {t("cta")}
          </Button>
        </div>
    </Section>
  );
}
