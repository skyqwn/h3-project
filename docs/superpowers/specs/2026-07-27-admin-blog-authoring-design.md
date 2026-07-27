# 관리자 블로그 작성 기능 — 설계 (Spec)

작성일: 2026-07-27

## 1. 목적 / 배경

지금 블로그 글은 `content/posts/*.mdx` 파일을 개발자가 직접 추가·배포해야
올라간다. 운영자가 **홈페이지에서 직접 로그인해 글을 작성/수정/삭제**할 수
있게 만든다. 이를 위해 DB(Postgres)와 관리자 영역을 새로 도입한다.

이 사이트는 현재 **DB가 전혀 없다**(콘텐츠=파일, 문의=이메일/텔레그램).
이번 작업으로 첫 DB가 붙는다.

## 2. 범위 (Scope)

**포함**
- 관리자 로그인(계정 기반) + 진입 게이트
- 블로그 글 CRUD(작성/수정/삭제, 임시저장/발행)
- 위지윅 에디터 + 이미지 업로드
- 관리자 계정 관리(추가/삭제) — `owner` 전용
- 기존 블로그 2글 DB 이관, 블로그 데이터 소스를 파일→DB로 전환

**제외 (YAGNI / 이번 아님)**
- 문의(contact) 내역 DB 저장
- 제품(products) 관리 — 계속 mdx 파일 유지
- 영어 블로그 작성(한국어 전용) — 영어 페이지는 현행처럼 한국어 내용 노출
- 공개 회원가입, 댓글, 조회수 등

## 3. 확정된 결정

| 항목 | 결정 |
| --- | --- |
| 범위 | 블로그 글쓰기만 |
| 인증 | 계정(이메일+비번), Auth.js, users 테이블, 계정 관리 화면 |
| 진입 보안 | 2겹 — 게이트 비번(Basic Auth) + 계정 로그인 |
| 데이터 소스 | DB로 완전 이전(기존 2글 이관, 제품은 mdx 유지) |
| 에디터 | Tiptap 위지윅, **저장은 마크다운** |
| 다국어 | 한국어만 |
| 관리자 UI 언어 | 한국어 전용(공개 사이트 한/영 규칙의 명시적 예외) |
| DB | Neon Postgres(Vercel 경유) |
| ORM | Drizzle |
| 이미지 | Vercel Blob |
| 세션 | Auth.js JWT + bcrypt 해시 |
| 렌더 신선도 | ISR + `revalidateTag("posts")` |

### 에디터가 마크다운을 저장하는 이유

일반 위지윅은 HTML을 저장하지만, 이 프로젝트는 **"모든 이미지는 next/image"**
가 하드 규칙이다. 본문을 HTML로 저장하면 이미지가 raw `<img>`로 렌더돼 규칙
위반 + 최적화 손실이 된다. 따라서 위지윅 편집 경험은 살리되(Tiptap) **출력은
마크다운**으로 저장해, 기존 `MDXRemote` 렌더 파이프라인(`img`→next/image,
`rehypeImageDimensions`)과 `lib/rss.ts`(마크다운→HTML)를 그대로 재사용한다.

## 4. 아키텍처 / 라우트 구조

공개 사이트는 그대로(한국어 `/`, 영어 `/en`). 관리자 영역만 **다국어 밖의
별도 구역 `/admin`**으로 신설(검색엔진 비노출).

```
/admin/login             로그인 폼
/admin                   대시보드 = 글 목록(수정/삭제/새글)
/admin/posts/new         새 글 작성(Tiptap + 미리보기)
/admin/posts/[id]/edit   글 수정
/admin/users             계정 관리(목록/추가/삭제) — owner 전용
```

서버 측(모두 관리자 전용):
- `/api/auth/[...nextauth]` — Auth.js
- `/api/admin/upload` — 이미지 업로드 → Vercel Blob
- 글/계정 CRUD — 서버 액션(`actions/admin/posts.ts`, `actions/admin/users.ts`),
  `actions/contact.ts`와 동일한 `"use server"` 패턴

### i18n 제외 + 접근 보호

- `proxy.ts`를 조합형으로 변경: 요청 경로가 `/admin` 또는 `/api/admin`이면
  Basic Auth 게이트 검사, 그 외 경로는 기존 next-intl 미들웨어 그대로.
- `app/admin/layout.tsx`(서버, Node 런타임)에서 `auth()`로 세션 확인 →
  미로그인 시 `/admin/login` 리다이렉트. 로그인 페이지는 예외.
- `/admin/users`는 세션 `role === 'owner'`만 허용.
- `robots.ts`에 `/admin` disallow, 관리자 페이지 `noindex`.

## 5. 데이터 모델 (Drizzle / Postgres)

### `users`
| 컬럼 | 타입 | 비고 |
| --- | --- | --- |
| id | uuid PK | |
| email | text unique | 로그인 ID |
| passwordHash | text | bcrypt |
| name | text | 표시용 |
| role | text not null default `'editor'` | `owner` = 계정관리 가능 / `editor` = 글만 |
| createdAt | timestamptz default now | |

### `posts`
| 컬럼 | 타입 | 비고 |
| --- | --- | --- |
| id | uuid PK | 수정/삭제 식별자 |
| slug | text unique | URL(영문 kebab, 수동 입력) |
| title | text | |
| summary | text | 목록·RSS 요약 |
| coverImage | text | 대표 이미지 URL |
| category | text | `news` / `article` / `update` |
| tags | text[] | |
| body | text | **마크다운 본문** |
| author | text default `'H3'` | |
| draft | boolean default true | true=비공개 |
| publishedAt | date | 발행일 |
| createdAt / updatedAt | timestamptz | updatedAt 저장 시 갱신 |

`posts`는 현재 `PostFrontmatterSchema`와 1:1 대응 → `lib/posts.ts`만 DB
조회로 교체하면 소비자(블로그 목록/상세/태그/카테고리/페이지네이션/RSS/
sitemap)는 변경 없음.

## 6. 데이터 흐름

**읽기(공개)** — 서버 컴포넌트에서 DB 직접 조회. 별도 API/클라이언트 fetch
없음. `lib/posts.ts`의 `getAllPosts`/`getPost`가 파일 대신 Drizzle 쿼리를
수행하고, 반환 `Post` 타입·draft 필터(프로덕션)·정렬(발행일 최신순)은 유지.
모든 글 조회는 캐시 태그 `"posts"`로 감싼다.

**쓰기(관리자)** — 서버 액션 `createPost`/`updatePost`/`deletePost`. 저장 전
zod 검증(필수 필드, slug kebab 형식 + 중복 검사). 성공 시
`revalidateTag("posts")` 호출 → 목록·상세·태그·카테고리·RSS·sitemap 일괄
최신화. 새 slug 상세는 요청 시 생성(dynamicParams).

**이미지 업로드** — 에디터에서 파일 선택 → `/api/admin/upload` →
`@vercel/blob` `put()` → 반환 절대 URL을 에디터가 마크다운 이미지로 삽입.
기존 2글의 `/blog/...`(public) 이미지와 신규 Blob URL 혼재 OK(렌더·RSS
절대경로 처리 양쪽 지원).

**인증 흐름**
```
게이트(Basic Auth) 통과 → /admin/login → Auth.js authorize
   (email로 user 조회 → bcrypt 비번 대조) → JWT 세션(role 포함)
→ app/admin/layout.tsx auth() 가드 → /admin/users 는 owner 만
```

## 7. 보안 / 환경변수

- 게이트: 엣지에서 Basic Auth 헤더를 env와 상수시간 비교.
- 비번: bcrypt 해시만 저장(평문 금지). 로그인 실패 메시지는 일반화.
- 서버 액션은 Next 기본 origin 검증 + 게이트/세션으로 보호. 로그인
  레이트리밋은 추후(YAGNI).

**새 환경변수** (`lib/env.ts` + `.env.local` + Vercel)
| 변수 | 필수 | 비고 |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Neon(Vercel 자동 주입) |
| `AUTH_SECRET` | ✅ | Auth.js 서명 |
| `ADMIN_GATE_PASSWORD` | ✅ | 게이트 공용 비번 |
| `ADMIN_GATE_USER` | ⬜ | 기본 `admin` |
| `BLOB_READ_WRITE_TOKEN` | ✅ | Vercel Blob(스토어 연결 시 자동 주입) |

`lib/env.ts`는 필수 변수 누락 시 빌드 실패하므로, 롤아웃 순서(§9)대로 변수를
먼저 세팅한다.

## 8. 에러 처리 / 테스트

**에러**
- 쓰기: `{ ok, error }` 반환(contact 패턴). slug 중복·검증 오류를 폼에 표시.
- 업로드: 용량·형식 검증(`validateUpload` 패턴), Blob 실패 처리.
- 읽기: DB 장애 시 에러 바운더리로 안전 처리.

**테스트** (repo 관례: 순수 로직만 tsx 유닛, UI는 빌드+브라우저)
- 유닛: slug 검증 / zod 스키마 / bcrypt 해시·검증.
- DB 로직: 데이터 접근 계층을 얇게 유지, Neon 브랜치 DB로 스모크 스크립트.
- 관리자 플로우: `pnpm build` + 브라우저 수동 확인.
- 게이트: `pnpm exec tsc --noEmit`, `pnpm run lint`, `pnpm run check:i18n`.

## 9. 마이그레이션 / 롤아웃

**스크립트**(모두 `--env-file tsx` 방식)
1. Drizzle 스키마 + `drizzle-kit`으로 테이블 생성.
2. `scripts/seed-admin.ts` — 최초 `owner` 계정 1개 생성.
3. `scripts/migrate-posts.ts` — 기존 `content/posts/*.ko.mdx` 2글 파싱해 DB
   이관(마크다운 그대로). 이후 파일 및 fs 읽기 코드 제거(제품 mdx는 유지).

**롤아웃 순서**
1. Vercel에 Postgres(Neon) + Blob 스토어 생성 → env 자동 주입.
2. `ADMIN_GATE_PASSWORD`, `AUTH_SECRET`을 Vercel + `.env.local`에 세팅.
3. 스키마 push.
4. 시드(owner) + 글 이관.
5. 코드 배포.

## 10. 추가 의존성

`drizzle-orm`, `drizzle-kit`, `@neondatabase/serverless`, `next-auth`(Auth.js
v5), `bcryptjs`(+`@types/bcryptjs`), `@vercel/blob`, `@tiptap/react` +
`@tiptap/starter-kit` + 필요한 확장 + 마크다운 직렬화 확장.

## 11. 구현 시 검증 필요(주의)

이 저장소는 커스터마이즈된 Next 16이다(AGENTS.md). 아래는 구현 착수 시
`node_modules/next/dist/docs/` 및 각 패키지 문서로 **호환성 확인 후** 진행:
- Auth.js v5 + Next 16 App Router 연동 방식(핸들러/세션/미들웨어 분리).
- Tiptap + React 19 호환 및 마크다운 직렬화 확장 선택.
- `proxy.ts`(Next 16의 middleware 대체) 조합 방식과 엣지 런타임 제약.
- Drizzle + `@neondatabase/serverless` 드라이버 설정.

## 12. 미해결/후속

- 로그인 레이트리밋, 비번 재설정 플로우(후속).
- 문의 내역 DB 저장(후속, 별도 스펙).
- 영어 블로그 작성(후속).
