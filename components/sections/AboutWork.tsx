import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Section } from "@/components/layout/Section";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { Button } from "@/components/ui/Button";

const PHOTOS = [
  { key: "fabrication", src: "/feature-fabrication.jpg" },
  { key: "site", src: "/feature-site.jpg" },
] as const;

export async function AboutWork() {
  const t = await getTranslations("about.work");

  return (
    <Section tone="soft">
      <SectionHeader index="03" eyebrow={t("eyebrow")} title={t("title")} />
      <div className="grid gap-8 md:grid-cols-2">
        {PHOTOS.map(({ key, src }) => (
          <figure key={key} className="min-w-0">
            <div className="relative aspect-square overflow-hidden bg-surface-card">
              <Image src={src} alt={t(`${key}.alt`)} fill
                sizes="(min-width: 1024px) calc((100vw - 272px) / 2), (min-width: 768px) calc((100vw - 80px) / 2), calc(100vw - 48px)"
                className="object-contain" />
            </div>
            <figcaption className="mt-4">
              <h3 className="text-heading-md text-ink">{t(`${key}.title`)}</h3>
              <p className="mt-2 text-body-sm leading-relaxed text-body">{t(`${key}.body`)}</p>
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button href="/blog" variant="secondary" arrow>{t("stories")}</Button>
        <Button href="/about/history" variant="tertiary" arrow>{t("history")}</Button>
      </div>
    </Section>
  );
}
