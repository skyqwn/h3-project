import { getTranslations, getLocale } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { getPostsByCategory } from "@/lib/posts";
import type { Locale } from "@/i18n/routing";

// Homepage teaser for real press coverage (category: "news" — see
// lib/posts.ts). Distinct from the blog's own articles: each of these
// posts is expected to carry a `source`/`sourceUrl` pointing at the actual
// outlet the story ran on (shown as "원문 보기" on the detail page).
export async function NewsSection() {
  const t = await getTranslations("home.news");
  const locale = (await getLocale()) as Locale;
  const news = (await getPostsByCategory("news", locale)).slice(0, 4);

  if (news.length === 0) return null;

  return (
    <section className="relative z-10 px-6 py-section lg:px-[120px]">
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-heading-xl text-ink md:text-display-lg">
          {t("title")}
        </h2>
        <Link
          href="/news"
          className="inline-flex items-center gap-2 rounded-full border border-hairline px-5 py-2.5 text-body-sm font-bold text-ink transition-colors hover:border-ink"
        >
          {t("cta")}
          <span aria-hidden>→</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {news.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
            <p className="text-body-sm font-bold text-primary">
              {post.publishedAt}
            </p>
            <h3 className="mt-2 text-heading-md text-ink leading-snug group-hover:text-primary transition-colors">
              {post.title}
            </h3>
            <div className="relative mt-5 aspect-[4/3] overflow-hidden rounded-md border border-hairline bg-surface-card">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                sizes="(min-width: 1024px) 24vw, (min-width: 640px) 45vw, 90vw"
                className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
