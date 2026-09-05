import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { AboutDomains } from "@/components/sections/AboutDomains";
import { AboutStrengths } from "@/components/sections/AboutStrengths";
import { AboutVision } from "@/components/sections/AboutVision";
import { AboutLocationTeaser } from "@/components/sections/AboutLocationTeaser";
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

  return (
    <>
      <AboutDomains />
      <AboutStrengths />
      <AboutVision />
      <AboutLocationTeaser />
    </>
  );
}
