# 블로그 본문 HTML 전환 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 본문 저장을 마크다운 → 정화된 HTML로 전환하고, 글씨 크기·정렬·색 서식과 링크 수정을 추가한다.

**Architecture:** Tiptap `getHTML()`로 HTML 저장(저장 시 sanitize-html 정화). 렌더는 `html-react-parser`로 HTML→React 매핑(img→next/image). 로컬·프로덕션이 **같은 Neon DB를 공유**하므로 렌더/RSS는 **HTML·마크다운 둘 다 견디는 dual-mode**로 만들어 이관 중 무중단.

**Tech Stack:** Tiptap v3(text-style/font-size/text-align/color), html-react-parser, sanitize-html, next/image, Drizzle.

## Global Constraints

- 패키지 매니저 **pnpm**.
- **저장되는 body는 항상 sanitize** 통과(허용 태그 + style은 font-size·color·text-align만). `<script>`·이벤트핸들러 제거.
- 렌더·RSS는 **dual-mode**: `looksLikeHtml(body)` 참이면 HTML 경로, 아니면 기존 마크다운 경로(이관 중 안전). 이관 완료 후에도 fallback은 남겨둠(무해).
- 모든 이미지 next/image(치수 없으면 안전망 raw img — 기존 정책).
- `mdx-components.tsx`는 **제품 MDX가 계속 쓰므로 변경/삭제 금지**.
- 매 태스크 종료 시 `pnpm exec tsc --noEmit` + `pnpm run lint` 통과.
- **커밋/푸시는 사용자 지시 시에만**. 커밋 전 `pnpm build` exit 0. `.claude/settings.json` 스테이징 금지.
- **배포 순서(중요):** dual-mode 코드 배포 → 그 다음 이관 스크립트 실행(공유 DB라 순서 반대면 프로덕션 잠깐 깨짐).

---

### Task 1: 의존성 + sanitize + looksLikeHtml (TDD)

**Files:**
- Modify: `package.json`
- Create: `lib/html/sanitize.ts`, `tests/unit/sanitize.test.ts`
- Modify: `tests/unit/run.ts`

**Interfaces:**
- Produces:
  - `sanitizeBody(html: string): string` — 화이트리스트 정화.
  - `looksLikeHtml(body: string): boolean` — 본문이 HTML인지(첫 비공백이 `<`).

- [ ] **Step 1: 의존성 설치**

```bash
pnpm add html-react-parser sanitize-html && pnpm add -D @types/sanitize-html image-size
```
Expected: 추가됨. (Tiptap 확장은 Task 3에서 설치.)

- [ ] **Step 2: 실패 테스트**

Create `tests/unit/sanitize.test.ts`:
```ts
import assert from "node:assert/strict";
import { sanitizeBody, looksLikeHtml } from "@/lib/html/sanitize";

// script 제거
assert.equal(sanitizeBody('<p>a</p><script>alert(1)</script>'), "<p>a</p>");
// 이벤트 핸들러 제거
assert.ok(!sanitizeBody('<p onclick="x()">a</p>').includes("onclick"));
// 허용 style만: font-size/color/text-align 유지, 그 외 제거
const s = sanitizeBody('<p style="text-align:center;background:red">c</p>');
assert.ok(s.includes("text-align:center"));
assert.ok(!s.toLowerCase().includes("background"));
// 이미지 width/height 유지
assert.ok(
  sanitizeBody('<img src="https://x/a.png" alt="a" width="10" height="20">').includes('width="10"')
);
// looksLikeHtml
assert.equal(looksLikeHtml("<p>hi</p>"), true);
assert.equal(looksLikeHtml("# 제목\n본문"), false);
assert.equal(looksLikeHtml("   <div>x</div>"), true);

console.log("sanitize.test: passed.");
```

- [ ] **Step 3: 실패 확인**

```bash
pnpm exec tsx tests/unit/sanitize.test.ts
```
Expected: FAIL — 모듈 없음.

- [ ] **Step 4: 구현**

Create `lib/html/sanitize.ts`:
```ts
import sanitizeHtml from "sanitize-html";

// 본문 HTML이 HTML인지(마크다운과 구분). 첫 비공백 문자가 '<'면 HTML로 본다.
export function looksLikeHtml(body: string): boolean {
  return /^\s*</.test(body);
}

// 에디터가 만든 서식만 허용하는 화이트리스트 정화. style은 크기·색·정렬만.
export function sanitizeBody(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "strong", "em", "u", "s", "h1", "h2", "h3",
      "ul", "ol", "li", "blockquote", "a", "img", "span", "code", "pre", "hr",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height"],
      "*": ["style"],
    },
    allowedStyles: {
      "*": {
        "font-size": [/^\d{1,3}px$/],
        color: [/^#(0x)?[0-9a-fA-F]{3,8}$/, /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/],
        "text-align": [/^(left|center|right)$/],
      },
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: (tagName, attribs) => {
        const out: Record<string, string> = { href: attribs.href ?? "" };
        if (attribs.target === "_blank") {
          out.target = "_blank";
          out.rel = "noopener nofollow";
        }
        return { tagName, attribs: out };
      },
    },
  });
}
```

- [ ] **Step 5: run.ts 등록 + 통과**

`tests/unit/run.ts`에 `import "./auth-session.test";` 다음 줄:
```ts
import "./sanitize.test";
```
Run:
```bash
pnpm run test:unit && pnpm exec tsc --noEmit && pnpm run lint
```
Expected: 전부 통과.

- [ ] **Step 6: 커밋(승인 시)**

```bash
git add package.json pnpm-lock.yaml lib/html/sanitize.ts tests/unit/sanitize.test.ts tests/unit/run.ts
git commit -m "블로그(HTML): 본문 정화(sanitize) 유틸 + 의존성"
```

---

### Task 2: PostBody 렌더러 (HTML → React)

**Files:**
- Create: `components/blog/PostBody.tsx`

**Interfaces:**
- Consumes: `html-react-parser`, next/image.
- Produces: `<PostBody html={string} />` — 정화된 HTML을 사이트 타이포그래피로 렌더, `<img>`→next/image.

- [ ] **Step 1: PostBody 작성**

Create `components/blog/PostBody.tsx`:
```tsx
import Image from "next/image";
import parse, {
  domToReact,
  Element,
  type HTMLReactParserOptions,
  type DOMNode,
} from "html-react-parser";

function toNum(v?: string): number | undefined {
  if (!v) return undefined;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
}

const imgCls =
  "mx-auto block h-auto max-w-full my-8 rounded-md border border-hairline-soft bg-surface-card";

const options: HTMLReactParserOptions = {
  replace: (node) => {
    if (!(node instanceof Element)) return undefined;
    const kids = () => domToReact(node.children as DOMNode[], options);
    const style = node.attribs?.style;
    switch (node.name) {
      case "img": {
        const { src, alt } = node.attribs;
        const w = toNum(node.attribs.width);
        const h = toNum(node.attribs.height);
        if (src && w && h) {
          return (
            <Image
              src={src}
              alt={alt || ""}
              width={w}
              height={h}
              sizes="(min-width: 800px) 768px, 100vw"
              className={imgCls}
            />
          );
        }
        // 치수 없는 안전망(기존 정책)
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={src} alt={alt || ""} loading="lazy" className={imgCls} />;
      }
      case "h1":
        return <h1 className="text-display-lg text-ink mt-0 mb-6" style={styleObj(style)}>{kids()}</h1>;
      case "h2":
        return <h2 className="text-heading-xl text-ink mt-14 mb-4 scroll-mt-24" style={styleObj(style)}>{kids()}</h2>;
      case "h3":
        return <h3 className="text-heading-lg text-ink mt-10 mb-3" style={styleObj(style)}>{kids()}</h3>;
      case "p":
        return <p className="text-body-md text-body my-4 leading-[1.8]" style={styleObj(style)}>{kids()}</p>;
      case "ul":
        return <ul className="list-disc pl-6 my-4 text-body-md text-body space-y-1.5 leading-[1.7]">{kids()}</ul>;
      case "ol":
        return <ol className="list-decimal pl-6 my-4 text-body-md text-body space-y-1.5 leading-[1.7]">{kids()}</ol>;
      case "blockquote":
        return <blockquote className="my-6 rounded-r-md border-l-4 border-primary bg-surface-card px-5 py-4 text-body-md text-body [&>p]:my-0 [&>p+p]:mt-3">{kids()}</blockquote>;
      case "a":
        return (
          <a href={node.attribs.href} target={node.attribs.target} rel={node.attribs.rel}
             className="text-primary underline underline-offset-2 hover:text-primary-pressed">
            {kids()}
          </a>
        );
      case "code":
        return <code className="bg-surface-card rounded px-1.5 py-0.5 text-body-sm">{kids()}</code>;
      case "hr":
        return <hr className="my-12 border-0 border-t border-hairline" />;
      case "span":
        return <span style={styleObj(style)}>{kids()}</span>;
      default:
        return undefined; // li, strong, em, u, s, br, pre 등은 기본 렌더
    }
  },
};

// "font-size:20px;color:#f00" → { fontSize:'20px', color:'#f00' } (허용된 것만 sanitize가 이미 걸러줌)
function styleObj(style?: string): React.CSSProperties | undefined {
  if (!style) return undefined;
  const out: Record<string, string> = {};
  for (const decl of style.split(";")) {
    const [k, v] = decl.split(":").map((x) => x?.trim());
    if (!k || !v) continue;
    if (k === "font-size") out.fontSize = v;
    else if (k === "color") out.color = v;
    else if (k === "text-align") out.textAlign = v;
  }
  return Object.keys(out).length ? (out as React.CSSProperties) : undefined;
}

export function PostBody({ html }: { html: string }) {
  return <>{parse(html, options)}</>;
}
```

- [ ] **Step 2: 타입/린트**

```bash
pnpm exec tsc --noEmit && pnpm run lint
```
Expected: 오류 없음. (html-react-parser 타입 이슈 시 import/캐스팅 조정.)

- [ ] **Step 3: 커밋(승인 시)**

```bash
git add components/blog/PostBody.tsx
git commit -m "블로그(HTML): HTML 본문 렌더러 PostBody(img→next/image, 서식 보존)"
```

---

### Task 3: 에디터 HTML 전환 + 서식/링크 + 저장 sanitize

**Files:**
- Modify: `components/admin/RichTextEditor.tsx`, `components/admin/PostForm.tsx`, `actions/admin/posts.ts`, `package.json`

**Interfaces:**
- Consumes: `sanitizeBody` (Task 1).
- Produces: HTML을 내보내는 에디터, 글씨크기/정렬/색/링크 툴바.

- [ ] **Step 1: Tiptap 확장 설치**

```bash
pnpm add @tiptap/extension-text-style @tiptap/extension-text-align @tiptap/extension-color
```
Expected: 추가됨. (FontSize: v3에서 `@tiptap/extension-text-style`가 제공하는 fontSize 사용. 설치 후 실제 export 확인해 API 맞춤 — TextStyle의 `setFontSize`/`setMark('textStyle',{fontSize})` 중 동작하는 것.)

- [ ] **Step 2: RichTextEditor를 HTML 입출력 + 확장/툴바로 개편**

`components/admin/RichTextEditor.tsx`:
- `tiptap-markdown` import/확장 제거. `onUpdate`에서 `onChange(editor.getHTML())`.
- `content: value`(HTML)로 로드.
- extensions에 추가: `TextStyle`, `FontSize`(또는 TextStyle 설정), `Color`, `TextAlign.configure({ types: ["heading","paragraph"] })`.
- `insertUploadedImages`에서 `withDims(url,w,h)` 대신 이미지 노드 attrs에 `width`,`height` 직접:
  ```tsx
  const content = [
    { type: "image", attrs: { src: url, alt, width, height } },
    { type: "paragraph" },
  ];
  ```
  (`withDims`/`?w&h` 사용 중단. `image-src` import 제거.)
- toolbarItems에 항목 추가:
  - 정렬: `editor.chain().focus().setTextAlign("left"/"center"/"right").run()`, isActive `editor.isActive({textAlign})`.
  - 링크(재작성):
    ```tsx
    run: () => {
      const prev = editor.getAttributes("link").href as string | undefined;
      const url = window.prompt("링크 URL:", prev ?? "");
      if (url === null) return;
      if (url === "") { editor.chain().focus().extendMarkRange("link").unsetLink().run(); return; }
      const { from, to } = editor.state.selection;
      if (from === to) {
        editor.chain().focus().insertContent(`<a href="${url}">${url}</a>`).run();
      } else {
        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
      }
    }
    ```
- 글씨 크기: 툴바에 select(작게 14 / 보통 16 / 크게 20 / 더크게 28) → `editor.chain().focus().setMark("textStyle",{ fontSize: v+"px" }).run()` (또는 FontSize 확장의 `setFontSize`). "보통"은 `unsetMark`/16px.
- 글자 색: 프리셋 몇 개 버튼 → `editor.chain().focus().setColor(hex).run()`, 기본색 → `unsetColor`.
- 에디터 미리보기 class에 정렬/색/크기가 보이도록 `[&_[style]]` 관련은 인라인 style이 그대로 먹으므로 별도 불필요.

- [ ] **Step 3: PostForm — 값은 HTML**

`components/admin/PostForm.tsx`: 변경 최소. body 초기값이 이제 HTML(편집 시 `initialPost.body`가 HTML), RichTextEditor `value={body}` 그대로. createPost/updatePost에 body(HTML) 전달 그대로. (별도 코드 변경 거의 없음 — 주석만 정리.)

- [ ] **Step 4: 저장 시 sanitize**

`actions/admin/posts.ts`:
- import: `import { sanitizeBody } from "@/lib/html/sanitize";`
- `createPost`·`updatePost`에서 insert/update 직전 `const body = sanitizeBody(input.body);` 로 만들어 `body: body` 저장(원본 `input.body` 대신).

- [ ] **Step 5: 타입/린트**

```bash
pnpm exec tsc --noEmit && pnpm run lint
```
Expected: 오류 없음.

- [ ] **Step 6: 커밋(승인 시)**

```bash
git add components/admin/RichTextEditor.tsx components/admin/PostForm.tsx actions/admin/posts.ts package.json pnpm-lock.yaml
git commit -m "블로그(HTML): 에디터 HTML 출력 + 글씨크기·정렬·색·링크 + 저장 sanitize"
```

---

### Task 4: 렌더/RSS dual-mode 전환

**Files:**
- Modify: `app/[locale]/blog/[slug]/page.tsx`, `lib/rss.ts`

**Interfaces:**
- Consumes: `PostBody` (Task 2), `looksLikeHtml` (Task 1).

- [ ] **Step 1: 블로그 상세 dual-mode**

`app/[locale]/blog/[slug]/page.tsx`:
- import 추가: `import { PostBody } from "@/components/blog/PostBody";` `import { looksLikeHtml } from "@/lib/html/sanitize";`
- `<MDXRemote ... />` 블록을 교체:
  ```tsx
  {looksLikeHtml(post.body) ? (
    <PostBody html={post.body} />
  ) : (
    <MDXRemote
      source={post.body}
      components={mdxComponents}
      options={{ mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeImageDimensions] } }}
    />
  )}
  ```
  (MDXRemote/remarkGfm/rehypeImageDimensions/mdxComponents import는 fallback용으로 **유지**.)

- [ ] **Step 2: RSS dual-mode**

`lib/rss.ts`의 `buildRssXml` 내 `const bodyHtml = await markdownToHtml(p.body);` 를:
```ts
      const bodyHtml = looksLikeHtml(p.body)
        ? absolutizeUrls(p.body)
        : await markdownToHtml(p.body);
```
import: `import { looksLikeHtml } from "@/lib/html/sanitize";` (markdownToHtml/remark는 fallback용 유지.)

- [ ] **Step 3: 타입/린트/유닛/빌드**

```bash
pnpm exec tsc --noEmit && pnpm run lint && pnpm run test:unit
```
Expected: 통과.

- [ ] **Step 4: 커밋(승인 시)**

```bash
git add app/[locale]/blog/[slug]/page.tsx lib/rss.ts
git commit -m "블로그(HTML): 상세·RSS를 HTML/마크다운 dual-mode로"
```

---

### Task 5: 기존 글 이관 스크립트

**Files:**
- Create: `scripts/migrate-body-to-html.ts`, `package.json`(script)

**Interfaces:**
- Consumes: `sanitizeBody` (Task 1), remark(md→html), `image-size`.

- [ ] **Step 1: 이관 스크립트**

Create `scripts/migrate-body-to-html.ts`:
```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";
import { imageSize } from "image-size";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sanitizeBody, looksLikeHtml } from "@/lib/html/sanitize";

const md = remark().use(remarkGfm).use(remarkHtml);

// 로컬(/blog/..) 이미지의 실제 치수를 public/에서 측정해 width/height 부여.
// ?w&h 쿼리가 있으면 그걸 사용. 원격/측정 불가면 속성 없이 둔다(렌더 안전망).
function addImgDims(html: string): string {
  return html.replace(/<img\b[^>]*>/g, (tag) => {
    if (/\bwidth=/.test(tag)) return tag;
    const src = tag.match(/src="([^"]+)"/)?.[1];
    if (!src) return tag;
    const q = src.match(/[?&]w=(\d+)&h=(\d+)/);
    if (q) return tag.replace(/>$/, ` width="${q[1]}" height="${q[2]}">`);
    if (src.startsWith("/")) {
      try {
        const buf = readFileSync(join(process.cwd(), "public", src.split("?")[0]));
        const { width, height } = imageSize(buf);
        if (width && height) return tag.replace(/>$/, ` width="${width}" height="${height}">`);
      } catch {}
    }
    return tag;
  });
}

async function main() {
  const rows = await db.select().from(posts);
  let n = 0;
  for (const r of rows) {
    if (looksLikeHtml(r.body)) continue; // 이미 HTML
    const html = String(await md.process(r.body));
    const withDims = addImgDims(html);
    const clean = sanitizeBody(withDims);
    await db.update(posts).set({ body: clean }).where(eq(posts.id, r.id));
    console.log("이관:", r.slug);
    n++;
  }
  console.log("완료:", n, "건");
}
main();
```

- [ ] **Step 2: package.json 스크립트**

`"migrate:html": "node --env-file=.env.local --import tsx scripts/migrate-body-to-html.ts"` 추가.

- [ ] **Step 3: 타입/린트**

```bash
pnpm exec tsc --noEmit && pnpm run lint
```
Expected: 오류 없음. (아직 **실행하지 않는다** — 배포 순서 때문에 Task 6에서.)

- [ ] **Step 4: 커밋(승인 시)**

```bash
git add scripts/migrate-body-to-html.ts package.json
git commit -m "블로그(HTML): 기존 마크다운 글 → HTML 이관 스크립트"
```

---

### Task 6: 이관 실행 + E2E + 빌드

**Files:** (실행/검증)

- [ ] **Step 1: 빌드 확인(이관 전, dual-mode가 마크다운도 렌더)**

node 종료 후 `pnpm build` → exit 0. 이 상태로 배포하면 기존 마크다운 글은 fallback으로 정상.

- [ ] **Step 2: 이관 실행**

```bash
pnpm run migrate:html
```
Expected: `이관: <slug>` 로그 후 `완료: N 건`. (공유 DB라 프로덕션 글도 이 순간 HTML로 바뀜 → dual-mode 코드가 이미 있어야 안전. 로컬 테스트만이면 배포 전 실행해도 됨.)

- [ ] **Step 3: 기존 글 렌더 확인(회귀)**

dev(8000) 기동 → `/blog/<기존 slug>` 가 이전과 동일하게(이미지 next/image 포함) 보이는지 browse/curl 확인.

- [ ] **Step 4: browse — 새 글 서식 E2E**

로그인 → 새 글에서 글씨 크기·정렬(가운데)·색·링크(선택/미선택)·이미지 넣고 발행 →
공개 상세에서 서식대로(크기/가운데/색/링크 동작) 렌더 확인. 발행 후 DB body가 sanitize된
HTML인지 스크립트로 확인. 테스트 글·Blob 정리.

- [ ] **Step 5: 최종 빌드**

node 종료 후 `pnpm build` exit 0. 서버 트리 종료 + 포트 확인.

---

## Self-Review 결과

- **스펙 커버리지:** 저장 HTML+sanitize=Task1/3, 렌더=Task2/4, 에디터 서식·링크=Task3,
  RSS=Task4, 이관=Task5/6. dual-mode(무중단)=Task4. 제품 MDX·커버 무변경.
- **플레이스홀더:** Tiptap FontSize의 정확한 API만 설치 후 확정(Task3 Step1 명시). 그 외 완결.
- **타입 일관성:** `sanitizeBody`/`looksLikeHtml`(Task1) → 에디터·actions·렌더·RSS·이관에서
  일관 사용. `PostBody({html})`, 이미지 attrs `width/height`(문자열) 일관.
- **주의:** 배포 순서(dual-mode 코드 → 이관 실행). fallback(마크다운 경로)은 이관 후에도
  남겨 무해.
