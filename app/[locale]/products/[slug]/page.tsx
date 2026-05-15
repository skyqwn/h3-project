import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllProductSlugs, getProduct } from "@/lib/mdx";
import { useMDXComponents } from "@/mdx-components";
import { routing, type Locale } from "@/i18n/routing";
import type { Product } from "@/lib/mdx";

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

  const components = useMDXComponents({});

  return (
    <article className="min-h-screen bg-canvas py-section">
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
        <MDXRemote source={product.body} components={components} />
      </div>
    </article>
  );
}
