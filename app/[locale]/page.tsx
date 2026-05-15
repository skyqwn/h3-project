import { setRequestLocale, getTranslations } from "next-intl/server";
import { Hero } from "@/components/sections/Hero";
import { FeatureCardRow } from "@/components/sections/FeatureCardRow";
import { ProductShowcase } from "@/components/sections/ProductShowcase";
import { CtaStrip } from "@/components/sections/CtaStrip";
import type { ProductTeaser } from "@/components/sections/ProductShowcase";

// Placeholder product data — replaced by the MDX loader in Phase 5.
const MOCK_PRODUCTS: ProductTeaser[] = [
  {
    slug: "sample-one",
    title: "Product One",
    tagline: "Placeholder product card.",
    hero_image: "/hero-placeholder.jpg",
  },
  {
    slug: "sample-two",
    title: "Product Two",
    tagline: "Placeholder product card.",
    hero_image: "/hero-placeholder.jpg",
  },
  {
    slug: "sample-three",
    title: "Product Three",
    tagline: "Placeholder product card.",
    hero_image: "/hero-placeholder.jpg",
  },
];

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const home = await getTranslations("home");

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
      <ProductShowcase title={home("products.title")} products={MOCK_PRODUCTS} />
      <CtaStrip
        title={home("closing.title")}
        ctaLabel={home("closing.cta")}
        ctaHref="/contact"
      />
    </>
  );
}
