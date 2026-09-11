import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAgentKey } from "@/lib/auth/require-agent";
import { queryPostBySlug, updatePostContent } from "@/lib/db/posts-repo";

// H3 Agent 전용 draft 조회/수정 API. x-agent-key로 인증한다 — 계획: docs/BLOG_AGENT_PLAN.md.
// slug는 이 경로로 절대 안 바뀐다. draft는 여기서 항상 true로 고정 — 발행 상태 전환은
// 이 API로 불가능하다(발행은 사람이 관리자 화면의 "발행" 토글로만).

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  if (!requireAgentKey(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const { slug } = await params;
  const row = await queryPostBySlug(slug);
  if (!row) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({
    ok: true,
    post: {
      title: row.title,
      summary: row.summary,
      category: row.category,
      tags: row.tags ?? [],
      coverImage: row.coverImage,
      body: row.body,
      draft: row.draft,
    },
  });
}

const PatchSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    summary: z.string().min(1).max(500).optional(),
    category: z.enum(["news", "blog", "update"]).optional(),
    tags: z.array(z.string().max(40)).max(20).optional(),
    coverImage: z.string().url().optional(),
    body: z.string().min(1).max(200_000).optional(),
  })
  .strict();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  if (!requireAgentKey(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const { slug } = await params;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "입력 오류" },
      { status: 422 }
    );
  }
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ ok: false, error: "no_fields_to_update" }, { status: 422 });
  }

  const result = await updatePostContent(slug, parsed.data);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: result.error === "not_found" ? 404 : 409 }
    );
  }
  return NextResponse.json({ ok: true, slug });
}
