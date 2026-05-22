import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllCategories, getPostsByCategory } from "@/lib/posts";
import { pageMetadata } from "@/lib/seo";
import { PageShell } from "@/components/layout/PageShell";
import { PostGrid } from "@/components/blog/PostGrid";
import { routing, type Locale } from "@/i18n/routing";

const VALID = ["news", "article", "update"] as const;

export async function generateStaticParams() {
  const params: { locale: string; category: string }[] = [];
  for (const locale of routing.locales) {
    for (const category of await getAllCategories(locale)) {
      params.push({ locale, category });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}): Promise<Metadata> {
  const { locale, category } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  const label = VALID.includes(category as (typeof VALID)[number])
    ? t(`category.${category}`)
    : category;
  return pageMetadata({
    locale: locale as Locale,
    path: `/blog/category/${category}`,
    title: `${t("categoryLabel")}: ${label}`,
    description: `${t("title")} — ${label}`,
  });
}

export default async function CategoryArchivePage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}) {
  const { locale, category } = await params;
  setRequestLocale(locale);
  if (!VALID.includes(category as (typeof VALID)[number])) notFound();
  const t = await getTranslations("blog");
  const posts = await getPostsByCategory(category, locale as Locale);
  if (posts.length === 0) notFound();

  return (
    <PageShell eyebrow={t("categoryLabel")} title={t(`category.${category}`)}>
      <PostGrid posts={posts} />
    </PageShell>
  );
}
