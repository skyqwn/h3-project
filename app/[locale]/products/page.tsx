import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { getAllProducts } from "@/lib/mdx";
import { PageShell } from "@/components/layout/PageShell";
import { ProductCard } from "@/components/sections/ProductCard";
import { pageMetadata } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "products" });
  return pageMetadata({
    locale: locale as Locale,
    path: "/products",
    title: t("title"),
    description: t("subtitle"),
  });
}

export default async function ProductsListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("products");
  const products = await getAllProducts(locale as Locale);

  return (
    <PageShell eyebrow={t("subtitle")} title={t("title")}>
      {products.length === 0 ? (
        <p className="text-body-md text-mute">No products yet.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <li key={p.slug}>
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
