import { desc, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { db } from "./index";
import { posts } from "./schema";
import { sanitizeBody } from "@/lib/html/sanitize";
import type { Post, PostCategory } from "@/lib/posts";
import type { Locale } from "@/i18n/routing";

export type PostRow = typeof posts.$inferSelect;

// timestamp 컬럼은 fresh 조회 시 Date이지만, unstable_cache(JSON 직렬화)를
//거치면 문자열로 돌아온다. 양쪽 모두 "YYYY-MM-DD"로 정규화한다.
function toDateStr(v: Date | string | null): string | undefined {
  if (!v) return undefined;
  return (v instanceof Date ? v.toISOString() : String(v)).slice(0, 10);
}

// date 컬럼은 드라이버에서 "YYYY-MM-DD" 문자열로, timestamp는 Date로 반환된다.
export function rowToPost(row: PostRow, locale: Locale): Post {
  return {
    title: row.title,
    summary: row.summary,
    coverImage: row.coverImage,
    category: row.category as PostCategory,
    tags: row.tags ?? [],
    publishedAt: String(row.publishedAt).slice(0, 10),
    updatedAt: toDateStr(row.updatedAt),
    author: row.author,
    draft: row.draft,
    source: row.source ?? undefined,
    sourceUrl: row.sourceUrl ?? undefined,
    aiGenerated: row.aiGenerated,
    slug: row.slug,
    locale,
    body: row.body,
  };
}

export async function queryAllPosts(
  includeDrafts: boolean
): Promise<PostRow[]> {
  const rows = await db.select().from(posts).orderBy(desc(posts.publishedAt));
  return includeDrafts ? rows : rows.filter((r) => !r.draft);
}

export async function queryPostBySlug(slug: string): Promise<PostRow | null> {
  const rows = await db.select().from(posts).where(eq(posts.slug, slug));
  return rows[0] ?? null;
}

export type NewPostInput = {
  title: string;
  slug: string;
  summary: string;
  category: PostCategory;
  tags: string[];
  coverImage: string;
  body: string;
  draft: boolean;
  aiGenerated: boolean;
  source?: string | null;
  sourceUrl?: string | null;
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// slug/sanitize/캐시무효화 로직을 한 곳에 모은다. 사람이 쓰는 `createPost`
// server action과 에이전트 전용 API 라우트가 이 함수 하나를 공유한다 —
// 입력 경로가 둘이어도 검증·정화 로직은 하나로 유지해 drift를 막는다.
export async function insertPost(input: NewPostInput): Promise<{ slug: string }> {
  let finalSlug = input.slug;
  for (let n = 2; ; n++) {
    const existing = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, finalSlug));
    if (existing.length === 0) break;
    finalSlug = `${input.slug}-${n}`;
  }

  await db.insert(posts).values({
    slug: finalSlug,
    title: input.title,
    summary: input.summary,
    coverImage: input.coverImage,
    category: input.category,
    tags: input.tags,
    body: sanitizeBody(input.body),
    draft: input.draft,
    aiGenerated: input.aiGenerated,
    publishedAt: today(),
    source: input.source || null,
    sourceUrl: input.sourceUrl || null,
  });

  updateTag("posts");
  return { slug: finalSlug };
}
