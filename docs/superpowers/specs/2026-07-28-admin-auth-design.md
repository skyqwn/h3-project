# /admin 인증(게이트 + 로그인) — 설계

- 날짜: 2026-07-28
- 상태: 승인됨(구현 계획 작성 예정)
- 선행: `/admin` 글 작성/편집/삭제 기능 구현됨(무인증 상태). `users` 테이블 이미
  존재(id, email unique, passwordHash, name, role, createdAt).

## 목표

`/admin` 전체를 2겹으로 잠근다: **① 게이트 공용 비번 → ② 계정 로그인(이메일 +
bcrypt)**. 운영자 1명 기준(사용자 관리·권한·소셜로그인 등은 안 함). Auth.js를
쓰지 않고 가벼운 자체 세션(jose JWT httpOnly 쿠키)으로 구현한다.

## 흐름

```
/admin/* 접근
  게이트 쿠키 없음 → /admin/gate (비번 1칸) → 맞으면 admin_gate 쿠키
  게이트 OK·세션 없음 → /admin/login (이메일+비번) → 맞으면 admin_session 쿠키
  둘 다 OK → /admin 정상
```

## 비목표(후순위)

- 사용자 관리 화면(`/admin/users`), role 기반 권한, 회원가입, 비번 재설정,
  로그인 레이트리밋, 소셜 로그인.

## 인증 메커니즘

- **쿠키(둘 다 httpOnly, sameSite=lax, path=/, secure=프로덕션):**
  - `admin_gate`: 게이트 통과 표식(JWT `{gate:true}`, 만료 30일).
  - `admin_session`: 로그인 세션(JWT `{sub: email}`, 만료 7일).
- **서명/검증**: `jose`(엣지·Node 양쪽 동작)로 HS256, 키는 `AUTH_SECRET`.
- **비번 해시**: `bcryptjs`(순수 JS, Node 런타임 전용 — 로그인 서버 액션에서만).

## 파일/컴포넌트 설계

- `lib/auth/session.ts` — jose 래퍼(엣지 안전):
  - `signGate(): Promise<string>` / `verifyGate(token): Promise<boolean>`
  - `signSession(email): Promise<string>` / `verifySession(token):
    Promise<{ sub: string } | null>`
  - 쿠키 이름 상수 `GATE_COOKIE`, `SESSION_COOKIE` export.
- `actions/admin/auth.ts` — 서버 액션(Node):
  - `submitGate(password): Promise<{ok:boolean; error?:string}>` —
    `ADMIN_GATE_PASSWORD`와 **상수시간 비교**(`crypto.timingSafeEqual`) → 통과 시
    `cookies().set(GATE_COOKIE, await signGate(), …)`.
  - `login(email, password): Promise<{ok:boolean; error?:string}>` — email로
    user 조회 → `bcrypt.compare` → 통과 시 세션 쿠키 발급. 실패 메시지는
    "이메일 또는 비밀번호가 올바르지 않습니다."로 일반화.
  - `logout(): Promise<void>` — 세션 쿠키 삭제 후 `/admin/login`은 클라이언트에서
    이동(폼 action). (게이트 쿠키는 유지)
  - `requireAdmin(): Promise<boolean>` — `cookies()`에서 세션 쿠키 읽어
    `verifySession`. 미인증이면 false. (서버 액션/라우트 방어용)
- `app/admin/gate/page.tsx` — 게이트 폼(비번 1칸, 클라이언트) → `submitGate` →
  성공 시 `/admin/login`으로.
- `app/admin/login/page.tsx` — 로그인 폼(이메일+비번, 클라이언트) → `login` →
  성공 시 `/admin`으로.
- `proxy.ts` — /admin 가드 추가(엣지):
  - matcher에서 `admin` 제외를 풀어 `/admin/*`도 프록시가 받게 한다.
  - 함수로 감싸: `pathname`이 `/admin`으로 시작하면 게이트/세션 쿠키를
    `verifyGate`/`verifySession`으로 검사 → `/admin/gate`(게이트 없음)·
    `/admin/login`(세션 없음)으로 리다이렉트. `/admin/gate`는 항상 통과,
    `/admin/login`은 게이트 통과 시 접근 허용. 그 외 경로는 기존 next-intl
    미들웨어 그대로 실행.
- **서버 진입점 방어**(리다이렉트만으론 직접 호출을 못 막음):
  - `actions/admin/posts.ts`의 `createPost`/`updatePost`/`deletePost` 맨 앞에서
    `if (!(await requireAdmin())) return {ok:false, error:"로그인이 필요합니다."}`.
  - `app/api/admin/blob-upload/route.ts` POST 시작에서 세션 검사 → 미인증이면
    401 반환.
- `app/admin/layout.tsx` — 헤더에 **로그아웃** 버튼 추가(`<form action={logout}>`),
  기존 nav 유지.
- `scripts/create-admin.ts` (신규) — 운영자 계정 시드. `process.argv`로
  `<email> <password>`를 받아 bcrypt 해시 → `users`에 upsert(email 기준).
  `package.json`에 `create:admin` 스크립트 추가.

## 환경변수 (둘 다 `.env.local`에 설정 완료)

- `ADMIN_GATE_PASSWORD` — 게이트 공용 비번(필수). 코드에서 필수 체크.
- `AUTH_SECRET` — 쿠키 서명 키(필수, 32바이트 base64).
- 배포용으로 Vercel 대시보드 env에도 동일하게 넣어야 프로덕션 `/admin` 동작(문서에
  명시, 코드 변경 없음).

## 보안 메모

- 게이트 비번은 상수시간 비교, 로그인 비번은 bcrypt만 저장(평문 금지).
- 쿠키 httpOnly라 JS로 못 읽음. `AUTH_SECRET` 유출 시 위조 가능 → 서버 전용.
- 엣지(proxy)에선 jose 검증만(bcrypt·DB 조회 없음). DB·bcrypt는 Node 서버 액션.

## 테스트/검증

- deps 추가 후 `pnpm exec tsc --noEmit`, `pnpm run lint`, `pnpm run test:unit`
  (bcrypt 해시/검증 or session sign/verify 순수 함수 유닛 가능), `pnpm build`
  (exit 0).
- 시드: `node --env-file=.env.local --import tsx scripts/create-admin.ts <email>
  <password>` → users 1건.
- browse 스모크(로컬):
  1) 미인증으로 `/admin` → `/admin/gate`로 리다이렉트 확인.
  2) 게이트 비번 입력(맞음) → `/admin/login`으로.
  3) 이메일+비번(시드한 값) → `/admin` 진입, 글 목록 보임.
  4) 로그아웃 → 다시 `/admin` 접근 시 로그인으로.
  5) (방어) 로그아웃 상태에서 글 목록/작성 안 보임, 업로드 라우트 401.
- i18n: `/admin`은 한국어 전용(파리티 영향 없음).
