import { desc, eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
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
// 캐시 무효화는 revalidateTag를 쓴다 — updateTag는 Server Action 전용이라
// Route Handler(에이전트 라우트)에서 부르면 그대로 throw한다(2026-09-11 실사용 중 확인).
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

  revalidateTag("posts", {});
  return { slug: finalSlug };
}

export type PostContentPatch = Partial<
  Pick<NewPostInput, "title" | "summary" | "category" | "tags" | "coverImage" | "body">
>;

export type UpdatePostContentResult =
  | { ok: true }
  | { ok: false; error: "not_found" | "already_published" };

// 에이전트 피드백 수정 전용. slug는 절대 안 바꾼다(링크 깨짐 방지, dedupe 로직도 불필요).
// 이미 발행된(draft:false) 글은 거부한다 — 발행 후에는 사람이 직접 관리자에서 고치게 한다.
// 매 쓰기마다 draft:true를 강제 재적용한다 — 이 경로로 발행 상태를 바꿀 수 없게 하는 것과
// 같은 이유(에이전트가 공개 여부를 절대 못 건드리게).
export async function updatePostContent(
  slug: string,
  patch: PostContentPatch
): Promise<UpdatePostContentResult> {
  const rows = await db.select().from(posts).where(eq(posts.slug, slug));
  const row = rows[0];
  if (!row) return { ok: false, error: "not_found" };
  if (!row.draft) return { ok: false, error: "already_published" };

  await db
    .update(posts)
    .set({
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.summary !== undefined ? { summary: patch.summary } : {}),
      ...(patch.category !== undefined ? { category: patch.category } : {}),
      ...(patch.tags !== undefined ? { tags: patch.tags } : {}),
      ...(patch.coverImage !== undefined ? { coverImage: patch.coverImage } : {}),
      ...(patch.body !== undefined ? { body: sanitizeBody(patch.body) } : {}),
      draft: true,
      updatedAt: new Date(),
    })
    .where(eq(posts.slug, slug));

  revalidateTag("posts", {});
  return { ok: true };
}
