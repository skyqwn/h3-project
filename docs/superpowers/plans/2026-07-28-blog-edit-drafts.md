# 블로그 임시저장 + 편집/삭제 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 관리자 글 목록에서 임시저장/발행글을 관리하고, 기존 글을 편집·발행 전환·삭제할 수 있게 한다.

**Architecture:** 공개 사이트의 draft 비공개는 기존 `!isProd`/`notFound` 로직 그대로 둔다(변경 없음). 관리자 목록만 `queryAllPosts(true)`로 draft를 항상 보여주고, `PostForm`을 작성/편집 겸용으로 확장, `updatePost`/`deletePost` 서버 액션을 추가한다. 삭제 시 해당 글의 Blob 이미지(`blog/<slug>/`)도 정리한다.

**Tech Stack:** Next.js 16, React 19, TypeScript strict, Drizzle, @vercel/blob, next/cache `updateTag`.

## Global Constraints

- 패키지 매니저 **pnpm** 고정.
- 공개 라우트(blog 목록/상세/sitemap/RSS/generateStaticParams)는 **변경 금지** — draft 비공개 이미 구현됨.
- 관리자 목록은 `queryAllPosts(true)`(draft 포함) 사용. 공개 `getAllPosts`는 draft를 프로덕션에서 거르므로 관리자엔 쓰지 않는다.
- 저장 후 이동: **발행 → `/blog/<slug>`**, **임시저장 → `/admin`**.
- `/admin`은 한국어 전용(next-intl 밖). 노출 문구 한국어.
- 매 태스크 종료 시 `pnpm exec tsc --noEmit` + `pnpm run lint` 통과.
- **커밋/푸시는 사용자가 명시적으로 지시할 때만.** 각 태스크 commit 단계는 승인 시 실행, 그 전엔 tsc/lint로만 검증. 커밋 전 `pnpm build` exit 0.
- `.claude/settings.json`은 스테이징하지 않는다(기존 수정).

---

### Task 1: updatePost / deletePost 서버 액션

**Files:**
- Modify: `actions/admin/posts.ts`

**Interfaces:**
- Consumes: 기존 `InputSchema`, `db`, `posts`, `isValidSlug`, `@vercel/blob` `list`/`del`.
- Produces:
  - `updatePost(originalSlug: string, raw: CreatePostInput): Promise<CreatePostResult>` — originalSlug로 글을 찾아 갱신. slug 변경 시 자기 자신 제외 중복이면 `-2`… 부여. `updatedAt` 갱신. 반환 slug=최종 slug.
  - `deletePost(slug: string): Promise<{ ok: true } | { ok: false; error: string }>` — DB 행 삭제 + `blog/<slug>/` Blob 정리.

- [ ] **Step 1: import에 필요한 것 추가**

`actions/admin/posts.ts` 상단 import를 아래로 교체:
```ts
"use server";

import { z } from "zod";
import { and, eq, ne } from "drizzle-orm";
import { updateTag } from "next/cache";
import { list, del } from "@vercel/blob";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { isValidSlug } from "@/lib/slug";
```

- [ ] **Step 2: updatePost 추가**

`createPost` 함수 정의 바로 아래에 추가:
```ts
export async function updatePost(
  originalSlug: string,
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

  const target = await db
    .select({ id: posts.id })
    .from(posts)
    .where(eq(posts.slug, originalSlug));
  if (target.length === 0) {
    return { ok: false, error: "수정할 글을 찾을 수 없습니다." };
  }

  // slug가 바뀌면 다른 글과 중복되지 않게 -2… 부여(자기 자신 제외).
  let finalSlug = input.slug;
  for (let n = 2; ; n++) {
    const clash = await db
      .select({ id: posts.id })
      .from(posts)
      .where(and(eq(posts.slug, finalSlug), ne(posts.slug, originalSlug)));
    if (clash.length === 0) break;
    finalSlug = `${input.slug}-${n}`;
  }

  await db
    .update(posts)
    .set({
      slug: finalSlug,
      title: input.title,
      summary: input.summary,
      coverImage: input.coverImage,
      category: input.category,
      tags: input.tags,
      body: input.body,
      draft: input.draft,
      updatedAt: new Date(),
    })
    .where(eq(posts.slug, originalSlug));

  updateTag("posts");
  return { ok: true, slug: finalSlug };
}
```

- [ ] **Step 3: deletePost 추가**

이어서 추가:
```ts
export async function deletePost(
  slug: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const target = await db
    .select({ id: posts.id })
    .from(posts)
    .where(eq(posts.slug, slug));
  if (target.length === 0) {
    return { ok: false, error: "삭제할 글을 찾을 수 없습니다." };
  }

  await db.delete(posts).where(eq(posts.slug, slug));

  // 이 글의 Blob 이미지 정리(best-effort). 실패해도 삭제 자체는 성공 처리.
  try {
    const { blobs } = await list({ prefix: `blog/${slug}/` });
    if (blobs.length > 0) await del(blobs.map((b) => b.url));
  } catch (e) {
    console.error("[deletePost] blob 정리 실패:", e);
  }

  updateTag("posts");
  return { ok: true };
}
```

- [ ] **Step 4: 타입/린트**

Run:
```bash
pnpm exec tsc --noEmit && pnpm run lint
```
Expected: 오류 없음.

- [ ] **Step 5: 커밋(사용자 승인 시)**

```bash
git add actions/admin/posts.ts
git commit -m "블로그(관리자): 글 수정/삭제 서버 액션(updatePost/deletePost)"
```

---

### Task 2: PostForm 작성/편집 겸용

**Files:**
- Modify: `components/admin/PostForm.tsx`

**Interfaces:**
- Consumes: `createPost`, `updatePost` (Task 1).
- Produces: `<PostForm mode? initialPost? />` — `mode: "new" | "edit"`(기본 "new"), `initialPost?`로 기존 값 주입.

- [ ] **Step 1: import에 updatePost 추가**

`import { createPost } from "@/actions/admin/posts";` 를:
```ts
import { createPost, updatePost } from "@/actions/admin/posts";
import type { CreatePostInput } from "@/actions/admin/posts";
```

- [ ] **Step 2: props + 초기값 + 제출 분기 수정**

`export function PostForm() {` 부터 `function submit` 끝까지를 아래로 교체:
```tsx
type InitialPost = {
  slug: string;
  title: string;
  summary: string;
  category: (typeof CATEGORIES)[number];
  tags: string[];
  coverImage: string;
  body: string;
  draft: boolean;
};

export function PostForm({
  mode = "new",
  initialPost,
}: {
  mode?: "new" | "edit";
  initialPost?: InitialPost;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(initialPost?.title ?? "");
  const [slug, setSlug] = useState(initialPost?.slug ?? "");
  const [summary, setSummary] = useState(initialPost?.summary ?? "");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>(
    initialPost?.category ?? "article"
  );
  const [tags, setTags] = useState(initialPost?.tags.join(", ") ?? "");
  const [coverImage, setCoverImage] = useState(
    initialPost?.coverImage ?? "/og-default.png"
  );
  const [body, setBody] = useState(initialPost?.body ?? "");

  // 새 글일 때만 URL(slug) 기본값을 오늘 날짜로 채운다. 편집은 기존 slug 유지.
  useEffect(() => {
    if (initialPost) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 클라이언트 전용 현재 날짜 주입
    setSlug((cur) => (cur === "" ? todayStr() : cur));
  }, [initialPost]);

  function submit(draft: boolean) {
    setError(null);
    startTransition(async () => {
      const payload: CreatePostInput = {
        title,
        slug,
        summary,
        category,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        coverImage,
        body,
        draft,
      };
      const result =
        mode === "edit" && initialPost
          ? await updatePost(initialPost.slug, payload)
          : await createPost(payload);
      if (result.ok) {
        // 임시저장은 관리자 목록으로, 발행은 공개 글로 이동.
        router.push(draft ? "/admin" : `/blog/${result.slug}`);
      } else {
        setError(result.error);
      }
    });
  }
```

- [ ] **Step 3: 발행 버튼 라벨을 편집 모드에 맞게(선택)**

`{pending ? "저장 중…" : "발행하기"}` 는 그대로 둔다(편집 시에도 "발행하기"가
자연스러움 — 발행 전환 포함).

- [ ] **Step 4: 타입/린트**

Run:
```bash
pnpm exec tsc --noEmit && pnpm run lint
```
Expected: 오류 없음.

- [ ] **Step 5: 커밋(사용자 승인 시)**

```bash
git add components/admin/PostForm.tsx
git commit -m "블로그(관리자): PostForm 작성/편집 겸용(initialPost·updatePost)"
```

---

### Task 3: 편집 페이지 라우트

**Files:**
- Create: `app/admin/posts/[slug]/edit/page.tsx`

**Interfaces:**
- Consumes: `queryPostBySlug`, `rowToPost` (posts-repo), `<PostForm mode="edit" initialPost>`.

- [ ] **Step 1: 편집 페이지 작성**

Create `app/admin/posts/[slug]/edit/page.tsx`:
```tsx
import { notFound } from "next/navigation";
import { PostForm } from "@/components/admin/PostForm";
import { queryPostBySlug, rowToPost } from "@/lib/db/posts-repo";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const row = await queryPostBySlug(slug);
  if (!row) notFound();
  const post = rowToPost(row, "ko");

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">글 편집</h1>
      <PostForm
        mode="edit"
        initialPost={{
          slug: post.slug,
          title: post.title,
          summary: post.summary,
          category: post.category,
          tags: post.tags,
          coverImage: post.coverImage,
          body: post.body,
          draft: post.draft,
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: 타입/린트**

Run:
```bash
pnpm exec tsc --noEmit && pnpm run lint
```
Expected: 오류 없음.

- [ ] **Step 3: 커밋(사용자 승인 시)**

```bash
git add app/admin/posts/[slug]/edit/page.tsx
git commit -m "블로그(관리자): 글 편집 페이지(/admin/posts/[slug]/edit)"
```

---

### Task 4: 관리자 목록 — draft 항상 표시 + 편집/삭제

**Files:**
- Modify: `app/admin/page.tsx`
- Create: `components/admin/DeletePostButton.tsx`

**Interfaces:**
- Consumes: `queryAllPosts`, `rowToPost` (posts-repo), `deletePost` (Task 1).

- [ ] **Step 1: 삭제 버튼 컴포넌트**

Create `components/admin/DeletePostButton.tsx`:
```tsx
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePost } from "@/actions/admin/posts";

export function DeletePostButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!window.confirm("이 글을 삭제할까요? 되돌릴 수 없습니다.")) return;
    startTransition(async () => {
      const result = await deletePost(slug);
      if (result.ok) router.refresh();
      else window.alert(result.error);
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="text-sm text-red-600 hover:underline disabled:opacity-50"
    >
      {pending ? "삭제 중…" : "삭제"}
    </button>
  );
}
```

- [ ] **Step 2: 관리자 목록 페이지 교체**

Replace `app/admin/page.tsx` 전체:
```tsx
import Link from "next/link";
import { queryAllPosts, rowToPost } from "@/lib/db/posts-repo";
import { DeletePostButton } from "@/components/admin/DeletePostButton";

// 관리자 대시보드 = 글 목록. 배포 환경에서도 임시저장(draft)까지 모두 보여준다
// (공개 getAllPosts는 프로덕션에서 draft를 거르므로 여기선 직접 조회).
export default async function AdminHome() {
  const rows = await queryAllPosts(true);
  const posts = rows.map((r) => rowToPost(r, "ko"));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">글 목록 ({posts.length})</h1>
        <Link
          href="/admin/posts/new"
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          + 새 글
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="text-sm text-gray-500">아직 글이 없어요.</p>
      ) : (
        <ul className="divide-y divide-gray-200 rounded-md border border-gray-200 bg-white">
          {posts.map((p) => (
            <li
              key={p.slug}
              className="flex items-center justify-between px-4 py-3"
            >
              <div>
                <div className="font-medium">
                  {p.title}
                  {p.draft ? (
                    <span className="ml-2 rounded bg-yellow-100 px-1.5 py-0.5 text-xs text-yellow-800">
                      임시저장
                    </span>
                  ) : (
                    <span className="ml-2 rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-800">
                      발행
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {p.publishedAt} · /blog/{p.slug}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/admin/posts/${p.slug}/edit`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  편집
                </Link>
                {!p.draft && (
                  <Link
                    href={`/blog/${p.slug}`}
                    className="text-sm text-gray-500 hover:underline"
                  >
                    보기
                  </Link>
                )}
                <DeletePostButton slug={p.slug} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 3: 타입/린트**

Run:
```bash
pnpm exec tsc --noEmit && pnpm run lint
```
Expected: 오류 없음.

- [ ] **Step 4: 커밋(사용자 승인 시)**

```bash
git add app/admin/page.tsx components/admin/DeletePostButton.tsx
git commit -m "블로그(관리자): 목록에 임시저장 포함·상태 배지·편집/삭제"
```

---

### Task 5: E2E 스모크 + 빌드

**Files:** (없음 — 검증)

- [ ] **Step 1: 개발 서버(8000) 확인/기동**

8000에서 안 떠 있으면 백그라운드로 기동, 끝나면 트리 종료 + 포트 확인.

- [ ] **Step 2: browse 스모크**

`http://localhost:8000/admin/posts/new`:
1. 제목·요약 입력 → 본문 조금 입력 → **[임시저장]** → `/admin`으로 이동, 목록에
   해당 글이 **"임시저장" 배지**로 보임 확인.
2. 그 글 **[편집]** → 제목/본문 수정 → **[발행하기]** → `/blog/<slug>` 200,
   `/admin` 목록에서 배지가 **"발행"**으로 바뀜 확인.
3. **[삭제]** → confirm 수락 → `/admin` 목록에서 사라짐, `/blog/<slug>` 404,
   (이미지 올렸다면) `blog/<slug>/` Blob 제거 확인.

- [ ] **Step 3: DB/유닛/빌드**

```bash
pnpm run test:unit && pnpm run verify:posts
```
그다음 node 종료 후:
```bash
pnpm build
```
Expected: 각각 통과, build exit 0.

- [ ] **Step 4: 정리**

테스트로 만든 글은 삭제 기능으로 지우거나 스크립트로 정리. 서버 트리 종료 후 포트
확인.

---

## Self-Review 결과

- **스펙 커버리지:** 관리자 목록 draft 표시=Task4, 편집=Task2/3, 삭제=Task1/4,
  임시저장 후 이동=Task2, 상태 배지=Task4. 공개 라우트 무변경(스펙대로).
- **플레이스홀더:** 없음(모든 코드 완결).
- **타입 일관성:** `updatePost(originalSlug, CreatePostInput)`, `deletePost(slug)`,
  `PostForm({mode, initialPost})`, `DeletePostButton({slug})`, `queryAllPosts(true)`
  ·`rowToPost(row,"ko")` 일관.
- **주의:** `createPost`의 dedup 루프와 `updatePost`의 dedup 루프는 형태가 유사
  하지만 update는 `ne(posts.slug, originalSlug)`로 자기 제외 — 의도된 차이.
