import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { DisplayHeading } from "@/components/primitives/DisplayHeading";
import { ScrollReveal } from "@/components/primitives/ScrollReveal";
import { LocationSection } from "@/components/sections/LocationSection";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return pageMetadata({
    locale: locale as Locale,
    path: "/about",
    title: t("title"),
    description: t("subtitle"),
  });
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");

  return (
    <div className="min-h-screen bg-canvas">
      <div className="max-w-narrow mx-auto px-6 py-section space-y-12">
        <div>
          <p className="text-caption-md uppercase tracking-wider text-mute mb-3">
            {t("subtitle")}
          </p>
          <DisplayHeading level="lg">{t("title")}</DisplayHeading>
        </div>
        <ScrollReveal>
          <div className="space-y-4">
            <p className="text-heading-md text-ink leading-relaxed">
              {t("lead")}
            </p>
            <p className="text-body-md text-body leading-relaxed">
              {t("body1")}
            </p>
            <p className="text-body-md text-body leading-relaxed">
              {t("body2")}
            </p>
          </div>
        </ScrollReveal>
      </div>
      <LocationSection />
    </div>
  );
}
