import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAgentKey } from "@/lib/auth/require-agent";
import { isValidSlug } from "@/lib/slug";
import { insertPost, listRecentDrafts } from "@/lib/db/posts-repo";

// 세션이 "방금 그 글"을 잊어버렸을 때 에이전트가 참고할 최근 draft 목록.
// 발행된 글은 안 나온다 — 최근 만든 draft만.
export async function GET(request: Request): Promise<NextResponse> {
  if (!requireAgentKey(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const drafts = await listRecentDrafts(5);
  return NextResponse.json({
    ok: true,
    drafts: drafts.map((row) => ({ slug: row.slug, title: row.title, updatedAt: row.updatedAt })),
  });
}

// H3 Agent(Cloudflare Worker) 전용 draft 생성 API. x-agent-key로 인증한다
// (세션 쿠키를 쓰는 관리자 화면의 createPost와는 별개 경로 — 계획: docs/BLOG_AGENT_PLAN.md).
//
// draft/aiGenerated는 요청 바디로 받지 않고 이 라우트가 고정 적용한다.
// 이 경로로 글을 바로 공개(draft:false)하는 건 스키마 자체에 없어 불가능하다
// — 발행은 사람이 관리자 화면의 기존 "발행" 토글로만 한다.
const InputSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  summary: z.string().min(1).max(500),
  category: z.enum(["news", "blog", "update"]),
  tags: z.array(z.string().max(40)).max(20),
  coverImage: z.string().url(),
  body: z.string().min(1).max(200_000),
});

export async function POST(request: Request): Promise<NextResponse> {
  if (!requireAgentKey(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = InputSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "입력 오류" },
      { status: 422 }
    );
  }
  const input = parsed.data;

  if (!isValidSlug(input.slug)) {
    return NextResponse.json(
      { ok: false, error: "slug는 영문 소문자·숫자·하이픈만 가능합니다 (예: my-post)." },
      { status: 422 }
    );
  }

  const { slug } = await insertPost({ ...input, draft: true, aiGenerated: true });
  return NextResponse.json({ ok: true, slug });
}
