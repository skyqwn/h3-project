import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllTags, getPostsByTag } from "@/lib/posts";
import { pageMetadata } from "@/lib/seo";
import { PageShell } from "@/components/layout/PageShell";
import { PostGrid } from "@/components/blog/PostGrid";
import { routing, type Locale } from "@/i18n/routing";

export async function generateStaticParams() {
  const params: { locale: string; tag: string }[] = [];
  for (const locale of routing.locales) {
    for (const tag of await getAllTags(locale)) {
      params.push({ locale, tag: encodeURIComponent(tag) });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; tag: string }>;
}): Promise<Metadata> {
  const { locale, tag } = await params;
  const decoded = decodeURIComponent(tag);
  const t = await getTranslations({ locale, namespace: "blog" });
  return pageMetadata({
    locale: locale as Locale,
    path: `/blog/tag/${tag}`,
    title: `${t("tagLabel")}: ${decoded}`,
    description: `${t("title")} — ${t("tagLabel")} ${decoded}`,
  });
}

export default async function TagArchivePage({
  params,
}: {
  params: Promise<{ locale: string; tag: string }>;
}) {
  const { locale, tag } = await params;
  setRequestLocale(locale);
  const decoded = decodeURIComponent(tag);
  const t = await getTranslations("blog");
  const posts = await getPostsByTag(decoded, locale as Locale);
  if (posts.length === 0) notFound();

  return (
    <PageShell eyebrow={t("tagLabel")} title={`#${decoded}`}>
      <PostGrid posts={posts} />
    </PageShell>
  );
}
