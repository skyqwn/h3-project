# 블로그 본문 저장을 마크다운 → HTML로 전환 — 설계

- 날짜: 2026-07-29
- 상태: 승인됨(구현 계획 작성 예정)
- 선행: 에디터(Tiptap+tiptap-markdown), 본문 이미지 업로드(`?w&h`), MDXRemote 렌더,
  RSS(remark md→html), draft/편집/삭제, 인증 구현됨.

## 목표

본문 저장 형식을 **마크다운 → HTML**로 바꿔, 마크다운으로 표현 못 하던 **글씨 크기·
정렬·글자 색**을 지원한다(표는 후순위). Tiptap이 HTML 네이티브라 에디터도 단순해지고,
이미지 치수도 `?w&h` 쿼리 대신 **실제 `<img width height>` 속성**으로 저장한다.

## 범위 (서식 기능 = B)

- **글씨 크기**(FontSize) / **정렬**(좌·가운데·우) / **글자 색**(Color) 툴바 추가.
- **링크 수정**: 텍스트 선택 시 그 텍스트에 링크, 미선택 시 URL을 링크 텍스트로 삽입,
  링크 위에서 수정/해제.
- 기존 서식(제목·굵게·목록·인용·이미지)·드래그드롭·붙여넣기 유지.

## 비목표(후순위)

- 표(table) 편집. 이미지 인라인 리사이즈 핸들. 폰트 패밀리 선택.

## 저장 모델

- `posts.body` = **정화된 HTML**(Tiptap `getHTML()`). **DB 스키마 변경 없음**(계속 text).
- 서식은 인라인 스타일로: 크기 `<span style="font-size:…">`, 색 `<span style="color:…">`,
  정렬 `<p style="text-align:…">`. 이미지는 `<img src width height alt>`.

## 보안 — 저장 시 sanitize (필수)

- 저장(createPost/updatePost) 전에 **`sanitize-html`로 정화**. 허용 화이트리스트:
  - 태그: `p, br, strong, em, u, s, h1, h2, h3, ul, ol, li, blockquote, a, img,
    span, code, pre, hr`.
  - 속성: `a[href,target,rel]`, `img[src,alt,width,height]`, 전역 `style`.
  - **`style`은 CSS 속성 화이트리스트만**: `font-size`(px 값만), `color`(hex/rgb),
    `text-align`(left|center|right). 그 외 CSS·`<script>`·이벤트핸들러(onload 등) 제거.
  - `a`는 `http/https/mailto`만, `target=_blank`엔 `rel="noopener nofollow"` 부여.
- → DB에 들어가는 HTML은 항상 안전. (관리자만 작성하지만 방어 심층.)

## 에디터 (`RichTextEditor`)

- `tiptap-markdown` 제거. 입력 `content = value`(HTML), 출력 `editor.getHTML()`을
  `onChange`로 상위에 전달.
- 확장 추가(Tiptap v3):
  - `@tiptap/extension-text-style`(+ FontSize 설정), `@tiptap/extension-color`,
    `@tiptap/extension-text-align`(types: heading, paragraph).
- 툴바 추가: **글씨 크기**(예: 작게 14 / 보통 16 / 크게 20 / 더크게 28 프리셋 select),
  **정렬**(좌/가운데/우 버튼), **글자 색**(색 몇 개 프리셋 또는 color input).
- **링크 재작성**: 선택 텍스트 → `extendMarkRange('link').setLink({href})`; 선택 없으면
  `insertContent(<a>url</a>)`; 빈 URL이면 `unsetLink`. prompt는 유지하되 선택
  보존(에디터 state selection 기준이라 유지됨) + 미선택 시 삽입으로 "안 됨" 해소.
- 이미지: `insertUploadedImages`가 `?w&h` 대신 **width/height 속성**으로 삽입
  (`{ type:"image", attrs:{ src, alt, width, height } }`). 드래그드롭·붙여넣기 그대로.

## 렌더 (`blog/[slug]`)

- `MDXRemote`(마크다운) 제거 → **HTML을 React로 매핑**하는 `components/blog/PostBody.tsx`
  신규(서버 컴포넌트, `html-react-parser`):
  - `<img>` → next/image(`width`/`height` 속성 사용, `sizes` 지정). 치수 없으면
    안전망 raw `<img>`(기존 mdx fallback과 동일 정책).
  - `<h1/h2/h3/p/ul/ol/li/blockquote/a/code/pre/hr/span>` → 사이트 타이포그래피
    className 부여, **허용된 인라인 스타일(크기·색·정렬) 보존**.
- `mdx-components.tsx`는 **제품 MDX 페이지가 계속 쓰므로 유지**(블로그만 PostBody로 전환).
- 본문용 `rehypeImageDimensions`/`remarkGfm`/`MDXRemote` import 제거(블로그 상세에서).

## RSS (`lib/rss.ts`)

- body가 이미 HTML → `markdownToHtml(p.body)` 대신 **`absolutizeUrls(p.body)`** 직접
  사용. remark(remark-gfm/remark-html) 의존 제거.

## 기존 글 이관 (1회 스크립트)

- `scripts/migrate-body-to-html.ts`: 모든 post(현재 2개 + draft) 대상.
  1. 마크다운 body → HTML(remark+remark-gfm+remark-html; RSS와 동일 파이프라인 재사용).
  2. `<img>`에 **width/height 부여**: 로컬(`/`-prefix, `public/…`) 이미지는 파일을
     측정(`image-size`), URL에 `?w&h` 있으면 파싱해 속성으로.
  3. sanitize 후 `posts.body` 갱신.
- 실행 전 백업 권장(현재 2개뿐이라 위험 작음). idempotent 아님 — 1회만.

## 파일

- Deps 추가: `@tiptap/extension-text-style`, `@tiptap/extension-text-align`,
  `@tiptap/extension-color`, `html-react-parser`, `sanitize-html`
  (+ `@types/sanitize-html`), `image-size`(이관용). 제거: `tiptap-markdown`(선택).
- Create: `lib/html/sanitize.ts`, `components/blog/PostBody.tsx`,
  `scripts/migrate-body-to-html.ts`.
- Modify: `components/admin/RichTextEditor.tsx`, `components/admin/PostForm.tsx`(값이
  HTML), `actions/admin/posts.ts`(sanitize), `app/[locale]/blog/[slug]/page.tsx`(렌더),
  `lib/rss.ts`, `package.json`.
- 변경 없음: DB 스키마, 커버 이미지, `mdx-components.tsx`(제품용 유지).

## 엣지/주의

- 인라인 스타일 화이트리스트 밖(예: `font-family`, `background`)은 sanitize가 제거 —
  툴바에서 그런 서식을 노출하지 않으므로 정상 흐름엔 안 생김.
- 편집 시 초기 `content`가 HTML → Tiptap이 그대로 로드. 기존 마크다운 글은 이관 후
  편집해야 정상(이관 전 편집 금지).
- next/image 원격 호스트(blob)는 이미 `remotePatterns` 허용됨.

## 검증

- `pnpm exec tsc --noEmit`, `pnpm run lint`, `pnpm run test:unit`(sanitize 순수
  함수 유닛 가능), `pnpm run verify:posts`, `pnpm build` exit 0.
- 이관 스크립트 실행 → `/blog/<기존글>`이 이전과 동일하게(이미지 next/image 포함) 보임.
- browse: 새 글에서 글씨 크기·정렬·색·링크·이미지 넣고 발행 → 공개 페이지에 서식대로
  렌더되는지(크기/가운데/색/링크 클릭). sanitize로 `<script>` 등이 제거되는지 유닛 확인.
- 테스트 글·Blob 정리.
