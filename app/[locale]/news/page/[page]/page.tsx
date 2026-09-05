import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { getPostsByCategory } from "@/lib/posts";
import { paginate, PAGE_SIZE } from "@/lib/blog-pagination";
import { pageMetadata } from "@/lib/seo";
import { PageShell } from "@/components/layout/PageShell";
import { PostGrid } from "@/components/blog/PostGrid";
import { routing, type Locale } from "@/i18n/routing";

export async function generateStaticParams() {
  const params: { locale: string; page: string }[] = [];
  for (const locale of routing.locales) {
    const all = await getPostsByCategory("news", locale);
    const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
    for (let p = 2; p <= totalPages; p++) {
      params.push({ locale, page: String(p) });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; page: string }>;
}): Promise<Metadata> {
  const { locale, page } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  const label = t("category.news");
  return pageMetadata({
    locale: locale as Locale,
    path: `/news/page/${page}`,
    title: `${t("categoryLabel")}: ${label} — ${t("pageLabel")} ${page}`,
    description: `${t("title")} — ${label}`,
  });
}

export default async function NewsPaginatedPage({
  params,
}: {
  params: Promise<{ locale: string; page: string }>;
}) {
  const { locale, page } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("blog");
  const pageNum = Number(page);
  if (!Number.isInteger(pageNum) || pageNum < 2) notFound();

  const all = await getPostsByCategory("news", locale as Locale);
  let result;
  try {
    result = paginate(all, pageNum);
  } catch {
    notFound();
  }

  return (
    <PageShell
      eyebrow={t("categoryLabel")}
      title={`${t("category.news")} — ${t("pageLabel")} ${pageNum}`}
    >
      <PostGrid posts={result.items} />
      <nav className="mt-12 flex justify-center gap-6">
        <Link
          href={pageNum === 2 ? "/news" : `/news/page/${pageNum - 1}`}
          className="text-body-strong text-ink hover:text-primary transition-colors"
        >
          ← {t("prev")}
        </Link>
        {pageNum < result.totalPages && (
          <Link
            href={`/news/page/${pageNum + 1}`}
            className="text-body-strong text-ink hover:text-primary transition-colors"
          >
            {t("next")} →
          </Link>
        )}
      </nav>
    </PageShell>
  );
}
