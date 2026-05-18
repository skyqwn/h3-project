import { useTranslations } from "next-intl";
import type { Post } from "@/lib/posts";
import { PostCard } from "./PostCard";

export function PostGrid({ posts }: { posts: Post[] }) {
  const t = useTranslations("blog");
  if (posts.length === 0) {
    return <p className="text-body-md text-mute">{t("empty")}</p>;
  }
  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((p) => (
        <li key={p.slug}>
          <PostCard post={p} />
        </li>
      ))}
    </ul>
  );
}
