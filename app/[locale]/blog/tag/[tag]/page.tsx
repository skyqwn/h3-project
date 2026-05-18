import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllTags, getPostsByTag } from "@/lib/posts";
import { pageMetadata } from "@/lib/seo";
import { DisplayHeading } from "@/components/primitives/DisplayHeading";
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
    <div className="min-h-screen bg-canvas py-section">
      <div className="max-w-page mx-auto px-6">
        <p className="text-caption-md uppercase tracking-wider text-mute mb-3">
          {t("tagLabel")}
        </p>
        <DisplayHeading level="lg" className="mb-12">
          #{decoded}
        </DisplayHeading>
        <PostGrid posts={posts} />
      </div>
    </div>
  );
}
