# /admin 인증(게이트 + 로그인) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/admin`을 게이트 공용 비번 → 계정 로그인(이메일+bcrypt) 2겹으로 잠근다.

**Architecture:** jose JWT httpOnly 쿠키(자체 세션). 엣지(proxy)에선 jose 검증만, DB·bcrypt는 Node 서버 액션. proxy가 `next/headers`를 물지 않도록 jose 전용 모듈(`lib/auth/session.ts`)과 쿠키를 읽는 서버 유틸(`lib/auth/require-admin.ts`)을 분리한다.

**Tech Stack:** Next.js 16(proxy), jose(HS256), bcryptjs, Drizzle(users), next/headers cookies.

## Global Constraints

- 패키지 매니저 **pnpm** 고정.
- **엣지 안전**: `proxy.ts`가 import하는 모듈(`lib/auth/session.ts`)은 `next/headers`·`bcryptjs`·DB를 import하지 않는다(jose·env만).
- 쿠키: httpOnly, sameSite=lax, path=/, secure=프로덕션. `admin_gate`(30일), `admin_session`(7일).
- `AUTH_SECRET`/`ADMIN_GATE_PASSWORD`는 **런타임에서 읽고 없으면 throw**(빌드 게이트 lib/env.ts는 건드리지 않음 — 공개 사이트 배포를 막지 않기 위함). 프로덕션은 Vercel env에도 설정해야 `/admin` 동작(문서화만).
- 실패 메시지 일반화(계정 존재 여부 노출 금지).
- 매 태스크 종료 시 `pnpm exec tsc --noEmit` + `pnpm run lint` 통과.
- **커밋/푸시는 사용자가 명시적으로 지시할 때만.** 각 태스크 commit 단계는 승인 시 실행, 그 전엔 tsc/lint로만 검증. 커밋 전 `pnpm build` exit 0.
- `.claude/settings.json`은 스테이징하지 않는다.

---

### Task 1: 의존성 + jose 세션 모듈 (TDD)

**Files:**
- Modify: `package.json`
- Create: `lib/auth/session.ts`
- Create: `tests/unit/auth-session.test.ts`
- Modify: `tests/unit/run.ts`

**Interfaces:**
- Produces (엣지 안전, `next/headers` 미사용):
  - `GATE_COOKIE = "admin_gate"`, `SESSION_COOKIE = "admin_session"`
  - `signGate(): Promise<string>`, `verifyGate(token?: string): Promise<boolean>`
  - `signSession(email: string): Promise<string>`, `verifySession(token?: string): Promise<{ sub: string } | null>`
  - `cookieBaseOptions: { httpOnly; sameSite; path; secure }` (maxAge는 호출부에서)

- [ ] **Step 1: 의존성 설치**

Run:
```bash
pnpm add jose bcryptjs && pnpm add -D @types/bcryptjs
```
Expected: `jose`, `bcryptjs` deps 추가.

- [ ] **Step 2: 실패하는 테스트 작성**

Create `tests/unit/auth-session.test.ts`:
```ts
import assert from "node:assert/strict";
// 세션 모듈은 secret을 지연 로드하므로 import 후 env를 세팅해도 된다.
process.env.AUTH_SECRET = "test-secret-please-change-1234567890";
const {
  signGate,
  verifyGate,
  signSession,
  verifySession,
} = await import("@/lib/auth/session");

// 게이트 왕복
const g = await signGate();
assert.equal(await verifyGate(g), true);
assert.equal(await verifyGate("garbage.token.here"), false);
assert.equal(await verifyGate(undefined), false);

// 세션 왕복
const s = await signSession("admin@h3.test");
assert.deepEqual(await verifySession(s), { sub: "admin@h3.test" });
assert.equal(await verifySession("nope"), null);
assert.equal(await verifySession(undefined), null);

// 다른 키로는 검증 실패(위조 방지)
process.env.AUTH_SECRET = "a-different-secret-value-000000000000";
assert.equal(await verifyGate(g), false);
assert.equal(await verifySession(s), null);

console.log("auth-session.test: 8 assertions passed.");
```

- [ ] **Step 3: 테스트 실패 확인**

Run:
```bash
pnpm exec tsx tests/unit/auth-session.test.ts
```
Expected: FAIL — `Cannot find module '@/lib/auth/session'`.

- [ ] **Step 4: 세션 모듈 구현**

Create `lib/auth/session.ts`:
```ts
import { SignJWT, jwtVerify } from "jose";

export const GATE_COOKIE = "admin_gate";
export const SESSION_COOKIE = "admin_session";

export const cookieBaseOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
};

// secret은 호출 시점에 읽는다(엣지·테스트·런타임 모두 안전).
function secretKey(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET 환경변수가 없습니다.");
  return new TextEncoder().encode(s);
}

export async function signGate(): Promise<string> {
  return new SignJWT({ gate: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey());
}

export async function verifyGate(token?: string): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload.gate === true;
  } catch {
    return false;
  }
}

export async function signSession(email: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(email)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());
}

export async function verifySession(
  token?: string
): Promise<{ sub: string } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return typeof payload.sub === "string" ? { sub: payload.sub } : null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 5: run.ts에 등록**

Modify `tests/unit/run.ts` — `import "./image-src.test";` 다음 줄에 추가:
```ts
import "./auth-session.test";
```

- [ ] **Step 6: 통과 확인 + 타입/린트**

Run:
```bash
pnpm run test:unit && pnpm exec tsc --noEmit && pnpm run lint
```
Expected: `auth-session.test: 8 assertions passed.` 및 전체 통과, tsc/lint 오류 없음.

- [ ] **Step 7: 커밋(사용자 승인 시)**

```bash
git add package.json pnpm-lock.yaml lib/auth/session.ts tests/unit/auth-session.test.ts tests/unit/run.ts
git commit -m "관리자(인증): jose 세션 서명/검증 모듈 + 의존성(jose·bcryptjs)"
```

---

### Task 2: 인증 서버 액션 + requireAdmin

**Files:**
- Create: `lib/auth/require-admin.ts`
- Create: `actions/admin/auth.ts`

**Interfaces:**
- Consumes: `lib/auth/session.ts`, `next/headers` cookies, `bcryptjs`, `db`, `users`.
- Produces:
  - `requireAdmin(): Promise<boolean>` (server-only util)
  - `submitGate(password: string): Promise<{ ok: boolean; error?: string }>`
  - `login(email: string, password: string): Promise<{ ok: boolean; error?: string }>`
  - `logout(): Promise<void>`

- [ ] **Step 1: requireAdmin 유틸**

Create `lib/auth/require-admin.ts`:
```ts
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "./session";

// 서버 액션/라우트에서 세션(2겹 로그인)을 확인. 미인증이면 false.
export async function requireAdmin(): Promise<boolean> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return (await verifySession(token)) !== null;
}
```

- [ ] **Step 2: 인증 서버 액션**

Create `actions/admin/auth.ts`:
```ts
"use server";

import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import {
  GATE_COOKIE,
  SESSION_COOKIE,
  cookieBaseOptions,
  signGate,
  signSession,
} from "@/lib/auth/session";

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function submitGate(
  password: string
): Promise<{ ok: boolean; error?: string }> {
  const expected = process.env.ADMIN_GATE_PASSWORD;
  if (!expected) return { ok: false, error: "게이트가 설정되지 않았습니다." };
  if (!safeEqual(password, expected)) {
    return { ok: false, error: "비밀번호가 올바르지 않습니다." };
  }
  (await cookies()).set(GATE_COOKIE, await signGate(), {
    ...cookieBaseOptions,
    maxAge: 60 * 60 * 24 * 30,
  });
  return { ok: true };
}

export async function login(
  email: string,
  password: string
): Promise<{ ok: boolean; error?: string }> {
  const generic = "이메일 또는 비밀번호가 올바르지 않습니다.";
  const rows = await db.select().from(users).where(eq(users.email, email));
  const user = rows[0];
  if (!user) return { ok: false, error: generic };
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return { ok: false, error: generic };
  (await cookies()).set(SESSION_COOKIE, await signSession(user.email), {
    ...cookieBaseOptions,
    maxAge: 60 * 60 * 24 * 7,
  });
  return { ok: true };
}

export async function logout(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
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
git add lib/auth/require-admin.ts actions/admin/auth.ts
git commit -m "관리자(인증): 게이트/로그인/로그아웃 서버 액션 + requireAdmin"
```

---

### Task 3: proxy 가드

**Files:**
- Modify: `proxy.ts`

**Interfaces:**
- Consumes: `lib/auth/session.ts`(엣지 안전), next-intl 미들웨어.

- [ ] **Step 1: proxy 재작성**

Replace `proxy.ts` 전체:
```ts
// Next.js 16 renamed the "middleware" file convention to "proxy".
import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import {
  GATE_COOKIE,
  SESSION_COOKIE,
  verifyGate,
  verifySession,
} from "./lib/auth/session";

const intl = createMiddleware(routing);

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // /admin 2겹 가드(엣지): 게이트 쿠키 → 세션 쿠키.
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/gate") return NextResponse.next();
    const gateOk = await verifyGate(req.cookies.get(GATE_COOKIE)?.value);
    if (!gateOk) return NextResponse.redirect(new URL("/admin/gate", req.url));
    if (pathname === "/admin/login") return NextResponse.next();
    const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
    if (!session) return NextResponse.redirect(new URL("/admin/login", req.url));
    return NextResponse.next();
  }

  // 그 외 경로는 기존 next-intl 미들웨어 그대로.
  return intl(req);
}

export const config = {
  // /admin도 프록시가 받도록 admin 제외를 푼다(위 함수에서 next-intl과 분기).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
```

- [ ] **Step 2: 타입/린트**

Run:
```bash
pnpm exec tsc --noEmit && pnpm run lint
```
Expected: 오류 없음.

- [ ] **Step 3: 커밋(사용자 승인 시)**

```bash
git add proxy.ts
git commit -m "관리자(인증): proxy에서 /admin 게이트·세션 가드"
```

---

### Task 4: 게이트 / 로그인 페이지

**Files:**
- Create: `app/admin/gate/page.tsx`
- Create: `app/admin/login/page.tsx`

**Interfaces:**
- Consumes: `submitGate`, `login` (Task 2).

- [ ] **Step 1: 게이트 페이지**

Create `app/admin/gate/page.tsx`:
```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitGate } from "@/actions/admin/auth";

export default function GatePage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitGate(password);
      if (result.ok) router.push("/admin/login");
      else setError(result.error ?? "오류");
    });
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-xl font-bold">접근 확인</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="접근 비밀번호"
          autoFocus
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {pending ? "확인 중…" : "다음"}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: 로그인 페이지**

Create `app/admin/login/page.tsx`:
```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/actions/admin/auth";

export default function LoginPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const input =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none";

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await login(email, password);
      if (result.ok) router.push("/admin");
      else setError(result.error ?? "오류");
    });
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-xl font-bold">관리자 로그인</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일"
          autoFocus
          className={input}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          className={input}
        />
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {pending ? "로그인 중…" : "로그인"}
        </button>
      </form>
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
git add app/admin/gate/page.tsx app/admin/login/page.tsx
git commit -m "관리자(인증): 게이트·로그인 페이지"
```

---

### Task 5: 서버 진입점 방어 + 로그아웃 버튼

**Files:**
- Modify: `actions/admin/posts.ts`
- Modify: `app/api/admin/blob-upload/route.ts`
- Modify: `app/admin/layout.tsx`

**Interfaces:**
- Consumes: `requireAdmin` (Task 2), `logout` (Task 2).

- [ ] **Step 1: posts 액션에 가드 추가**

Modify `actions/admin/posts.ts`:
- import 추가:
```ts
import { requireAdmin } from "@/lib/auth/require-admin";
```
- `createPost`, `updatePost`, `deletePost` **각 함수 본문 첫 줄**에 추가:
```ts
  if (!(await requireAdmin())) {
    return { ok: false, error: "로그인이 필요합니다." };
  }
```
(deletePost의 반환 타입도 `{ ok:false; error }`를 포함하므로 그대로 호환.)

- [ ] **Step 2: 업로드 라우트에 세션 검사**

Modify `app/api/admin/blob-upload/route.ts` — `export async function POST` 본문 맨 앞에 추가:
```ts
  const { requireAdmin } = await import("@/lib/auth/require-admin");
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
```
(동적 import로 두어 라우트 상단 import 구성을 최소 변경. 정적 import로 상단에
넣어도 무방.)

- [ ] **Step 3: 레이아웃에 로그아웃 버튼**

Modify `app/admin/layout.tsx`:
- import 추가:
```tsx
import { logout } from "@/actions/admin/auth";
```
- 헤더 `<nav>` 안, "블로그 보기 →" 링크 다음에 추가:
```tsx
              <form action={logout}>
                <button type="submit" className="text-gray-500 hover:underline">
                  로그아웃
                </button>
              </form>
```

- [ ] **Step 4: 타입/린트**

Run:
```bash
pnpm exec tsc --noEmit && pnpm run lint
```
Expected: 오류 없음.

- [ ] **Step 5: 커밋(사용자 승인 시)**

```bash
git add actions/admin/posts.ts app/api/admin/blob-upload/route.ts app/admin/layout.tsx
git commit -m "관리자(인증): 서버 액션·업로드 라우트 세션 방어 + 로그아웃"
```

---

### Task 6: 운영자 계정 시드 스크립트

**Files:**
- Create: `scripts/create-admin.ts`
- Modify: `package.json`

- [ ] **Step 1: 시드 스크립트**

Create `scripts/create-admin.ts`:
```ts
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email || !password) {
    console.error("사용법: create-admin <email> <password>");
    process.exit(1);
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email));
  if (existing.length > 0) {
    await db.update(users).set({ passwordHash }).where(eq(users.email, email));
    console.log("비밀번호 갱신:", email);
  } else {
    await db
      .insert(users)
      .values({ email, passwordHash, name: "관리자", role: "owner" });
    console.log("관리자 생성:", email);
  }
}

main();
```

- [ ] **Step 2: package.json 스크립트**

Modify `package.json` scripts에 추가:
```json
    "create:admin": "node --env-file=.env.local --import tsx scripts/create-admin.ts",
```

- [ ] **Step 3: 계정 시드 실행(사용자가 이메일/비번 입력)**

Run(이메일·비번은 실제 값으로):
```bash
pnpm run create:admin your@email.com yourStrongPassword
```
Expected: `관리자 생성: your@email.com`. (비번은 셸 히스토리에 남으니 필요 시 정리)

- [ ] **Step 4: 타입/린트**

Run:
```bash
pnpm exec tsc --noEmit && pnpm run lint
```
Expected: 오류 없음.

- [ ] **Step 5: 커밋(사용자 승인 시)**

```bash
git add scripts/create-admin.ts package.json
git commit -m "관리자(인증): 운영자 계정 시드 스크립트(create:admin)"
```

---

### Task 7: E2E 스모크 + 빌드

**Files:** (없음 — 검증)

- [ ] **Step 1: 개발 서버(8000) 기동**

8000에서 안 떠 있으면 백그라운드 기동, 끝나면 트리 종료 + 포트 확인.

- [ ] **Step 2: browse 스모크**

1. 미인증으로 `http://localhost:8000/admin` → **`/admin/gate`로 리다이렉트** 확인.
2. 틀린 게이트 비번 → 에러, 맞는 비번(`ADMIN_GATE_PASSWORD` 값) → **`/admin/login`**.
3. 틀린 로그인 → 일반화 에러, 시드한 이메일+비번 → **`/admin` 진입**, 글 목록 보임.
4. **로그아웃** → 다시 `/admin` → 게이트/로그인으로 막힘.
5. (방어) 로그아웃 상태에서 `POST /api/admin/blob-upload`(정상 경로 바디) →
   **401** 확인.

- [ ] **Step 3: 유닛/빌드**

```bash
pnpm run test:unit
```
node 종료 후:
```bash
pnpm build
```
Expected: 통과, build exit 0.

- [ ] **Step 4: 정리**

서버 트리 종료 후 포트 확인.

---

## Self-Review 결과

- **스펙 커버리지:** 세션 모듈=Task1, 액션·requireAdmin=Task2, proxy 가드=Task3,
  게이트/로그인 페이지=Task4, 서버 방어·로그아웃=Task5, 시드=Task6, E2E=Task7.
- **플레이스홀더:** 없음(모든 코드 완결).
- **엣지 안전:** proxy는 `lib/auth/session.ts`(jose·env만)만 import. `next/headers`
  ·bcrypt·DB는 Task2/5의 Node 모듈에만.
- **타입 일관성:** `verifyGate(token?)`/`verifySession(token?)`, `requireAdmin()`,
  `submitGate`/`login`/`logout`, 쿠키 상수 `GATE_COOKIE`/`SESSION_COOKIE` 일관.
- **주의:** `AUTH_SECRET`/`ADMIN_GATE_PASSWORD`는 런타임 필수. 미설정 시 `/admin`
  관련만 오류(공개 사이트 무영향). 프로덕션은 Vercel env에도 설정 필요(문서화).
