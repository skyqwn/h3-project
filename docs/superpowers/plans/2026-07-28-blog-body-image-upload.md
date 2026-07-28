# 블로그 본문 이미지 업로드 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 관리자 글쓰기 폼의 리치텍스트 에디터 본문에 여러 이미지를 업로드·삽입하고, next/image 규칙을 지키며 렌더한다.

**Architecture:** 이미지는 Vercel Blob(공개)에 **클라이언트 직접 업로드**(`@vercel/blob/client` + 토큰 발급 라우트)로 저장한다. 폴더는 `blog/<slug>/`. 업로드 직전 브라우저에서 픽셀 크기를 측정해 본문 URL에 `?w&h`로 실어, `mdx-components`의 `img`가 next/image로 렌더한다. 커버 이미지도 같은 업로드 경로로 통일한다(커버는 `fill`이라 치수 불필요).

**Tech Stack:** Next.js 16, React 19, TypeScript strict, `@vercel/blob` v2(`/client`), Tiptap v3(`@tiptap/extension-image`), tiptap-markdown, next/image.

## Global Constraints

- 패키지 매니저는 **pnpm** 고정. `npm` 금지.
- 모든 이미지는 **next/image**로 렌더(raw `<img>`는 치수 없는 안전망 폴백만).
- Blob 폴더 키는 **slug**: `blog/<slug>/cover.<ext>`, `blog/<slug>/body.<ext>` (서버가 `addRandomSuffix`로 유니크화).
- 허용 이미지: `image/jpeg`, `image/png`, `image/webp`, `image/avif`. 최대 5MB(서버 토큰에서 강제).
- slug가 없으면 업로드 버튼 비활성화(폴더가 slug 기준).
- `/admin`은 한국어 전용(next-intl 밖). 노출 문구는 한국어.
- 매 태스크 종료 시 `pnpm exec tsc --noEmit` + `pnpm run lint` 통과.
- **커밋/푸시는 사용자가 명시적으로 지시할 때만**(프로젝트 규칙). 각 태스크의 commit 단계는 사용자 승인 시 실행하고, 그 전엔 tsc/lint로만 검증한다. 커밋 전 `pnpm build`(exit 0) 선행.
- `next.config.ts`의 `experimental.serverActions.bodySizeLimit`은 **문의 폼 첨부용 기존 설정 — 건드리지 않는다**.
- `next.config.ts` `images.remotePatterns`에 `**.public.blob.vercel-storage.com` 이미 추가됨(재확인만).

---

### Task 1: 의존성 추가 + 이미지 치수 URL 헬퍼 (TDD)

순수 함수 `withDims`/`dimsFromSrc`를 만들고 유닛 테스트한다. 본문 이미지 Tiptap 확장도 함께 설치한다.

**Files:**
- Modify: `package.json` (deps: `@tiptap/extension-image`)
- Create: `lib/image-src.ts`
- Create: `tests/unit/image-src.test.ts`
- Modify: `tests/unit/run.ts`

**Interfaces:**
- Produces:
  - `withDims(url: string, width: number, height: number): string` — url에 `?w&h`(이미 `?` 있으면 `&`)로 치수 부착.
  - `dimsFromSrc(src: string): { width: number; height: number } | null` — src 쿼리에서 양의 정수 `w`,`h` 파싱, 없거나 부적합하면 null.

- [ ] **Step 1: 확장 패키지 설치**

Run:
```bash
pnpm add @tiptap/extension-image
```
Expected: `@tiptap/extension-image` 가 dependencies에 추가(버전 `^3.x`).

- [ ] **Step 2: 실패하는 테스트 작성**

Create `tests/unit/image-src.test.ts`:
```ts
import assert from "node:assert/strict";
import { withDims, dimsFromSrc } from "@/lib/image-src";

// withDims: 쿼리 없는 URL
assert.equal(
  withDims("https://x.blob/body.jpg", 1200, 800),
  "https://x.blob/body.jpg?w=1200&h=800"
);
// withDims: 이미 쿼리가 있는 URL
assert.equal(
  withDims("https://x.blob/body.jpg?v=1", 100, 50),
  "https://x.blob/body.jpg?v=1&w=100&h=50"
);
// dimsFromSrc: 정상
assert.deepEqual(dimsFromSrc("https://x.blob/body.jpg?w=1200&h=800"), {
  width: 1200,
  height: 800,
});
// dimsFromSrc: 쿼리 없음 → null
assert.equal(dimsFromSrc("https://x.blob/body.jpg"), null);
// dimsFromSrc: 0/음수/비정상 → null
assert.equal(dimsFromSrc("https://x.blob/body.jpg?w=0&h=10"), null);
assert.equal(dimsFromSrc("https://x.blob/body.jpg?w=abc&h=10"), null);

console.log("image-src.test: 6 assertions passed.");
```

- [ ] **Step 3: 테스트가 실패하는지 확인**

Run:
```bash
pnpm exec tsx tests/unit/image-src.test.ts
```
Expected: FAIL — `Cannot find module '@/lib/image-src'`.

- [ ] **Step 4: 최소 구현**

Create `lib/image-src.ts`:
```ts
// 본문 이미지 URL에 픽셀 치수를 쿼리로 싣고 다시 읽는 순수 헬퍼.
// 원격(Blob) 이미지는 빌드시 치수를 알 수 없어, 업로드 때 측정한 값을
// URL에 담아 next/image가 박스를 예약하도록 한다.
export function withDims(url: string, width: number, height: number): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}w=${width}&h=${height}`;
}

export function dimsFromSrc(
  src: string
): { width: number; height: number } | null {
  const qIndex = src.indexOf("?");
  if (qIndex === -1) return null;
  const params = new URLSearchParams(src.slice(qIndex + 1));
  const w = Number(params.get("w"));
  const h = Number(params.get("h"));
  if (Number.isInteger(w) && Number.isInteger(h) && w > 0 && h > 0) {
    return { width: w, height: h };
  }
  return null;
}
```

- [ ] **Step 5: run.ts에 테스트 등록**

Modify `tests/unit/run.ts` — `import "./slug.test";` 다음 줄에 추가:
```ts
import "./image-src.test";
```

- [ ] **Step 6: 테스트 통과 확인**

Run:
```bash
pnpm run test:unit
```
Expected: PASS — `image-src.test: 6 assertions passed.` 및 `All unit tests passed.`

- [ ] **Step 7: 타입/린트**

Run:
```bash
pnpm exec tsc --noEmit && pnpm run lint
```
Expected: 오류 없음.

- [ ] **Step 8: 커밋(사용자 승인 시)**

```bash
git add package.json pnpm-lock.yaml lib/image-src.ts tests/unit/image-src.test.ts tests/unit/run.ts
git commit -m "블로그(이미지): 치수 URL 헬퍼 + tiptap image 확장 추가"
```

---

### Task 2: 클라이언트 업로드 토큰 라우트

브라우저 직접 업로드용 토큰을 발급하고 경로·형식·용량을 서버에서 검증한다.

**Files:**
- Create: `app/api/admin/blob-upload/route.ts`

**Interfaces:**
- Produces: `POST /api/admin/blob-upload` — `@vercel/blob/client`의 `handleUpload` 응답(JSON). 클라이언트 `upload(..., { handleUploadUrl: "/api/admin/blob-upload" })`가 호출.

- [ ] **Step 1: 라우트 작성**

Create `app/api/admin/blob-upload/route.ts`:
```ts
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

// 업로드 경로 화이트리스트: blog/<slug>/<파일명>. slug는 소문자·숫자·하이픈.
const PATH_RE = /^blog\/[a-z0-9]+(?:-[a-z0-9]+)*\/[^/]+$/;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_BYTES = 5 * 1024 * 1024;

// 클라이언트 직접 업로드용 토큰 발급. 비밀키는 서버에만 있고, 브라우저엔
// 이 라우트가 허가한 "이 경로·이 형식·5MB까지"짜리 단기 토큰만 나간다.
// NOTE(Phase 2): 로그인 붙으면 여기서 세션을 확인해 무단 업로드를 막는다.
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!PATH_RE.test(pathname)) {
          throw new Error("허용되지 않은 업로드 경로입니다.");
        }
        return {
          allowedContentTypes: ALLOWED,
          maximumSizeInBytes: MAX_BYTES,
          addRandomSuffix: true,
        };
      },
      // 로컬(localhost)에선 호출되지 않음. 후처리 없음(DB 저장 안 함).
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
```

- [ ] **Step 2: 타입/린트**

Run:
```bash
pnpm exec tsc --noEmit && pnpm run lint
```
Expected: 오류 없음.

- [ ] **Step 3: 라우트 응답 스모크(실패 경로)**

개발 서버가 8000에서 떠 있다고 가정. 잘못된 경로가 400을 내는지 확인:
```bash
curl -s -X POST http://localhost:8000/api/admin/blob-upload \
  -H "content-type: application/json" \
  -d '{"type":"blob.generate-client-token","payload":{"pathname":"evil/x.jpg","callbackUrl":"http://localhost:8000/api/admin/blob-upload","clientPayload":null,"multipart":false}}'
```
Expected: `{"error":"허용되지 않은 업로드 경로입니다."}` (HTTP 400). (정상 경로의 실제 토큰 발급은 Task 8 브라우저 스모크에서 검증.)

- [ ] **Step 4: 커밋(사용자 승인 시)**

```bash
git add app/api/admin/blob-upload/route.ts
git commit -m "블로그(이미지): Blob 클라이언트 업로드 토큰 라우트"
```

---

### Task 3: 클라이언트 업로드 유틸

커버·본문이 공유하는 업로드 함수. 치수 측정 + 경로 구성 + `upload()`.

**Files:**
- Create: `lib/blob-upload.ts`

**Interfaces:**
- Consumes: `POST /api/admin/blob-upload` (Task 2), `withDims`는 호출부에서 사용(여기선 원본 url·치수를 반환).
- Produces:
  - `type UploadedImage = { url: string; width: number; height: number }`
  - `uploadImage(file: File, opts: { slug: string; kind: "cover" | "body" }): Promise<UploadedImage>` — Blob에 올리고 `{ url, width, height }` 반환. url은 치수 쿼리가 **붙지 않은** 원본(치수 부착은 본문 삽입 시 `withDims`로).

- [ ] **Step 1: 유틸 작성**

Create `lib/blob-upload.ts`:
```ts
import { upload } from "@vercel/blob/client";

export type UploadedImage = { url: string; width: number; height: number };

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

// 브라우저에서 실제 픽셀 크기 측정(모든 표시 가능한 형식 지원).
function measure(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지 크기를 읽지 못했습니다."));
    };
    img.src = url;
  });
}

export async function uploadImage(
  file: File,
  opts: { slug: string; kind: "cover" | "body" }
): Promise<UploadedImage> {
  const ext = EXT[file.type];
  if (!ext) throw new Error("JPG·PNG·WebP·AVIF 이미지만 올릴 수 있습니다.");
  const { width, height } = await measure(file);
  // 파일명은 kind.ext로 고정하고 서버 addRandomSuffix로 유니크화(특수문자 회피).
  const pathname = `blog/${opts.slug}/${opts.kind}.${ext}`;
  const blob = await upload(pathname, file, {
    access: "public",
    handleUploadUrl: "/api/admin/blob-upload",
    contentType: file.type,
  });
  return { url: blob.url, width, height };
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
git add lib/blob-upload.ts
git commit -m "블로그(이미지): 공용 클라이언트 업로드 유틸(uploadImage)"
```

---

### Task 4: 커버 이미지 → 클라이언트 업로드로 교체 + 서버 액션 제거

`CoverImageField`를 새 유틸로 바꾸고, slug 게이팅을 넣고, 기존 서버 액션을 지운다.

**Files:**
- Modify: `components/admin/CoverImageField.tsx`
- Modify: `components/admin/PostForm.tsx` (CoverImageField에 `slug` 전달)
- Delete: `actions/admin/upload.ts`

**Interfaces:**
- Consumes: `uploadImage` (Task 3).
- Produces: `<CoverImageField value slug onChange />` — `slug` prop 추가.

- [ ] **Step 1: CoverImageField 교체**

Replace `components/admin/CoverImageField.tsx` 전체:
```tsx
"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { uploadImage } from "@/lib/blob-upload";

// 커버 이미지 입력. 파일을 골라 Blob(blog/<slug>/cover.*)에 직접 업로드하고
// 반환 URL을 상위 폼(value/onChange)에 넘긴다. 커버는 렌더 시 next/image
// fill이라 치수 쿼리는 붙이지 않는다. slug가 없으면 업로드 불가.
export function CoverImageField({
  value,
  slug,
  onChange,
}: {
  value: string;
  slug: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const disabled = uploading || !slug;

  async function onPick(file: File) {
    setError(null);
    setUploading(true);
    try {
      const { url } = await uploadImage(file, { slug, kind: "cover" });
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "업로드 실패");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        커버 이미지
      </label>

      <div className="relative aspect-[16/10] w-full max-w-sm overflow-hidden rounded-md border border-gray-300 bg-gray-50">
        <Image
          src={value}
          alt="커버 이미지 미리보기"
          fill
          sizes="384px"
          className="object-cover"
        />
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm text-gray-600">
            업로드 중…
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          이미지 선택
        </button>
        <span className="truncate text-xs text-gray-500">{value}</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPick(file);
        }}
      />

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <p className="mt-1 text-xs text-gray-500">
        {slug
          ? "JPG·PNG·WebP·AVIF, 5MB 이하. 선택하지 않으면 기본 이미지가 쓰입니다."
          : "먼저 slug를 입력하면 이미지를 올릴 수 있습니다."}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: PostForm에서 slug 전달**

Modify `components/admin/PostForm.tsx` — 기존 `<CoverImageField value={coverImage} onChange={setCoverImage} />` 를:
```tsx
<CoverImageField value={coverImage} slug={slug} onChange={setCoverImage} />
```

- [ ] **Step 3: 서버 액션 삭제**

```bash
git rm actions/admin/upload.ts
```
(또는 파일 삭제 후 스테이징.)

- [ ] **Step 4: 타입/린트**

Run:
```bash
pnpm exec tsc --noEmit && pnpm run lint
```
Expected: 오류 없음(삭제한 `uploadCoverImage`를 참조하는 곳이 없어야 함).

- [ ] **Step 5: 커밋(사용자 승인 시)**

```bash
git add components/admin/CoverImageField.tsx components/admin/PostForm.tsx actions/admin/upload.ts
git commit -m "블로그(이미지): 커버를 클라이언트 직접 업로드로 통일, 서버 액션 제거"
```

---

### Task 5: 에디터 본문 이미지 삽입

`@tiptap/extension-image`를 붙이고 "이미지" 버튼으로 여러 장 업로드·삽입.

**Files:**
- Modify: `components/admin/RichTextEditor.tsx`
- Modify: `components/admin/PostForm.tsx` (RichTextEditor에 `slug` 전달)

**Interfaces:**
- Consumes: `uploadImage` (Task 3), `withDims` (Task 1).
- Produces: `<RichTextEditor value slug onChange />` — `slug` prop 추가.

- [ ] **Step 1: RichTextEditor에 Image 확장 + slug prop**

Modify `components/admin/RichTextEditor.tsx`:
- 상단 import 추가:
```tsx
import ImageExt from "@tiptap/extension-image";
import { uploadImage } from "@/lib/blob-upload";
import { withDims } from "@/lib/image-src";
```
- 컴포넌트 시그니처를 slug를 받도록 변경:
```tsx
export function RichTextEditor({
  value,
  slug,
  onChange,
}: {
  value: string;
  slug: string;
  onChange: (markdown: string) => void;
}) {
```
- `extensions` 배열에 `ImageExt` 추가:
```tsx
    extensions: [
      StarterKit.configure({ link: { openOnClick: false } }),
      Markdown,
      ImageExt.configure({ inline: false }),
    ],
```
- 렌더에서 Toolbar에 slug 전달:
```tsx
  return (
    <div className="rounded-md border border-gray-300">
      <Toolbar editor={editor} slug={slug} />
      <EditorContent editor={editor} />
    </div>
  );
```
- 본문 이미지 표시 스타일을 editorProps class 문자열 끝에 추가(기존 문자열에 이어붙임):
```tsx
          "[&_img]:my-3 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md",
```

- [ ] **Step 2: 이미지 업로드 버튼 컴포넌트 추가**

`components/admin/RichTextEditor.tsx` 하단에 추가:
```tsx
// 파일 선택 → 여러 장 순서대로 업로드 → 커서 위치에 이미지 노드 삽입.
// slug가 없으면 비활성화(폴더가 slug 기준).
function ImageUploadButton({ editor, slug }: { editor: Editor; slug: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const disabled = busy || !slug;

  async function onFiles(files: FileList) {
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        const { url, width, height } = await uploadImage(file, {
          slug,
          kind: "body",
        });
        const alt = file.name.replace(/\.[^.]+$/, "");
        editor
          .chain()
          .focus()
          .setImage({ src: withDims(url, width, height), alt })
          .run();
      }
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="rounded border border-transparent px-2 py-1 text-sm hover:bg-gray-100 disabled:opacity-40"
        title={slug ? "이미지 업로드" : "slug를 먼저 입력하세요"}
      >
        {busy ? "업로드 중…" : "이미지"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0)
            onFiles(e.target.files);
        }}
      />
    </>
  );
}
```
- 상단 import에 `useRef`, `useState` 추가:
```tsx
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import { useRef, useState } from "react";
```

- [ ] **Step 3: Toolbar가 slug를 받아 버튼 렌더**

`components/admin/RichTextEditor.tsx`의 `Toolbar` 시그니처와 본문을 수정:
```tsx
function Toolbar({ editor, slug }: { editor: Editor; slug: string }) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-gray-200 bg-gray-50 p-2">
      {toolbarItems(editor).map((item) => (
        <ToolbarButton
          key={item.label}
          onRun={item.run}
          isActive={item.isActive}
          className={item.className}
        >
          {item.label}
        </ToolbarButton>
      ))}
      <ImageUploadButton editor={editor} slug={slug} />
    </div>
  );
}
```

- [ ] **Step 4: PostForm에서 RichTextEditor에 slug 전달**

Modify `components/admin/PostForm.tsx` — `<RichTextEditor value={body} onChange={setBody} />` 를:
```tsx
<RichTextEditor value={body} slug={slug} onChange={setBody} />
```

- [ ] **Step 5: 타입/린트**

Run:
```bash
pnpm exec tsc --noEmit && pnpm run lint
```
Expected: 오류 없음.

- [ ] **Step 6: 커밋(사용자 승인 시)**

```bash
git add components/admin/RichTextEditor.tsx components/admin/PostForm.tsx
git commit -m "블로그(이미지): 에디터 본문 이미지 업로드/삽입 버튼"
```

---

### Task 6: 본문 렌더 — src 쿼리 치수로 next/image

`mdx-components.tsx`의 `img`가 원격 이미지의 `?w&h`를 읽어 next/image로 렌더한다.

**Files:**
- Modify: `mdx-components.tsx`

**Interfaces:**
- Consumes: `dimsFromSrc` (Task 1).

- [ ] **Step 1: img 매핑 수정**

Modify `mdx-components.tsx`:
- 상단 import 추가:
```tsx
import { dimsFromSrc } from "@/lib/image-src";
```
- `img` 매핑을 아래로 교체(로컬은 rehype 프롭 → 원격은 src 쿼리 순으로 치수 확보):
```tsx
  img: ({ src, alt, width, height }) => {
    const cls =
      "block w-full h-auto my-8 rounded-md border border-hairline-soft bg-surface-card";
    // 1) 로컬 public 이미지: rehypeImageDimensions가 넣은 width/height 프롭.
    let w = toNum(width);
    let h = toNum(height);
    // 2) 원격(Blob) 이미지: 업로드 때 실은 ?w&h 쿼리에서 파싱.
    if ((!w || !h) && typeof src === "string") {
      const dims = dimsFromSrc(src);
      if (dims) {
        w = dims.width;
        h = dims.height;
      }
    }
    if (src && w && h) {
      return (
        <Image
          src={src as string}
          alt={(alt as string) || ""}
          width={w}
          height={h}
          sizes="(min-width: 800px) 768px, 100vw"
          className={cls}
        />
      );
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src as string}
        alt={(alt as string) || ""}
        loading="lazy"
        decoding="async"
        className={cls}
      />
    );
  },
```

- [ ] **Step 2: 관련 유닛 테스트 재확인**

Run:
```bash
pnpm run test:unit
```
Expected: PASS(기존 `rehype-image-dimensions.test` 포함 전부).

- [ ] **Step 3: 타입/린트**

Run:
```bash
pnpm exec tsc --noEmit && pnpm run lint
```
Expected: 오류 없음.

- [ ] **Step 4: 커밋(사용자 승인 시)**

```bash
git add mdx-components.tsx
git commit -m "블로그(이미지): 본문 원격 이미지도 src 치수로 next/image 렌더"
```

---

### Task 7: 엔드투엔드 스모크 + 빌드

실제 브라우저 흐름으로 업로드→삽입→발행→렌더를 확인한다.

**Files:** (없음 — 검증 전용)

- [ ] **Step 1: 개발 서버 확인(8000)**

8000에서 떠 있지 않으면:
```bash
PORT=8000 pnpm dev
```
(백그라운드로 띄우고, 끝나면 트리 종료 + 포트 확인.)

- [ ] **Step 2: browse 스모크**

`browse` 스킬로 `http://localhost:8000/admin/posts/new` 열기:
1. 제목 입력(→ slug 자동 채워짐 확인) → 요약 입력.
2. 커버 "이미지 선택"으로 이미지 업로드 → 미리보기 갱신 확인.
3. 본문 툴바 "이미지"로 이미지 **2장** 삽입 → 에디터에 표시 확인.
4. "발행하기" → `/blog/<slug>`로 이동.
5. 상세 페이지에서 본문 이미지 2장이 **`/_next/image?...`** 로 요청되는지(next/image), 레이아웃 시프트 없이 뜨는지 확인. 커버도 정상.

Expected: 4장(커버1+본문2는 next/image, 목록카드 커버 포함) 모두 next/image로 렌더, raw `<img>` 폴백 없음.

- [ ] **Step 3: DB 스모크**

```bash
pnpm run verify:posts
```
Expected: 새 글 포함 카운트 증가, 오류 없음.

- [ ] **Step 4: 프로덕션 빌드**

node 프로세스 종료 후:
```bash
pnpm build
```
Expected: exit 0.

- [ ] **Step 5: 개발 서버 정리**

백그라운드 서버 트리 종료 후 8000 포트가 비었는지 확인.

- [ ] **Step 6: 커밋 없음**

검증 전용 태스크(코드 변경 없음).

---

## Self-Review 결과

- **스펙 커버리지:** 저장(Blob slug폴더)=Task3/4/5, 클라이언트 업로드=Task2/3, 치수 처리=Task1/6, 에디터 UX(여러 장)=Task5, slug 게이팅=Task4/5, 커버 통일·서버액션 제거=Task4, remotePatterns=Global(확인). 비목표(고아삭제·DnD·alt편집·갤러리·인증)는 계획에 넣지 않음(의도적).
- **플레이스홀더:** 없음(모든 코드 블록 완결).
- **타입 일관성:** `uploadImage(file,{slug,kind})→{url,width,height}`, `withDims(url,w,h)→string`, `dimsFromSrc(src)→{width,height}|null`, `CoverImageField`·`RichTextEditor`에 `slug: string` prop 일관.
