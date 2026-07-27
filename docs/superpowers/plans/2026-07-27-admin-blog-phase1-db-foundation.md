# 관리자 블로그 1단계: DB 기반 + 읽기 전환 + 글 이관 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 블로그 데이터 소스를 파일(mdx)에서 Neon Postgres(Drizzle)로 전환하고, 기존 2글을 DB로 이관해 공개 사이트·RSS·사이트맵이 DB에서 읽도록 만든다. (관리자 UI/인증/에디터는 2~4단계 별도 계획.)

**Architecture:** `lib/db/`에 Drizzle 클라이언트·스키마·리포지토리를 두고, 기존 `lib/posts.ts`의 공개 API(`getAllPosts`/`getPost` 등)를 파일 읽기에서 DB 조회로 교체한다. 소비자(블로그 페이지/RSS/사이트맵)는 시그니처가 그대로라 변경 없음. 모든 글 조회는 캐시 태그 `"posts"`로 감싸 ISR 무효화(2~4단계에서 사용)를 준비한다.

**Tech Stack:** drizzle-orm, drizzle-kit, @neondatabase/serverless, zod(기존), tsx(기존).

## Global Constraints

- 패키지 매니저는 **pnpm** 고정. `pnpm` / `pnpm exec` / `pnpm dlx`만 사용.
- 커밋 전 반드시 `pnpm exec tsc --noEmit`, `pnpm run lint`, (i18n 문자열 변경 시) `pnpm run check:i18n`, 그리고 `pnpm build`(exit 0) 통과.
- 커밋 메시지는 한국어. Co-Authored-By Claude 트레일러 금지.
- 커밋/푸시는 사용자가 명시적으로 요청할 때만.
- 모든 이미지는 next/image로만 렌더(raw `<img>`·CSS background-image 금지). 1단계는 기존 mdx-components 파이프라인을 그대로 유지하므로 자동 준수.
- 이 저장소는 커스터마이즈된 Next 16이다. 프레임워크 API(캐시 태깅 등)를 쓰기 전 `node_modules/next/dist/docs/`의 해당 문서를 확인한다.
- **선행 조건:** 이 단계의 `pnpm build`·이관 스크립트 실행은 Vercel Neon Postgres 생성 후 `.env.local`에 `DATABASE_URL`이 있어야 가능하다. 순수 로직 유닛 테스트(slug/입력 스키마)는 DB 없이 실행된다.

---

## File Structure

- Create `lib/db/schema.ts` — Drizzle 테이블 정의(`users`, `posts`).
- Create `lib/db/index.ts` — Neon 연결 + Drizzle 클라이언트(`db`).
- Create `lib/db/posts-repo.ts` — posts 테이블 조회/매핑(순수 데이터 접근).
- Create `lib/slug.ts` — slug 정규화·검증(순수 함수, 유닛 테스트).
- Create `drizzle.config.ts` — drizzle-kit 설정(마이그레이션 생성/적용).
- Create `scripts/migrate-posts.ts` — 기존 mdx 2글을 DB로 이관(일회성).
- Modify `lib/env.ts` — `DATABASE_URL` 추가(required).
- Modify `lib/posts.ts` — 파일 읽기 → DB 조회(공개 API 시그니처 유지) + 캐시 태그.
- Create `tests/unit/slug.test.ts` — slug 유닛 테스트.
- Modify `tests/unit/run.ts` — slug 테스트 등록.
- Delete `content/posts/*.ko.mdx` — 이관 후 파일 블로그 콘텐츠 제거(제품 mdx는 유지).

`Post`/`PostFrontmatter`/`PostCategory` 타입과 `getAllPosts`/`getPost`/`getAllPostSlugs`/`getAllTags`/`getAllCategories`/`getPostsByTag`/`getPostsByCategory`의 시그니처는 그대로 유지한다(소비자 무변경).

---

## Task 1: 의존성 설치 + Drizzle 설정

**Files:**
- Modify: `package.json`(의존성)
- Create: `drizzle.config.ts`
- Create: `lib/db/index.ts`

**Interfaces:**
- Produces: `db` (Drizzle 클라이언트, `lib/db/index.ts`에서 export). 스키마 타입은 Task 2에서 채워진다.

- [ ] **Step 1: 의존성 설치**

Run:
```bash
pnpm add drizzle-orm @neondatabase/serverless
pnpm add -D drizzle-kit
```
Expected: 3개 패키지가 `package.json`에 추가됨.

- [ ] **Step 2: drizzle-kit 설정 파일 작성**

Create `drizzle.config.ts`:
```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

- [ ] **Step 3: Drizzle 클라이언트 작성**

Create `lib/db/index.ts`:
```ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

> 참고: `drizzle-orm/neon-http`는 서버리스 HTTP 드라이버로 Vercel + Neon 조합에 적합. import가 실패하면 설치된 drizzle-orm 버전의 export 경로를 확인한다.

- [ ] **Step 4: 타입체크(스키마 미완성으로 실패 예상)**

Run: `pnpm exec tsc --noEmit`
Expected: `./schema` 모듈 없음 오류 → Task 2에서 해결.

- [ ] **Step 5: 커밋**

```bash
git add package.json pnpm-lock.yaml drizzle.config.ts lib/db/index.ts
git commit -m "DB(기반): drizzle-orm + neon 드라이버 설치 및 클라이언트 설정"
```

---

## Task 2: 스키마 정의 (`users`, `posts`)

**Files:**
- Create: `lib/db/schema.ts`

**Interfaces:**
- Produces: `users`, `posts` (Drizzle pgTable). `posts` 컬럼: `id, slug, title, summary, coverImage, category, tags, body, author, draft, publishedAt, source, sourceUrl, aiGenerated, createdAt, updatedAt`. `users` 컬럼: `id, email, passwordHash, name, role, createdAt`.

- [ ] **Step 1: 스키마 작성**

Create `lib/db/schema.ts`:
```ts
import {
  pgTable,
  uuid,
  text,
  boolean,
  date,
  timestamp,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("editor"), // "owner" | "editor"
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const posts = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  coverImage: text("cover_image").notNull(),
  category: text("category").notNull(), // "news" | "article" | "update"
  tags: text("tags").array().notNull().default([]),
  body: text("body").notNull(), // markdown
  author: text("author").notNull().default("H3"),
  draft: boolean("draft").notNull().default(true),
  publishedAt: date("published_at").notNull(),
  source: text("source"),
  sourceUrl: text("source_url"),
  aiGenerated: boolean("ai_generated").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
```

- [ ] **Step 2: 타입체크 통과 확인**

Run: `pnpm exec tsc --noEmit`
Expected: PASS (Task 1의 `./schema` 오류 해소).

- [ ] **Step 3: 마이그레이션 SQL 생성**

Run: `pnpm exec drizzle-kit generate`
Expected: `drizzle/` 폴더에 `0000_*.sql` 생성.

- [ ] **Step 4: 커밋**

```bash
git add lib/db/schema.ts drizzle
git commit -m "DB(스키마): users/posts 테이블 정의 및 마이그레이션 생성"
```

---

## Task 3: slug 유틸 + 유닛 테스트

**Files:**
- Create: `lib/slug.ts`
- Create: `tests/unit/slug.test.ts`
- Modify: `tests/unit/run.ts`

**Interfaces:**
- Produces: `isValidSlug(s: string): boolean`, `normalizeSlug(s: string): string` (`lib/slug.ts`).

- [ ] **Step 1: 실패하는 테스트 작성**

Create `tests/unit/slug.test.ts`:
```ts
import assert from "node:assert/strict";
import { isValidSlug, normalizeSlug } from "@/lib/slug";

// 유효한 kebab 슬러그
assert.equal(isValidSlug("gold-refining-pvc-pp"), true);
assert.equal(isValidSlug("post-123"), true);
// 무효
assert.equal(isValidSlug("Gold_Refining"), false); // 대문자/언더스코어
assert.equal(isValidSlug("한글"), false);
assert.equal(isValidSlug("-leading"), false);
assert.equal(isValidSlug("trailing-"), false);
assert.equal(isValidSlug(""), false);

// 정규화
assert.equal(normalizeSlug("  Gold Refining PVC "), "gold-refining-pvc");
assert.equal(normalizeSlug("PP__Tank!!"), "pp-tank");

console.log("slug.test passed.");
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm exec tsx tests/unit/slug.test.ts`
Expected: FAIL ("Cannot find module '@/lib/slug'").

- [ ] **Step 3: 구현 작성**

Create `lib/slug.ts`:
```ts
// URL 슬러그: 소문자 영숫자 + 하이픈, 앞뒤 하이픈 없음.
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSlug(s: string): boolean {
  return SLUG_RE.test(s);
}

// 임의 문자열 → 슬러그 후보(공백/특수문자 → 하이픈, 소문자화, 중복/양끝 하이픈 정리).
export function normalizeSlug(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm exec tsx tests/unit/slug.test.ts`
Expected: PASS ("slug.test passed.").

- [ ] **Step 5: 유닛 스위트에 등록**

Modify `tests/unit/run.ts` — import 목록에 추가:
```ts
import "./slug.test";
```
Run: `pnpm run test:unit`
Expected: PASS ("All unit tests passed.").

- [ ] **Step 6: 커밋**

```bash
git add lib/slug.ts tests/unit/slug.test.ts tests/unit/run.ts
git commit -m "블로그(slug): 슬러그 검증·정규화 유틸 + 유닛 테스트"
```

---

## Task 4: env에 DATABASE_URL 추가

**Files:**
- Modify: `lib/env.ts:3-22`

**Interfaces:**
- Produces: `env.DATABASE_URL: string`.

- [ ] **Step 1: 스키마에 필드 추가**

Modify `lib/env.ts` — `EnvSchema`에 `DATABASE_URL: z.string().min(1),` 추가, `parse({...})` 객체에 `DATABASE_URL: process.env.DATABASE_URL,` 추가.

결과 예시(발췌):
```ts
const EnvSchema = z.object({
  RESEND_API_KEY: z.string().min(1),
  CONTACT_TO_EMAIL: z.string().email(),
  CONTACT_FROM_EMAIL: z.string().email(),
  TURNSTILE_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
});
```
그리고 `parse` 인자에 `DATABASE_URL: process.env.DATABASE_URL,` 추가.

> 주의: 이 시점부터 `DATABASE_URL`이 없으면 빌드가 실패한다. `.env.local`에 값이 준비된 뒤 진행한다. `lib/db/index.ts`는 `env`를 import하지 않고 `process.env.DATABASE_URL`을 직접 읽으므로, slug/입력 스키마 등 순수 유닛 테스트는 이 변경과 무관하게 계속 통과한다.

- [ ] **Step 2: 타입체크**

Run: `pnpm exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: 커밋**

```bash
git add lib/env.ts
git commit -m "환경변수: DATABASE_URL 필수 추가"
```

---

## Task 5: posts 리포지토리 (DB 조회 계층)

**Files:**
- Create: `lib/db/posts-repo.ts`

**Interfaces:**
- Consumes: `db`(Task 1), `posts`(Task 2).
- Produces:
  - `type PostRow` — `posts` 테이블 select 결과 타입.
  - `rowToPost(row: PostRow, locale: Locale): Post` — DB 행 → 기존 `Post` 형태 매핑.
  - `queryAllPosts(includeDrafts: boolean): Promise<PostRow[]>` — 발행일 최신순.
  - `queryPostBySlug(slug: string): Promise<PostRow | null>`.

- [ ] **Step 1: 리포지토리 작성**

Create `lib/db/posts-repo.ts`:
```ts
import { desc, eq } from "drizzle-orm";
import { db } from "./index";
import { posts } from "./schema";
import type { Post, PostCategory } from "@/lib/posts";
import type { Locale } from "@/i18n/routing";

export type PostRow = typeof posts.$inferSelect;

// date 컬럼은 드라이버에서 "YYYY-MM-DD" 문자열로 반환된다. timestamp는 Date.
export function rowToPost(row: PostRow, locale: Locale): Post {
  return {
    title: row.title,
    summary: row.summary,
    coverImage: row.coverImage,
    category: row.category as PostCategory,
    tags: row.tags ?? [],
    publishedAt: String(row.publishedAt).slice(0, 10),
    updatedAt: row.updatedAt
      ? row.updatedAt.toISOString().slice(0, 10)
      : undefined,
    author: row.author,
    draft: row.draft,
    source: row.source ?? undefined,
    sourceUrl: row.sourceUrl ?? undefined,
    aiGenerated: row.aiGenerated,
    slug: row.slug,
    locale,
    body: row.body,
  };
}

export async function queryAllPosts(
  includeDrafts: boolean
): Promise<PostRow[]> {
  const rows = await db.select().from(posts).orderBy(desc(posts.publishedAt));
  return includeDrafts ? rows : rows.filter((r) => !r.draft);
}

export async function queryPostBySlug(slug: string): Promise<PostRow | null> {
  const rows = await db.select().from(posts).where(eq(posts.slug, slug));
  return rows[0] ?? null;
}
```

- [ ] **Step 2: 타입체크**

Run: `pnpm exec tsc --noEmit`
Expected: PASS. (실패 시 `Post` 필드와 매핑을 대조.)

- [ ] **Step 3: 커밋**

```bash
git add lib/db/posts-repo.ts
git commit -m "DB(posts): 조회 리포지토리 + 행→Post 매핑"
```

---

## Task 6: `lib/posts.ts`를 DB 조회로 교체 (+ 캐시 태그)

**Files:**
- Modify: `lib/posts.ts`(전체 재작성 — 공개 API 시그니처·타입 유지)

**Interfaces:**
- Consumes: `queryAllPosts`/`queryPostBySlug`/`rowToPost`(Task 5).
- Produces(변경 없음, 시그니처 유지): `Post`, `PostFrontmatter`, `PostCategory`, `getAllPosts(locale)`, `getPost(slug, locale)`, `getAllPostSlugs()`, `getAllTags(locale)`, `getAllCategories(locale)`, `getPostsByTag(tag, locale)`, `getPostsByCategory(category, locale)`.

- [ ] **Step 1: Next 16 캐시 태그 API 확인**

`node_modules/next/dist/`에서 `unstable_cache`(from `next/cache`) 사용 가능 여부와 `'use cache'`/`cacheTag` 지원을 확인한다.
Run: `pnpm exec node -e "const c=require('next/cache'); console.log(Object.keys(c))"`
Expected: 출력에 `unstable_cache`, `revalidateTag` 포함 여부 확인. 포함되면 아래 `unstable_cache` 방식을 사용, 없고 `'use cache'`만 있으면 그 지시자+`cacheTag('posts')`로 대체한다.

- [ ] **Step 2: 재작성**

Rewrite `lib/posts.ts`:
```ts
import { z } from "zod";
import { unstable_cache } from "next/cache";
import type { Locale } from "@/i18n/routing";
import { queryAllPosts, queryPostBySlug, rowToPost } from "@/lib/db/posts-repo";

// 기존 프론트매터 스키마/타입은 입력 검증·타입 호환을 위해 유지.
const DateString = z.preprocess(
  (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v),
  z.string().min(1)
);

const PostFrontmatterSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  coverImage: z.string().min(1),
  category: z.enum(["news", "article", "update"]),
  tags: z.array(z.string()).default([]),
  publishedAt: DateString,
  updatedAt: DateString.optional(),
  author: z.string().default("H3"),
  draft: z.boolean().default(false),
  source: z.string().optional(),
  sourceUrl: z.string().optional(),
  aiGenerated: z.boolean().default(false),
});

export type PostFrontmatter = z.infer<typeof PostFrontmatterSchema>;
export type PostCategory = PostFrontmatter["category"];

export type Post = PostFrontmatter & {
  slug: string;
  locale: Locale;
  body: string;
};

const isProd = process.env.NODE_ENV === "production";

// 모든 글 조회를 캐시 태그 "posts"로 감싼다. 관리자 쓰기(2~4단계)에서
// revalidateTag("posts")로 목록/상세/RSS/사이트맵을 일괄 무효화한다.
const loadPosts = unstable_cache(
  async (includeDrafts: boolean) => queryAllPosts(includeDrafts),
  ["posts-all"],
  { tags: ["posts"] }
);

export async function getAllPosts(locale: Locale): Promise<Post[]> {
  const rows = await loadPosts(!isProd);
  return rows.map((r) => rowToPost(r, locale));
}

export async function getPost(slug: string, locale: Locale): Promise<Post> {
  const row = await queryPostBySlug(slug);
  if (!row) throw new Error(`Post not found: ${slug}`);
  return rowToPost(row, locale);
}

export async function getAllPostSlugs(): Promise<string[]> {
  const rows = await loadPosts(true);
  return [...new Set(rows.map((r) => r.slug))];
}

export async function getAllTags(locale: Locale): Promise<string[]> {
  const posts = await getAllPosts(locale);
  return [...new Set(posts.flatMap((p) => p.tags))];
}

export async function getAllCategories(
  locale: Locale
): Promise<PostCategory[]> {
  const posts = await getAllPosts(locale);
  return [...new Set(posts.map((p) => p.category))];
}

export async function getPostsByTag(
  tag: string,
  locale: Locale
): Promise<Post[]> {
  return (await getAllPosts(locale)).filter((p) => p.tags.includes(tag));
}

export async function getPostsByCategory(
  category: string,
  locale: Locale
): Promise<Post[]> {
  return (await getAllPosts(locale)).filter((p) => p.category === category);
}
```

> 동작 차이 주의: 기존 `getPost`는 실패 시 기본 로케일 파일로 폴백했지만, DB는 로케일별 콘텐츠가 없으므로(한국어 전용) slug로만 조회하고 없으면 throw한다. 블로그 상세 페이지는 이미 `try/catch → notFound()`로 감싸고 있어 동작 동일.

- [ ] **Step 3: 타입체크 + 린트**

Run: `pnpm exec tsc --noEmit && pnpm run lint`
Expected: PASS. 소비자(블로그 페이지/RSS/sitemap)는 시그니처가 같아 수정 불필요.

- [ ] **Step 4: 커밋**

```bash
git add lib/posts.ts
git commit -m "블로그(읽기): lib/posts를 DB 조회로 전환하고 posts 캐시 태그 적용"
```

---

## Task 7: 스키마 적용 + 기존 글 이관 스크립트

**Files:**
- Create: `scripts/migrate-posts.ts`
- Modify: `package.json`(scripts에 이관 명령 추가)

**Interfaces:**
- Consumes: `db`(Task 1), `posts`(Task 2), 기존 `content/posts/*.ko.mdx` 파일.

- [ ] **Step 1: 스키마를 실제 DB에 적용**

`.env.local`에 `DATABASE_URL`이 있는 상태에서:
Run: `pnpm exec drizzle-kit push`
Expected: `users`, `posts` 테이블이 Neon에 생성됨.

- [ ] **Step 2: 이관 스크립트 작성**

Create `scripts/migrate-posts.ts`:
```ts
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";

const DIR = path.join(process.cwd(), "content", "posts");

function toDateString(v: unknown): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).slice(0, 10);
}

async function main() {
  const files = (await fs.readdir(DIR)).filter((f) => f.endsWith(".ko.mdx"));
  for (const file of files) {
    const slug = file.replace(/\.ko\.mdx$/, "");
    const raw = await fs.readFile(path.join(DIR, file), "utf8");
    const { data, content } = matter(raw);
    await db
      .insert(posts)
      .values({
        slug,
        title: data.title,
        summary: data.summary,
        coverImage: data.coverImage,
        category: data.category,
        tags: data.tags ?? [],
        body: content,
        author: data.author ?? "H3",
        draft: data.draft ?? false,
        publishedAt: toDateString(data.publishedAt),
        source: data.source ?? null,
        sourceUrl: data.sourceUrl ?? null,
        aiGenerated: data.aiGenerated ?? false,
      })
      .onConflictDoNothing({ target: posts.slug });
    console.log(`이관: ${slug}`);
  }
  console.log("완료");
}

main().then(() => process.exit(0));
```

- [ ] **Step 3: package.json에 명령 추가**

Modify `package.json` scripts:
```json
"migrate:posts": "node --env-file=.env.local --import tsx scripts/migrate-posts.ts"
```

- [ ] **Step 4: 이관 실행**

Run: `pnpm run migrate:posts`
Expected: "이관: gold-refining-pvc-pp-fumehood-scrubber-duct", "이관: pp-tank-fabrication-welding", "완료" 출력.
(참고: 두 글 모두 이미 `draft: false`.)

- [ ] **Step 5: 커밋**

```bash
git add scripts/migrate-posts.ts package.json
git commit -m "이관: 기존 블로그 mdx 2글을 DB로 옮기는 스크립트 추가"
```

---

## Task 8: 파일 블로그 콘텐츠 제거 + 전체 검증

**Files:**
- Delete: `content/posts/gold-refining-pvc-pp-fumehood-scrubber-duct.ko.mdx`
- Delete: `content/posts/pp-tank-fabrication-welding.ko.mdx`

**Interfaces:** 없음(정리·검증 단계).

- [ ] **Step 1: 이관 확인 후 mdx 파일 삭제**

DB에 두 글이 들어간 것을 확인한 뒤:
Run:
```bash
git rm content/posts/gold-refining-pvc-pp-fumehood-scrubber-duct.ko.mdx content/posts/pp-tank-fabrication-welding.ko.mdx
```
> `content/products/*.mdx`(제품)는 건드리지 않는다. `lib/mdx.ts`(제품 로더)도 그대로 둔다.

- [ ] **Step 2: 잔여 참조 점검**

Run: `pnpm exec grep -rn "content/posts" lib app scripts 2>/dev/null || true`
Expected: `lib/posts.ts`에 파일 경로 참조가 없어야 함(Task 6에서 제거). `scripts/migrate-posts.ts`의 참조만 남아 있으면 정상.

- [ ] **Step 3: 전체 게이트**

Run:
```bash
pnpm exec tsc --noEmit
pnpm run lint
pnpm run test:unit
pnpm run check:i18n
pnpm build
```
Expected: 모두 exit 0. (`pnpm build`는 `DATABASE_URL`이 `.env.local`에 있어야 하며, 빌드 시 DB에서 글을 읽어 정적 페이지를 생성한다.)

- [ ] **Step 4: 브라우저 확인**

Run: `pnpm dev` 후 확인(확인 뒤 dev 서버 종료):
- `/blog` — 두 글이 목록에 보임
- `/blog/gold-refining-pvc-pp-fumehood-scrubber-duct` — 본문·표·이미지 정상(next/image)
- `/en/blog` — 동일 글이 한국어 내용으로 보임
- `/rss.xml` — 두 글이 `<item>`으로 포함
- `/sitemap.xml` — 블로그 URL 포함

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "블로그(정리): DB 이관 완료 후 파일 mdx 블로그 콘텐츠 제거"
```

---

## Self-Review

**Spec coverage (1단계 범위):**
- DB/ORM 도입 → Task 1,2 ✅
- 데이터 모델(users/posts) → Task 2 ✅ (users는 2~4단계에서 사용; 스키마는 여기서 생성)
- 읽기 경로 DB 전환(서버 컴포넌트 직접 조회) → Task 5,6 ✅
- ISR 캐시 태그 `"posts"` → Task 6 ✅
- 기존 2글 이관 + 파일 제거 → Task 7,8 ✅
- RSS/사이트맵 무변경 동작 → Task 6(시그니처 유지) + Task 8 검증 ✅
- 2~4단계(인증/게이트/에디터/계정관리)는 범위 밖(아래 후속 계획).

**Placeholder scan:** 모든 코드 단계에 실제 코드 포함. Next 캐시 API만 Task 6 Step 1에서 확인 단계로 명시(커스텀 Next 16 대응) — 플레이스홀더 아님.

**Type consistency:** `rowToPost`가 반환하는 `Post` 필드가 Task 6의 `Post` 타입과 일치(`source/sourceUrl` optional, `aiGenerated` boolean, `updatedAt` optional). `queryAllPosts(includeDrafts)`/`queryPostBySlug(slug)` 시그니처가 Task 6 사용처와 일치.

---

## 후속 단계 (각각 별도 계획으로 상세화)

1단계 배포·검증 후 아래를 순서대로 계획화한다. 각 단계는 독립적으로 배포 가능.

- **2단계 — 인증 + 게이트 + 관리자 셸:** `proxy.ts` Basic Auth 게이트 조합, Auth.js(JWT)+bcrypt, `scripts/seed-admin.ts`(최초 owner), `/admin/login`, `app/admin/layout.tsx` 가드, `/admin` 대시보드(글 목록 읽기 전용). env: `AUTH_SECRET`, `ADMIN_GATE_PASSWORD`(+`ADMIN_GATE_USER`).
- **3단계 — 글 작성(CRUD + Tiptap + 이미지 업로드):** `actions/admin/posts.ts`(create/update/delete + zod + slug 중복검사 + `revalidateTag("posts")`), Tiptap 위지윅(마크다운 직렬화), `/api/admin/upload` → Vercel Blob. env: `BLOB_READ_WRITE_TOKEN`.
  - **리스크(반드시 해결):** `rehypeImageDimensions`는 `/`로 시작하는 public 이미지만 치수를 읽는다. Blob 절대 URL 이미지는 치수를 못 얻어 raw `<img>`로 떨어져 next/image 규칙 위반 + CLS 발생. → 업로드 시 이미지 치수를 함께 확보(예: `sharp`)하고, 렌더 파이프라인이 원격/Blob 이미지의 치수를 반영하도록 확장한다(플러그인 원격 fetch 또는 업로드 메타 저장).
- **4단계 — 계정 관리:** `/admin/users`(목록/추가/삭제), `owner` 전용 가드, `actions/admin/users.ts`.
