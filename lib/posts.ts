import { unstable_cache } from "next/cache";
import type { Locale } from "@/i18n/routing";
import { queryAllPosts, queryPostBySlug, rowToPost } from "@/lib/db/posts-repo";

export type PostCategory = "news" | "article" | "update";

// 글 한 건의 콘텐츠 형태. DB 행을 이 형태로 매핑한다(rowToPost).
export type PostFrontmatter = {
  title: string;
  summary: string;
  coverImage: string;
  category: PostCategory;
  tags: string[];
  publishedAt: string;
  updatedAt?: string;
  author: string;
  draft: boolean;
  source?: string;
  sourceUrl?: string;
  aiGenerated: boolean;
};

export type Post = PostFrontmatter & {
  slug: string;
  locale: Locale;
  body: string;
};

const isProd = process.env.NODE_ENV === "production";

// 모든 글 조회를 캐시 태그 "posts"로 감싼다. 관리자 쓰기(2~4단계)에서
// revalidateTag("posts")로 목록/상세/RSS/사이트맵을 일괄 무효화한다.
const loadPosts = unstable_cache(
  async (includeDrafts: boolean) => queryAllPosts(includeDrafts),
  ["posts-all"],
  { tags: ["posts"] }
);

export async function getAllPosts(locale: Locale): Promise<Post[]> {
  const rows = await loadPosts(!isProd);
  return rows.map((r) => rowToPost(r, locale));
}

export async function getPost(slug: string, locale: Locale): Promise<Post> {
  const row = await queryPostBySlug(slug);
  if (!row) throw new Error(`Post not found: ${slug}`);
  return rowToPost(row, locale);
}

export async function getAllPostSlugs(): Promise<string[]> {
  const rows = await loadPosts(true);
  return [...new Set(rows.map((r) => r.slug))];
}

export async function getAllTags(locale: Locale): Promise<string[]> {
  const posts = await getAllPosts(locale);
  return [...new Set(posts.flatMap((p) => p.tags))];
}

export async function getAllCategories(
  locale: Locale
): Promise<PostCategory[]> {
  const posts = await getAllPosts(locale);
  return [...new Set(posts.map((p) => p.category))];
}

export async function getPostsByTag(
  tag: string,
  locale: Locale
): Promise<Post[]> {
  return (await getAllPosts(locale)).filter((p) => p.tags.includes(tag));
}

export async function getPostsByCategory(
  category: string,
  locale: Locale
): Promise<Post[]> {
  return (await getAllPosts(locale)).filter((p) => p.category === category);
}
