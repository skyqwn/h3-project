import { useTranslations } from "next-intl";
import type { Post } from "@/lib/posts";
import { PostCard } from "./PostCard";

export function PostGrid({
  posts,
  emptyMessage,
}: {
  posts: Post[];
  /** Overrides the default "no posts yet" copy — e.g. a category-specific
   *  empty state like "아직 소식이 없습니다." for the news archive. */
  emptyMessage?: string;
}) {
  const t = useTranslations("blog");
  if (posts.length === 0) {
    return <p className="text-body-md text-mute">{emptyMessage ?? t("empty")}</p>;
  }
  return (
    // `auto-fill` (not `auto-fit`) keeps unused tracks as empty columns
    // instead of stretching existing cards to fill the row — with only 1-2
    // posts, `auto-fit` would blow each card up to half the page width.
    // minmax(240px, 1fr) still computes column count from available width.
    <ul
      className="grid gap-6"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}
    >
      {posts.map((p) => (
        <li key={p.slug}>
          <PostCard post={p} />
        </li>
      ))}
    </ul>
  );
}
