import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { Hero } from "@/components/sections/Hero";
import { HomeSolutionReveal } from "@/components/sections/HomeSolutionReveal";
import { ServiceGrid } from "@/components/sections/ServiceGrid";
import { ProcessOrbit } from "@/components/sections/ProcessOrbit";
import { IndustriesSection } from "@/components/sections/IndustriesSection";
import { FaqSection } from "@/components/sections/FaqSection";
import { CtaStrip } from "@/components/sections/CtaStrip";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home.meta" });
  return pageMetadata({
    locale: locale as Locale,
    path: "/",
    title: t("title"),
    description: t("description"),
    // title already carries the brand ("H3 Tech | ...") — don't append "— H3".
    appendBrand: false,
  });
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const home = await getTranslations("home");

  return (
    <>
      <Hero />
      <HomeSolutionReveal />
      <ServiceGrid />
      <ProcessOrbit />
      <IndustriesSection />
      <FaqSection />
      <CtaStrip
        title={home("closing.title")}
        ctaLabel={home("closing.cta")}
        ctaHref="/contact"
      />
    </>
  );
}
