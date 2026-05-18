import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import type { Post } from "@/lib/posts";

export function PostCard({ post }: { post: Post }) {
  const t = useTranslations("blog");
  return (
    <Link href={`/blog/${post.slug}`} className="block group">
      <div className="aspect-[16/10] rounded-md bg-surface-card overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.coverImage}
          alt={post.title}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>
      <p className="text-caption-md uppercase tracking-wider text-mute mt-3">
        {t(`category.${post.category}`)} · {post.publishedAt}
      </p>
      <h2 className="text-heading-md text-ink mt-1 group-hover:text-primary transition-colors">
        {post.title}
      </h2>
      <p className="text-body-sm text-mute mt-1">{post.summary}</p>
    </Link>
  );
}
