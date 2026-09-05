import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { AmbientBackground } from "@/components/layout/AmbientBackground";
import { Hero } from "@/components/sections/Hero";
import { HomeSolutionReveal } from "@/components/sections/HomeSolutionReveal";
import { GlobeSection } from "@/components/sections/GlobeSection";
import { NewsSection } from "@/components/sections/NewsSection";
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
      <AmbientBackground />
      <Hero />
      <HomeSolutionReveal />
      <GlobeSection />
      <NewsSection />
      <CtaStrip
        title={home("closing.title")}
        ctaLabel={home("closing.cta")}
        ctaHref="/contact"
      />
    </>
  );
}
