# H3 관리자 블로그 — 세션 핸드오프

> 다른 세션이 이 파일만 읽고 바로 이어서 작업할 수 있게 정리한 현황 문서.
> 마지막 업데이트: 2026-07-28 · 브랜치: `feat/admin-blog-phase1-db`

## 1. 지금까지 완성된 것 (동작 확인됨)

홈페이지에서 직접 블로그를 쓰는 **관리자 시스템**을 구축했다. (상세 동작은
`AGENTS.md`의 "Admin (`/admin`)" 섹션 참고.)

- **DB 블로그**: Neon Postgres + Drizzle(`lib/db/`). posts/users 테이블. 공개
  블로그 읽기는 `lib/posts.ts`(프로덕션에서 draft 제외).
- **글쓰기/편집**: `/admin` 목록(발행+임시저장 배지) → 새 글/편집/삭제. Tiptap
  마크다운 에디터. slug 자동(오늘 날짜, 수정 가능, 서버 dedupe). 임시저장(draft)/
  발행 전환.
- **이미지 업로드**: 커버 + 본문, Vercel Blob **public 스토어**(`blog/<slug>/`),
  클라이언트 직접 업로드(토큰 라우트 `app/api/admin/blob-upload`). 본문 이미지는
  URL에 `?w&h`를 실어 next/image로 렌더.
- **인증(2겹)**: 게이트 비번(`/admin/gate`) → 아이디+비번 로그인(`/admin/login`).
  jose JWT httpOnly 쿠키, `proxy.ts` 엣지 가드 + 서버 액션/업로드 `requireAdmin()`.
  비번은 bcrypt 해시로 `users.passwordHash`에 저장(평문 아님). 로그인 id는
  `username`.

검증: tsc/lint/`test:unit`(auth-session 8개 포함)/`verify:posts`/`pnpm build`
exit 0. browse E2E로 게이트→로그인→목록→편집→발행→삭제, 업로드 401까지 확인.

## 2. ⚠️ 커밋 안 된 작업 (다음 세션이 먼저 처리)

**인증 기능 + `email→username` 개명 + 문서**가 전부 미커밋 상태. 논리 단위 커밋
제안(한국어 메시지, Co-Authored-By 금지, `.claude/settings.json`은 스테이징 금지):

- `관리자(인증): jose 세션 모듈 + 의존성(jose·bcryptjs)`
  → `lib/auth/session.ts`, `tests/unit/auth-session.test.ts`, `tests/unit/run.ts`,
  `package.json`, `pnpm-lock.yaml`
- `관리자(인증): 게이트/로그인/로그아웃 액션 + requireAdmin + proxy 가드`
  → `actions/admin/auth.ts`, `lib/auth/require-admin.ts`, `proxy.ts`
- `관리자(인증): 게이트·로그인 페이지 + 서버 방어 + 로그아웃 + 시드`
  → `app/admin/gate/`, `app/admin/login/`, `actions/admin/posts.ts`,
  `app/api/admin/blob-upload/route.ts`, `app/admin/layout.tsx`,
  `scripts/create-admin.ts`
- `관리자(인증): 로그인 아이디를 email→username으로 변경`
  → `lib/db/schema.ts` (Neon 컬럼은 ALTER 이미 반영됨)
- `문서: 관리자 인증/블로그 시스템 AGENTS.md + 핸드오프`
  → `AGENTS.md`, `docs/superpowers/specs|plans/2026-07-28-admin-auth*`,
  `docs/superpowers/HANDOFF.md`

(커밋은 **사용자가 명시적으로 지시할 때만**. 커밋 전 `pnpm build` exit 0 확인.)

## 3. 환경/계정 상태

- `.env.local`(로컬)에 있음: `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`(public 스토어),
  `AUTH_SECRET`, `ADMIN_GATE_PASSWORD`, + 기존 Resend/Turnstile/Telegram.
- **관리자 계정**: `users`에 `username=admin`(role=owner) 1건 존재. 로그인 됨.
  (비번은 로컬 테스트로 정해둔 값. 사용자가 `create:admin`로 언제든 변경 가능.)
- Neon: `users.email` → `users.username` 컬럼 **개명 완료**(ALTER 적용됨).
- **Vercel 배포 env 미설정**: `AUTH_SECRET`·`ADMIN_GATE_PASSWORD`를 Vercel
  대시보드에 넣어야 배포된 `/admin`이 동작(로컬만 되어 있음).

## 4. 실행/테스트 방법

- dev 서버: `PORT=8000 pnpm dev` (이 머신은 **8000 포트** 사용). 끝나면 트리
  종료 + 포트 확인(메모리 규칙).
- 로그인 흐름: `http://localhost:8000/admin` → 게이트 비번(`.env.local`의
  `ADMIN_GATE_PASSWORD`) → 아이디 `admin` + 비번.
- 계정 생성/비번 변경: `pnpm run create:admin <id> <pw>` (같은 id면 비번만 갱신;
  스크립트가 `--` 인자를 걸러줌).
- 검증: `pnpm exec tsc --noEmit`, `pnpm run lint`, `pnpm run test:unit`,
  `pnpm run verify:posts`, `pnpm build`.

## 5. 다음 작업 후보 (후순위/미구현)

- 웹 UI에서 계정/비밀번호 변경(현재는 `create:admin` 스크립트만).
- 사용자 관리·권한(role) 화면. (지금은 단일 owner)
- 에디터 이미지 고아 정리(글에서 지운 Blob), 드래그앤드롭/붙여넣기 업로드.
- 배포: Vercel env에 auth 2개 추가 → `main` 머지/배포 후 `/admin` 프로덕션 확인.
- (선택) 로그인 레이트리밋, 세션 만료 UX.

## 6. 지켜야 할 규칙/함정

- 커밋/푸시는 지시받을 때만. 커밋 메시지 한국어, Co-Authored-By 트레일러 금지.
- 빌드 전 node 종료(OOM), 서버는 8000, 끝나면 포트 정리.
- 모든 이미지 next/image. 사용자 노출 문자열은 ko/en 동시(단 `/admin`은 한국어
  전용이라 파리티 밖).
- Blob 스토어는 **public**이어야 함(private은 공개 이미지 못 씀, 변경 불가) —
  메모리 `vercel-blob-public-store` 참고.
- `proxy.ts`가 import하는 `lib/auth/session.ts`는 엣지 안전(next/headers·bcrypt·
  DB import 금지).
