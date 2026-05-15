import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { DisplayHeading } from "@/components/primitives/DisplayHeading";
import { ScrollReveal } from "@/components/primitives/ScrollReveal";
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
    <div className="min-h-screen bg-canvas py-section">
      <div className="max-w-narrow mx-auto px-6 space-y-12">
        <div>
          <p className="text-caption-md uppercase tracking-wider text-mute mb-3">
            {t("subtitle")}
          </p>
          <DisplayHeading level="lg">{t("title")}</DisplayHeading>
        </div>
        <ScrollReveal>
          <p className="text-body-md text-body leading-relaxed">{t("body")}</p>
        </ScrollReveal>
      </div>
    </div>
  );
}
