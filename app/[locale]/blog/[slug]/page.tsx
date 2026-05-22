import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { rehypeImageDimensions } from "@/lib/rehype-image-dimensions";
import type { Metadata } from "next";
import { getAllPosts, getPost } from "@/lib/posts";
import { mdxComponents } from "@/mdx-components";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { pageMetadata, articleJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { routing, type Locale } from "@/i18n/routing";
import type { Post } from "@/lib/posts";

export async function generateStaticParams() {
  // Per-locale from getAllPosts so drafts are excluded in production and
  // a KO-only post never generates an /en param.
  const params: { locale: string; slug: string }[] = [];
  for (const locale of routing.locales) {
    for (const post of await getAllPosts(locale)) {
      params.push({ locale, slug: post.slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  try {
    const post = await getPost(slug, locale as Locale);
    return pageMetadata({
      locale: locale as Locale,
      path: `/blog/${slug}`,
      title: post.title,
      description: post.summary,
      image: post.coverImage,
      article: {
        publishedTime: post.publishedAt,
        modifiedTime: post.updatedAt,
        authors: [post.author],
      },
    });
  } catch {
    return pageMetadata({
      locale: locale as Locale,
      path: `/blog/${slug}`,
      title: "Post",
      description: "Post",
      noindex: true,
    });
  }
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  let post: Post;
  try {
    post = await getPost(slug, locale as Locale);
  } catch {
    notFound();
  }

  // Defense-in-depth: a draft must not be reachable by direct URL in
  // production even though getPost (single) does not filter drafts.
  if (post.draft && process.env.NODE_ENV === "production") {
    notFound();
  }

  const t = await getTranslations("blog");
  const article = articleJsonLd({
    title: post.title,
    summary: post.summary,
    slug: post.slug,
    locale: post.locale,
    image: post.coverImage,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    author: post.author,
  });
  const breadcrumb = breadcrumbJsonLd(post.locale, [
    { name: "Home", path: "/" },
    { name: t("title"), path: "/blog" },
    { name: post.title, path: `/blog/${post.slug}` },
  ]);

  return (
    <article className="min-h-screen bg-canvas py-section">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(article) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <div className="max-w-narrow mx-auto px-6">
        <Eyebrow className="mb-3">
          {t(`category.${post.category}`)} · {t("publishedOn")}{" "}
          {post.publishedAt}
        </Eyebrow>
        <h1 className="text-display-lg text-ink mb-12">{post.title}</h1>
        <div className="relative mb-12 aspect-[16/10] w-full overflow-hidden rounded-lg bg-surface-card">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            priority
            sizes="(min-width: 800px) 768px, 100vw"
            className="object-cover"
          />
        </div>
        <MDXRemote
          source={post.body}
          components={mdxComponents}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm],
              rehypePlugins: [rehypeImageDimensions],
            },
          }}
        />
      </div>
    </article>
  );
}
