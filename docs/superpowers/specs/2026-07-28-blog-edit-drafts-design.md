# 블로그 임시저장 + 편집/삭제 — 설계

- 날짜: 2026-07-28
- 상태: 승인됨(구현 계획 작성 예정)
- 선행: 작성 폼(`PostForm`) + 이미지 업로드 + createPost 이미 구현/커밋됨.

## 목표

"임시저장 = 비공개 저장(글 쓰다 멈춤) → 나중에 이어 쓰기 → 발행" 흐름을
완성한다. 이를 위해 관리자 글 목록에서 임시저장/발행글을 관리하고, 기존 글을
불러와 편집·발행 전환·삭제할 수 있게 한다. 임시저장글은 공개 사이트에서 목록·
상세 모두 노출되지 않는다(진짜 비공개).

## 사용자 흐름

글 작성 → **[임시저장]** → `/admin` 목록에 "임시저장" 배지로 남음 → 나중에
**[편집]** → 이어 쓰기 → **[발행하기]** → 공개(`/blog/<slug>`).

## 범위

- 관리자 글 목록(`/admin`): 발행 + 임시저장 **모두** 표시, 상태 배지, 편집·삭제.
- 편집 화면(`/admin/posts/[slug]/edit`): 기존 글 값 로드 → 수정 → 발행/임시저장.
- 삭제: 목록에서 글 삭제(확인 후), 해당 글의 Blob 이미지(`blog/<slug>/`)도 정리.
- 공개 비공개화: 임시저장글은 `/blog` 목록·상세·사이트맵·RSS·정적경로에서 제외,
  상세 URL 직접 접근 시 404.

## 비목표 (후순위)

- 로그인/권한(Phase 2). 지금 `/admin`은 여전히 무인증(링크로 노출 안 됨).
- 슬러그 변경 시 옛 URL 301 리다이렉트(그냥 옛 URL은 404가 됨).
- 자동 임시저장(타이핑 중 주기 저장), 버전 이력.

## 공개/비공개 규칙 (이미 구현됨 — 변경 없음)

공개 사이트의 draft 비공개는 이미 `!isProd` 패턴으로 완성돼 있다. **건드리지
않는다**:

- `getAllPosts`가 프로덕션에서 draft 제외 → 블로그 목록·사이트맵·
  generateStaticParams 모두 draft 안 나옴.
- 상세(`app/[locale]/blog/[slug]/page.tsx`)는 `post.draft && production`이면
  `notFound()` (직접 URL 접근도 404).
- dev(로컬)에서는 draft가 미리보기용으로 보인다(로컬 전용이라 무해).

즉 "임시저장 = 남들이 못 봄"은 배포 환경에서 이미 보장된다. 이번 작업은 **관리자
쪽**만 손댄다.

## 실제 변경 지점 (요약)

1. **관리자 목록이 draft를 항상 보이게**: `/admin`이 `getAllPosts("ko")`(프로덕션
   에서 draft를 거름) 대신 `queryAllPosts(true)`를 직접 써서 배포 환경에서도
   임시저장글을 보여준다.
2. 편집(`updatePost` + edit 페이지 + PostForm 겸용).
3. 삭제(`deletePost` + 버튼).
4. 저장 후 이동: 임시저장 → `/admin`.

## 컴포넌트/파일 설계

- `lib/db/posts-repo.ts` — 이미 `queryAllPosts(includeDrafts)`,
  `queryPostBySlug` 있음. 편집 로드는 `queryPostBySlug` 재사용.
- `actions/admin/posts.ts` — 액션 추가:
  - `updatePost(originalSlug, input)`: 해당 글을 찾아 필드 갱신. slug 변경 시
    중복이면 `-2`… 부여(자기 자신 제외). `updatedAt` 갱신. `updateTag("posts")`.
    반환 `{ ok, slug }`(변경된 최종 slug).
  - `deletePost(slug)`: DB 행 삭제 + `list({prefix:'blog/<slug>/'})` → `del`로
    Blob 정리. `updateTag("posts")`. 반환 `{ ok }`.
  - 기존 `createPost`는 그대로.
- `components/admin/PostForm.tsx` — **작성/편집 겸용**으로 확장:
  - prop `initialPost?: {slug,title,summary,category,tags,coverImage,body,draft}`
    와 `mode: "new" | "edit"`.
  - edit 모드: 상태 초기값을 `initialPost`에서 채움(slug=기존 slug라 날짜 자동
    채우기 effect는 건드리지 않음). 제출 시 `updatePost(originalSlug, ...)`.
  - new 모드: 지금 동작 그대로(`createPost`).
  - 저장 후 이동: **발행 → `/blog/<slug>`**, **임시저장 → `/admin`**.
- `app/admin/posts/[slug]/edit/page.tsx` (신규) — 서버 컴포넌트. slug로
  `queryPostBySlug` → 없으면 `notFound()` → `rowToPost` → `<PostForm mode="edit"
  initialPost={...} />`.
- `app/admin/page.tsx` — `queryAllPosts(true)` 직접 사용. 각 행에 상태 배지 +
  `[편집]`(→ edit 페이지) + `[삭제]`. 삭제는 작은 클라이언트 컴포넌트
  `DeletePostButton`(확인 다이얼로그 → `deletePost` 호출 → 목록 갱신).
- `components/admin/DeletePostButton.tsx` (신규) — 클라이언트. `confirm()` 후
  `deletePost(slug)` 호출, 성공 시 `router.refresh()`.
- 공개 라우트(`blog/[slug]`, 목록, sitemap 등)는 **변경 없음**(draft 비공개 이미
  구현됨).

## 엣지/주의

- 편집에서 slug를 바꾸면 이미지 폴더명(`blog/<옛slug>/`)과 안 맞지만, 이미지
  URL은 절대경로로 body/coverImage에 박혀 있어 **표시엔 문제없음**(폴더명 불일치
  는 무해). 삭제 시 prefix는 현재 slug 기준이라, slug를 바꾼 글은 옛 폴더 이미지가
  남을 수 있음 — 후순위(고아 정리)로 둔다.
- `updatePost` 중복 검사에서 **자기 자신은 제외**(자기 slug로 저장 시 -2 안 붙게).
- 목록 정렬: 최신 `publishedAt`/`createdAt` 내림차순(현재 동작 유지).

## 테스트/검증

- `pnpm exec tsc --noEmit`, `pnpm run lint`, `pnpm run test:unit`,
  `pnpm run verify:posts`, `pnpm build` (exit 0).
- browse 스모크(로컬 dev — dev에선 draft가 미리보기로 보이므로 "직접 접근 404"는
  프로덕션 전용, 여기선 검증 대상 아님):
  1) 새 글 [임시저장] → `/admin` 목록에 **"임시저장" 배지**로 나타남 확인, 이동이
     `/admin`으로 됐는지 확인.
  2) 목록 [편집] → 본문 수정 → [발행하기] → `/blog/<slug>` 200, `/admin` 목록에서
     배지가 "발행"으로 바뀜 확인.
  3) [삭제] → `/admin` 목록에서 사라짐, `/blog/<slug>` 404 확인, Blob 이미지 제거
     확인(list prefix).
- 프로덕션 draft 비공개(목록/상세 404)는 기존 로직 그대로라 재검증 불필요.
- i18n: `/admin`은 한국어 전용(next-intl 밖)이라 파리티 영향 없음.
