"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { isValidSlug } from "@/lib/slug";

const InputSchema = z.object({
  title: z.string().min(1, "제목을 입력하세요."),
  slug: z.string().min(1, "slug를 입력하세요."),
  summary: z.string().min(1, "요약을 입력하세요."),
  category: z.enum(["news", "article", "update"]),
  tags: z.array(z.string()),
  coverImage: z.string().min(1, "커버 이미지를 입력하세요."),
  body: z.string().min(1, "본문을 입력하세요."),
  draft: z.boolean(),
});

export type CreatePostInput = z.infer<typeof InputSchema>;
export type CreatePostResult =
  | { ok: true; slug: string }
  | { ok: false; error: string };

// 오늘 날짜(YYYY-MM-DD). 서버 액션 런타임이라 Date 사용 가능.
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function createPost(
  raw: CreatePostInput
): Promise<CreatePostResult> {
  const parsed = InputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "입력 오류" };
  }
  const input = parsed.data;

  if (!isValidSlug(input.slug)) {
    return {
      ok: false,
      error: "slug는 영문 소문자·숫자·하이픈만 가능합니다 (예: my-post).",
    };
  }

  // slug가 이미 있으면 에러 대신 -2, -3...을 붙여 빈 주소를 찾는다.
  // (기본값이 날짜라 같은 날 여러 글을 써도 자동으로 구분된다.)
  let finalSlug = input.slug;
  for (let n = 2; ; n++) {
    const existing = await db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.slug, finalSlug));
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
    body: input.body,
    draft: input.draft,
    publishedAt: today(),
  });

  // 목록/상세/RSS/사이트맵 캐시 일괄 무효화(Next 16 태그 무효화 API).
  updateTag("posts");

  return { ok: true, slug: finalSlug };
}
