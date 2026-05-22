import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import type { Post } from "@/lib/posts";

export function PostCard({ post }: { post: Post }) {
  const t = useTranslations("blog");
  return (
    <Link href={`/blog/${post.slug}`} className="block group">
      <div className="relative aspect-[16/10] overflow-hidden rounded-md bg-surface-card">
        <Image
          src={post.coverImage}
          alt={post.title}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
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
