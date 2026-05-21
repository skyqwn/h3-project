import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { PageShell } from "@/components/layout/PageShell";
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
    <>
      <PageShell eyebrow={t("subtitle")} title={t("title")} fill={false}>
        <ScrollReveal>
          <div className="max-w-narrow space-y-4">
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
      </PageShell>
      <LocationSection />
    </>
  );
}
