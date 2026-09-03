# 블로그 본문 이미지 업로드 — 설계

- 날짜: 2026-07-28
- 상태: 승인 대기
- 선행: 커버 이미지 업로드(서버 액션, `actions/admin/upload.ts`)는 본 설계에서
  클라이언트 직접 업로드 방식으로 **교체·통일**한다.

## 목표

관리자 글쓰기 폼(`/admin/posts/new`)의 리치텍스트 에디터 본문에 **여러 장의
이미지**를 삽입할 수 있게 한다. 이미지는 Vercel Blob(공개)에 저장하고, 본문
마크다운에 URL로 인라인 참조한다. 렌더링은 프로젝트 하드룰(모든 이미지 =
next/image)을 지키며 레이아웃 시프트가 없어야 한다.

## 비목표 (v1 제외 / 후순위)

- 본문에서 이미지를 지웠을 때 Blob 고아 파일 자동 삭제 (추후 "글 삭제" 기능에서
  `blog/<slug>/` prefix 일괄 삭제로 처리).
- 붙여넣기/드래그앤드롭 업로드.
- 인라인 alt·캡션 편집 UI, 이미지 리사이즈 핸들.
- 이미지 갤러리(자산 재사용) 관리 화면.
- 업로드 라우트 인증(현재 `/admin`은 무인증). Phase 2 로그인에서 붙인다 — 본
  설계는 그 자리를 남겨둔다.

## 저장 모델

- **바이너리는 Blob, DB에는 텍스트+참조만.** `posts` 스키마는 변경 없음. 본문
  이미지는 `body` 마크다운 안의 `![alt](url)`로만 존재한다. 별도 이미지 테이블
  없음.
- Blob 경로는 **slug별 폴더**:
  - 커버: `blog/<slug>/cover-<random>.<ext>`
  - 본문: `blog/<slug>/body-<random>.<ext>`
  - `addRandomSuffix: true`로 파일명 충돌 방지.
- "이 글의 이미지 목록"이 필요하면 `blog/<slug>/` prefix 조회로 얻는다(v1엔 UI
  없음).
- **slug 선행 요건:** 폴더가 slug 기준이므로 업로드 전에 slug가 있어야 한다.
  제목 입력 시 slug가 자동 채워지지만, 비어 있으면 커버·본문 이미지 버튼을
  비활성화하고 "slug를 먼저 입력하세요" 안내를 띄운다.

## 업로드 방식 — 클라이언트 직접 업로드

Vercel 권장 방식. 파일이 브라우저 → Blob 직행이라 서버리스 본문 크기 한계와
`bodySizeLimit` 설정이 불필요하다. 커버·본문 모두 이 한 갈래로 통일한다.

- **라우트:** `app/api/admin/blob-upload/route.ts`
  - `@vercel/blob/client`의 `handleUpload`로 토큰 발급.
  - `onBeforeGenerateToken(pathname)`에서 서버 검증:
    - `pathname`이 `blog/`로 시작하고 세그먼트가 `blog/<slug>/<file>` 형태인지
      (경로 화이트리스트).
    - 허용 콘텐츠 타입: `image/jpeg`, `image/png`, `image/webp`, `image/avif`.
    - `maximumSizeInBytes`: 5MB.
  - `onUploadCompleted`: 후처리 없음(DB 저장 안 함). 로컬(localhost)에서는 호출
    안 되지만 업로드 자체엔 영향 없음.
  - (인증 훅 자리만 주석으로 남김 — Phase 2에서 세션 검사 추가.)
- **클라이언트:** `@vercel/blob/client`의 `upload(pathname, file, { access:
  "public", handleUploadUrl: "/api/admin/blob-upload", contentType })` 사용,
  반환 `{ url }` 사용.

## next/image 치수 처리 (핵심)

원격 Blob 이미지는 `rehypeImageDimensions`(로컬 `/` public 이미지만 측정)가
치수를 못 구해 raw `<img>` 폴백 → 하드룰 위반. 다음으로 해결한다.

- **업로드 직전 브라우저에서 실제 픽셀 크기 측정**: `createImageBitmap(file)`로
  `width`/`height`를 얻는다(서버 의존성 0).
- 본문에 삽입하는 URL에 치수를 쿼리로 붙인다:
  `![alt](https://...blob.../body-x.jpg?w=1200&h=800)`
- `mdx-components.tsx`의 `img`를 수정: `width`/`height` 프롭이 없으면 **src
  쿼리(`?w=&h=`)에서 파싱**해 next/image로 렌더. 로컬 이미지(기존 rehype
  경로)와 원격 Blob 이미지 둘 다 next/image가 되고 레이아웃 시프트가 없다.
  - 쿼리 파싱 실패(치수 없음) 시에만 기존 raw `<img>` 폴백 유지(안전망).
- **커버 이미지는 치수 불필요:** `PostCard`·상세 페이지 모두 next/image `fill`
  모드라 width/height가 필요 없다. 커버는 URL에 치수를 붙이지 않는다.
- `next.config.ts` `images.remotePatterns`에 `**.public.blob.vercel-storage.com`
  허용(이미 추가됨).

## 에디터 UX

- `@tiptap/extension-image`를 확장에 추가.
- 툴바에 **"이미지"** 버튼 추가(선언적 `toolbarItems` 구조에 항목 추가하는 대신,
  파일 입력이 필요하므로 전용 버튼/핸들러로 분리).
- 동작: 버튼 → 파일 선택(**여러 장 동시 선택 허용**) → 각 파일에 대해
  1) `createImageBitmap`으로 치수 측정 → 2) `upload()`로
  `blog/<slug>/body-...`에 업로드 → 3) 커서 위치에 순서대로 이미지 노드 삽입
  (`src = url?w=W&h=H`, `alt = 확장자 뺀 파일명`). "업로드 중…" 표시.
- slug가 없으면 버튼 비활성화 + 안내.

## 마크다운 왕복(round-trip)

- 저장: Tiptap 이미지 노드 → tiptap-markdown이 `![alt](src)`로 직렬화(src의
  쿼리 문자열 보존).
- 재편집(추후 편집 기능): `![alt](url?w&h)` → 이미지 노드로 복원(src 그대로).

## 컴포넌트 경계

- `app/api/admin/blob-upload/route.ts` — 토큰 발급/검증. 입력: 업로드 요청.
  출력: 클라이언트 업로드 토큰. 의존: `@vercel/blob/client` `handleUpload`,
  env `BLOB_READ_WRITE_TOKEN`.
- `lib/blob-upload.ts`(신규, 클라이언트 유틸) — `uploadImage(file, { slug,
  kind })`: 경로 구성 + 치수 측정 + `upload()` 호출 → `{ url, width, height }`.
  커버(kind="cover")와 본문(kind="body")이 공유. 의존: `@vercel/blob/client`.
- `components/admin/CoverImageField.tsx` — 서버 액션 대신 `uploadImage(file,
  {slug, kind:"cover"})` 사용하도록 교체.
- `components/admin/RichTextEditor.tsx` — Image 확장 + "이미지" 버튼 추가,
  `uploadImage(file, {slug, kind:"body"})` 호출. slug를 prop으로 받는다.
- `components/admin/PostForm.tsx` — RichTextEditor에 `slug` prop 전달.
- `mdx-components.tsx` — `img`가 src 쿼리 치수를 읽도록 수정.
- 제거: `actions/admin/upload.ts`(커버용 서버 액션 — 클라이언트 업로드로 대체).
  - 주의: `next.config.ts`의 `experimental.serverActions.bodySizeLimit`은
    **문의 폼 첨부파일용 기존 설정이므로 그대로 둔다**(커버 업로드와 무관).

## 테스트 / 검증

- `pnpm exec tsc --noEmit`, `pnpm run lint` 통과.
- 수동/`browse` 스모크: slug 입력 → 본문에 이미지 2장 삽입 → 발행 → `/blog/
  <slug>`에서 두 이미지가 **next/image**(`_next/image?...`)로, 치수 반영되어
  렌더되는지 확인. 커버도 정상.
- i18n: 새 사용자 노출 문자열("이미지", "업로드 중…", 안내문)은 `/admin`이
  한국어 전용이라 next-intl 밖이지만, 톤은 한국어로 통일.

## 위험 / 메모

- 로컬에서 `onUploadCompleted` 미호출 — 후처리에 의존하지 않으므로 무해.
- slug 변경 기능이 생기면 slug 폴더의 고아 문제 대두 → 그때 재배치 또는 id 폴더
  전환 재검토.
- 업로드 라우트 무인증 상태 — Phase 2 전까지 `/admin`이 공개이므로 동일 위험
  수준. Phase 2에서 세션 가드 추가.
