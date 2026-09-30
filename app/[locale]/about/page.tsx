import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { AboutDomains } from "@/components/sections/AboutDomains";
import { AboutStrengths } from "@/components/sections/AboutStrengths";
import { AboutVision } from "@/components/sections/AboutVision";
import { AboutLocationTeaser } from "@/components/sections/AboutLocationTeaser";
import { AboutIntro } from "@/components/sections/AboutIntro";
import { AboutWork } from "@/components/sections/AboutWork";
import { AboutQuestions } from "@/components/sections/AboutQuestions";
import { CtaStrip } from "@/components/sections/CtaStrip";
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
    title: t("meta.title"),
    description: t("meta.description"),
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
    <div className="about-page">
      <AboutIntro />
      <AboutDomains />
      <AboutWork />
      <AboutStrengths />
      <AboutVision />
      <AboutQuestions />
      <CtaStrip
        title={t("closing.title")}
        ctaLabel={t("closing.cta")}
        ctaHref="/contact"
      />
      <AboutLocationTeaser />
    </div>
  );
}
