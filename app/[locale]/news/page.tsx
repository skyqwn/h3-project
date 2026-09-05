import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { getPostsByCategory } from "@/lib/posts";
import { paginate } from "@/lib/blog-pagination";
import { pageMetadata } from "@/lib/seo";
import { PageShell } from "@/components/layout/PageShell";
import { PostGrid } from "@/components/blog/PostGrid";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  const label = t("category.news");
  return pageMetadata({
    locale: locale as Locale,
    path: "/news",
    title: `${t("categoryLabel")}: ${label}`,
    description: `${t("title")} — ${label}`,
  });
}

export default async function NewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("blog");
  const all = await getPostsByCategory("news", locale as Locale);
  const { items, totalPages } = paginate(all, 1);

  return (
    <PageShell eyebrow={t("categoryLabel")} title={t("category.news")}>
      <PostGrid posts={items} emptyMessage={t("newsEmpty")} />
      {totalPages > 1 && (
        <nav className="mt-12 flex justify-center">
          <Link
            href="/news/page/2"
            className="text-body-strong text-ink hover:text-primary transition-colors"
          >
            {t("next")} →
          </Link>
        </nav>
      )}
    </PageShell>
  );
}
