"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";

const PHOTOS = ["g1", "g2", "g3", "g4", "g5", "g6", "g7", "g8"];
const CASE_HREF = "/blog/gold-refining-pvc-pp-fumehood-scrubber-duct";

export function GallerySection() {
  const t = useTranslations("home.gallery");
  return (
    <section className="bg-surface-soft py-section">
      <div className="max-w-reading mx-auto px-6">
        <p className="text-caption-md uppercase tracking-wider text-mute mb-3">
          {t("eyebrow")}
        </p>
        <h2 className="text-heading-xl text-ink mb-8">{t("title")}</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {PHOTOS.map((p) => (
            <div
              key={p}
              className="aspect-square overflow-hidden rounded-md bg-surface-card"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/gallery/${p}.jpg`}
                alt={t("alt")}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
              />
            </div>
          ))}
        </div>
        <div className="mt-8">
          <Button href={CASE_HREF} variant="secondary" size="md">
            {t("cta")}
          </Button>
        </div>
      </div>
    </section>
  );
}
