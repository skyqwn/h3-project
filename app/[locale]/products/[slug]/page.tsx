import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import type { Metadata } from "next";
import { getAllProductSlugs, getProduct } from "@/lib/mdx";
import { mdxComponents } from "@/mdx-components";
import { pageMetadata, productJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { getTranslations } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import type { Product } from "@/lib/mdx";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  try {
    const product = await getProduct(slug, locale as Locale);
    return pageMetadata({
      locale: locale as Locale,
      path: `/products/${slug}`,
      title: product.title,
      description: product.tagline,
      image: product.hero_image,
    });
  } catch {
    return pageMetadata({
      locale: locale as Locale,
      path: `/products/${slug}`,
      title: "Product",
      description: "Product",
      noindex: true,
    });
  }
}

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return routing.locales.flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug }))
  );
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  let product: Product;
  try {
    product = await getProduct(slug, locale as Locale);
  } catch {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "products" });

  const productLd = productJsonLd({
    title: product.title,
    tagline: product.tagline,
    slug: product.slug,
    locale: product.locale,
    image: product.hero_image,
  });
  const breadcrumb = breadcrumbJsonLd(product.locale, [
    { name: "Home", path: "/" },
    { name: t("title"), path: "/products" },
    { name: product.title, path: `/products/${product.slug}` },
  ]);

  return (
    <article className="min-h-screen bg-canvas py-section">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <div className="max-w-narrow mx-auto px-6">
        <p className="text-caption-md uppercase tracking-wider text-mute mb-3">
          {product.tagline}
        </p>
        <h1 className="text-display-lg text-ink mb-12">{product.title}</h1>
        <div
          className="aspect-[16/10] rounded-lg bg-surface-card bg-cover bg-center mb-12"
          style={{
            backgroundImage: `linear-gradient(135deg, #f6f6f3 0%, #dadad3 100%), url(${product.hero_image})`,
          }}
          aria-hidden
        />
        <MDXRemote source={product.body} components={mdxComponents} />
      </div>
    </article>
  );
}
