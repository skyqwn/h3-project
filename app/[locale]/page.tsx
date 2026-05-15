import { setRequestLocale, getTranslations } from "next-intl/server";
import { Hero } from "@/components/sections/Hero";
import { FeatureCardRow } from "@/components/sections/FeatureCardRow";
import { ProductShowcase } from "@/components/sections/ProductShowcase";
import { CtaStrip } from "@/components/sections/CtaStrip";
import { getAllProducts } from "@/lib/mdx";
import type { Locale } from "@/i18n/routing";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const home = await getTranslations("home");
  const products = await getAllProducts(locale as Locale);

  const features = [
    {
      title: home("feature.tech.title"),
      body: home("feature.tech.body"),
      image: "/hero-placeholder.jpg",
      cta: { label: home("feature.tech.ctaLabel"), href: "/about" as const },
    },
    {
      title: home("feature.team.title"),
      body: home("feature.team.body"),
      image: "/hero-placeholder.jpg",
      cta: { label: home("feature.team.ctaLabel"), href: "/about" as const },
      reverse: true,
    },
  ];

  return (
    <>
      <Hero />
      <FeatureCardRow items={features} />
      <ProductShowcase
        title={home("products.title")}
        products={products.slice(0, 6)}
      />
      <CtaStrip
        title={home("closing.title")}
        ctaLabel={home("closing.cta")}
        ctaHref="/contact"
      />
    </>
  );
}
