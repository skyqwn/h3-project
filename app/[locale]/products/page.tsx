import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getAllProducts } from "@/lib/mdx";
import { DisplayHeading } from "@/components/primitives/DisplayHeading";
import type { Locale } from "@/i18n/routing";

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
    <div className="min-h-screen bg-canvas py-section">
      <div className="max-w-page mx-auto px-6">
        <p className="text-caption-md uppercase tracking-wider text-mute mb-3">
          {t("subtitle")}
        </p>
        <DisplayHeading level="lg" className="mb-12">
          {t("title")}
        </DisplayHeading>

        {products.length === 0 ? (
          <p className="text-body-md text-mute">No products yet.</p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {products.map((p) => (
              <li key={p.slug}>
                <Link href={`/products/${p.slug}`} className="block group">
                  <div
                    className="aspect-[4/5] rounded-md bg-surface-card bg-cover bg-center overflow-hidden"
                    style={{
                      backgroundImage: `linear-gradient(135deg, #f6f6f3 0%, #dadad3 100%), url(${p.hero_image})`,
                    }}
                    aria-hidden
                  />
                  <h2 className="text-heading-md mt-3 text-ink">{p.title}</h2>
                  <p className="text-body-sm text-mute">{p.tagline}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
