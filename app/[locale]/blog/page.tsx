import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { getAllPosts } from "@/lib/posts";
import { paginate } from "@/lib/blog-pagination";
import { pageMetadata } from "@/lib/seo";
import { DisplayHeading } from "@/components/primitives/DisplayHeading";
import { PostGrid } from "@/components/blog/PostGrid";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  return pageMetadata({
    locale: locale as Locale,
    path: "/blog",
    title: t("title"),
    description: t("subtitle"),
  });
}

export default async function BlogListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("blog");
  const all = await getAllPosts(locale as Locale);
  const { items, totalPages } = paginate(all, 1);

  return (
    <div className="min-h-screen bg-canvas py-section">
      <div className="max-w-page mx-auto px-6">
        <p className="text-caption-md uppercase tracking-wider text-mute mb-3">
          {t("subtitle")}
        </p>
        <DisplayHeading level="lg" className="mb-12">
          {t("title")}
        </DisplayHeading>
        <PostGrid posts={items} />
        {totalPages > 1 && (
          <nav className="mt-12 flex justify-center">
            <Link
              href="/blog/page/2"
              className="text-body-strong text-ink hover:text-primary transition-colors"
            >
              {t("next")} →
            </Link>
          </nav>
        )}
      </div>
    </div>
  );
}
