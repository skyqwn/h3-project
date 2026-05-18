# Blog / News Infrastructure (SP1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a file-based, SEO-maximized blog/news section (`/blog`) that mirrors the existing product MDX pattern — KO required / EN optional posts, category + tags, paginated main list, tag/category archives, Article+Breadcrumb JSON-LD, per-post dynamic OG, dual-locale RSS, sitemap extension — with no backend (git is the store).

**Architecture:** A separate `lib/posts.ts` loader (zod-validated frontmatter, parallel to `lib/mdx.ts`) feeds SSG routes under `app/[locale]/blog/`. SEO helpers extend `lib/seo.ts`; sitemap extends `app/sitemap.ts`; RSS is a Route Handler. Post bodies render via `next-mdx-remote/rsc` reusing `mdx-components.tsx`. Everything is prerendered at build; no DB/server.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, pnpm, zod, gray-matter, next-mdx-remote/rsc, next-intl, next/og, tsx unit runner.

**Sources of truth:**
- Spec: `/docs/superpowers/specs/2026-05-18-blog-news-infra-design.md`
- Patterns to mirror EXACTLY: `lib/mdx.ts`, `tests/unit/mdx.test.ts`, `tests/unit/run.ts`, `app/[locale]/products/page.tsx`, `app/[locale]/products/[slug]/page.tsx`, `app/[locale]/products/[slug]/opengraph-image.tsx`, `mdx-components.tsx`, `lib/seo.ts`, `app/sitemap.ts`, `messages/{ko,en}.json`

**Project rules (from AGENTS.md — do not relearn):** pnpm only; bilingual UI strings go in BOTH `messages/{ko,en}.json` via next-intl and `pnpm run check:i18n` must pass; Tailwind v4 — never define `--spacing-{xs,sm,md,lg,xl}`, use numeric scale; `pnpm exec tsc --noEmit` + `pnpm run lint` (React-compiler rules ON — no sync setState in effects) before each commit; this machine OOMs — no parallel dev servers, verify via tsx/build not long-running servers.

---

## File Structure

| File | Responsibility |
|---|---|
| `lib/posts.ts` (new) | Post loader: zod frontmatter, getAllPosts/getPost/slugs/tags/categories/byTag/byCategory |
| `content/posts/sample-post.ko.mdx` (new) | Fixture: KO sample post |
| `content/posts/sample-post.en.mdx` (new) | Fixture: EN sample post |
| `tests/unit/posts.test.ts` (new) | Unit suite for `lib/posts.ts` |
| `tests/unit/run.ts` (modify) | Import `./posts.test` |
| `messages/ko.json` / `messages/en.json` (modify) | `blog.*` UI strings (parity) |
| `lib/seo.ts` (modify) | Add `articleJsonLd()`; extend `pageMetadata` for `og:type=article` |
| `lib/blog-pagination.ts` (new) | Pure pagination helper (page slicing + page count) |
| `app/[locale]/blog/page.tsx` (new) | Main list, page 1 (10/page) |
| `app/[locale]/blog/page/[page]/page.tsx` (new) | Main list, page ≥ 2 |
| `app/[locale]/blog/[slug]/page.tsx` (new) | Post detail (MDXRemote) + JSON-LD |
| `app/[locale]/blog/[slug]/opengraph-image.tsx` (new) | Per-post dynamic OG |
| `app/[locale]/blog/tag/[tag]/page.tsx` (new) | Tag archive (single page, all matches) |
| `app/[locale]/blog/category/[category]/page.tsx` (new) | Category archive (single page) |
| `components/blog/PostCard.tsx` (new) | Shared post card (used by list/archives) |
| `components/blog/PostGrid.tsx` (new) | Shared grid + empty state |
| `app/sitemap.ts` (modify) | Add post / archive / pagination URLs |
| `app/rss.xml/route.ts` (new) | KO RSS 2.0 feed |
| `app/en/rss.xml/route.ts` (new) | EN RSS 2.0 feed |

---

## Task 1: Post loader (TDD)

**Files:**
- Create: `lib/posts.ts`
- Create: `content/posts/sample-post.ko.mdx`, `content/posts/sample-post.en.mdx`
- Create: `tests/unit/posts.test.ts`
- Modify: `tests/unit/run.ts`

- [ ] **Step 1: Create the two fixtures**

`content/posts/sample-post.ko.mdx`:

```mdx
---
title: 샘플 글
summary: 블로그 인프라 검증용 임시 글입니다.
coverImage: /blog/sample-post/cover.jpg
category: article
tags: [공지, 기술]
publishedAt: 2026-05-18
author: H3
draft: false
---

# 샘플 글

이것은 자리표시자 콘텐츠입니다. 실제 글로 교체하세요.

## 소제목

- 항목 하나
- 항목 둘
```

`content/posts/sample-post.en.mdx`:

```mdx
---
title: Sample Post
summary: Placeholder post for blog infrastructure verification.
coverImage: /blog/sample-post/cover.jpg
category: article
tags: [notice, tech]
publishedAt: 2026-05-18
author: H3
draft: false
---

# Sample Post

Placeholder content. Replace with a real post.

## Subheading

- Item one
- Item two
```

- [ ] **Step 2: Write the failing test**

Create `tests/unit/posts.test.ts`:

```ts
import assert from "node:assert/strict";
import {
  getAllPosts,
  getPost,
  getAllPostSlugs,
  getAllTags,
  getAllCategories,
  getPostsByTag,
  getPostsByCategory,
} from "../../lib/posts";

(async () => {
  const ko = await getAllPosts("ko");
  assert.ok(ko.length >= 1, "expected >=1 KO post");
  assert.equal(ko[0]?.slug, "sample-post");
  assert.equal(ko[0]?.category, "article");
  assert.ok(Array.isArray(ko[0]?.tags));
  // sorted by publishedAt desc: add a check that ordering is non-increasing
  for (let i = 1; i < ko.length; i++) {
    assert.ok(
      ko[i - 1]!.publishedAt >= ko[i]!.publishedAt,
      "posts must be sorted by publishedAt desc"
    );
  }

  const en = await getAllPosts("en");
  assert.ok(en.some((p) => p.slug === "sample-post"), "EN sample present");

  const slugs = await getAllPostSlugs();
  assert.ok(slugs.includes("sample-post"));
  assert.equal(new Set(slugs).size, slugs.length, "slugs unique");

  const one = await getPost("sample-post", "ko");
  assert.equal(one.slug, "sample-post");
  assert.ok(one.body.length > 0);

  const tags = await getAllTags("ko");
  assert.ok(tags.includes("공지") && tags.includes("기술"));

  const cats = await getAllCategories("ko");
  assert.ok(cats.includes("article"));

  const byTag = await getPostsByTag("기술", "ko");
  assert.ok(byTag.some((p) => p.slug === "sample-post"));

  const byCat = await getPostsByCategory("article", "ko");
  assert.ok(byCat.some((p) => p.slug === "sample-post"));

  // missing post throws
  let threw = false;
  try {
    await getPost("does-not-exist", "ko");
  } catch {
    threw = true;
  }
  assert.equal(threw, true, "getPost on missing slug must throw");

  console.log("posts.test: 12 assertions passed.");
})().catch((err) => {
  console.error("posts.test FAILED:", err);
  process.exit(1);
});
```

- [ ] **Step 3: Wire into the runner**

Edit `tests/unit/run.ts` — add the import (keep existing lines):

```ts
import "./mdx.test";
import "./turnstile.test";
import "./notify.test";
import "./posts.test";

console.log("All unit tests passed.");
```

- [ ] **Step 4: Run, verify it fails**

Run: `pnpm run test:unit`
Expected: FAIL — `Cannot find module '../../lib/posts'`.

- [ ] **Step 5: Implement `lib/posts.ts`**

```ts
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import type { Locale } from "@/i18n/routing";

const PostFrontmatterSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  coverImage: z.string().min(1),
  category: z.enum(["news", "article", "update"]),
  tags: z.array(z.string()).default([]),
  publishedAt: z.string().min(1),
  updatedAt: z.string().optional(),
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

const CONTENT_DIR = path.join(process.cwd(), "content", "posts");

async function readContentDir(): Promise<string[]> {
  try {
    return await fs.readdir(CONTENT_DIR);
  } catch {
    return [];
  }
}

function parseFilename(
  filename: string
): { slug: string; locale: Locale } | null {
  const m = filename.match(/^(.+)\.(ko|en)\.mdx$/);
  if (!m) return null;
  return { slug: m[1]!, locale: m[2] as Locale };
}

async function loadFile(slug: string, locale: Locale): Promise<Post> {
  const raw = await fs.readFile(
    path.join(CONTENT_DIR, `${slug}.${locale}.mdx`),
    "utf8"
  );
  const { data, content } = matter(raw);
  const fm = PostFrontmatterSchema.parse(data);
  return { ...fm, slug, locale, body: content };
}

export async function getAllPosts(locale: Locale): Promise<Post[]> {
  const files = await readContentDir();
  const posts: Post[] = [];
  for (const file of files) {
    const parsed = parseFilename(file);
    if (!parsed || parsed.locale !== locale) continue;
    const post = await loadFile(parsed.slug, parsed.locale);
    if (post.draft && process.env.NODE_ENV === "production") continue;
    posts.push(post);
  }
  // publishedAt is ISO (YYYY-MM-DD…) so string compare = chronological
  return posts.sort((a, b) =>
    a.publishedAt < b.publishedAt ? 1 : a.publishedAt > b.publishedAt ? -1 : 0
  );
}

export async function getPost(slug: string, locale: Locale): Promise<Post> {
  return loadFile(slug, locale);
}

export async function getAllPostSlugs(): Promise<string[]> {
  const files = await readContentDir();
  const slugs = new Set<string>();
  for (const f of files) {
    const parsed = parseFilename(f);
    if (parsed) slugs.add(parsed.slug);
  }
  return [...slugs];
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

- [ ] **Step 6: Run, verify it passes**

Run: `pnpm run test:unit`
Expected: PASS — output includes `posts.test: 12 assertions passed.` and `All unit tests passed.`

- [ ] **Step 7: Commit**

```bash
git add lib/posts.ts content/posts tests/unit/posts.test.ts tests/unit/run.ts
git commit -m "feat: blog post MDX loader with zod frontmatter (TDD)"
```

---

## Task 2: Pagination helper (TDD)

**Files:**
- Create: `lib/blog-pagination.ts`
- Modify: `tests/unit/posts.test.ts` (append pagination cases)

- [ ] **Step 1: Append failing tests**

In `tests/unit/posts.test.ts`, change the final two lines of the IIFE from:

```ts
  console.log("posts.test: 12 assertions passed.");
})().catch((err) => {
```

to:

```ts
  const { paginate, PAGE_SIZE } = await import("../../lib/blog-pagination");
  assert.equal(PAGE_SIZE, 10);
  const items = Array.from({ length: 23 }, (_, i) => i);
  const p1 = paginate(items, 1);
  assert.equal(p1.items.length, 10);
  assert.equal(p1.totalPages, 3);
  assert.equal(p1.page, 1);
  const p3 = paginate(items, 3);
  assert.equal(p3.items.length, 3);
  const empty = paginate([], 1);
  assert.equal(empty.totalPages, 1);
  assert.equal(empty.items.length, 0);
  let oob = false;
  try {
    paginate(items, 4);
  } catch {
    oob = true;
  }
  assert.equal(oob, true, "out-of-range page must throw");

  console.log("posts.test: 19 assertions passed.");
})().catch((err) => {
```

- [ ] **Step 2: Run, verify it fails**

Run: `pnpm run test:unit`
Expected: FAIL — `Cannot find module '../../lib/blog-pagination'`.

- [ ] **Step 3: Implement `lib/blog-pagination.ts`**

```ts
export const PAGE_SIZE = 10;

export type Paginated<T> = {
  items: T[];
  page: number;
  totalPages: number;
};

/** 1-indexed pagination. Throws on out-of-range page (caller -> notFound()). */
export function paginate<T>(all: T[], page: number): Paginated<T> {
  const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  if (page < 1 || page > totalPages) {
    throw new Error(`page ${page} out of range (1..${totalPages})`);
  }
  const start = (page - 1) * PAGE_SIZE;
  return {
    items: all.slice(start, start + PAGE_SIZE),
    page,
    totalPages,
  };
}
```

- [ ] **Step 4: Run, verify it passes**

Run: `pnpm run test:unit`
Expected: PASS — `posts.test: 19 assertions passed.`

- [ ] **Step 5: Commit**

```bash
git add lib/blog-pagination.ts tests/unit/posts.test.ts
git commit -m "feat: pure pagination helper for blog list (TDD)"
```

---

## Task 3: i18n blog strings

**Files:**
- Modify: `messages/ko.json`, `messages/en.json`

- [ ] **Step 1: Add the `blog` block to `messages/ko.json`**

Insert a `"blog"` key as a sibling of the existing top-level keys (e.g. after `"about"`). Exact JSON to add:

```json
  "blog": {
    "title": "블로그",
    "subtitle": "H3의 소식과 이야기",
    "readMore": "더 읽기",
    "publishedOn": "발행일",
    "empty": "아직 글이 없습니다.",
    "prev": "이전",
    "next": "다음",
    "pageLabel": "페이지",
    "tagLabel": "태그",
    "categoryLabel": "카테고리",
    "category": {
      "news": "뉴스",
      "article": "아티클",
      "update": "업데이트"
    }
  },
```

- [ ] **Step 2: Add the matching block to `messages/en.json`** (same key tree)

```json
  "blog": {
    "title": "Blog",
    "subtitle": "News and stories from H3",
    "readMore": "Read more",
    "publishedOn": "Published",
    "empty": "No posts yet.",
    "prev": "Previous",
    "next": "Next",
    "pageLabel": "Page",
    "tagLabel": "Tag",
    "categoryLabel": "Category",
    "category": {
      "news": "News",
      "article": "Article",
      "update": "Update"
    }
  },
```

- [ ] **Step 3: Verify parity**

Run: `pnpm run check:i18n`
Expected: `i18n parity OK — <N> keys in sync.` (N increased by the new keys, no mismatch).

- [ ] **Step 4: Commit**

```bash
git add messages/ko.json messages/en.json
git commit -m "feat: blog UI strings (ko/en parity)"
```

---

## Task 4: SEO helpers — articleJsonLd + article OG type

**Files:**
- Modify: `lib/seo.ts`

- [ ] **Step 1: Add `articleJsonLd` to `lib/seo.ts`**

Append this export near the existing `productJsonLd` / `breadcrumbJsonLd`
exports (same file, same style — `SITE` is the resolved origin already
defined at the top of `lib/seo.ts`):

```ts
export function articleJsonLd(p: {
  title: string;
  summary: string;
  slug: string;
  locale: Locale;
  image: string;
  publishedAt: string;
  updatedAt?: string;
  author: string;
}) {
  const path = `/blog/${p.slug}`;
  const url = p.locale === "ko" ? `${SITE}${path}` : `${SITE}/en${path}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: p.title,
    description: p.summary,
    image: p.image.startsWith("http") ? p.image : `${SITE}${p.image}`,
    datePublished: p.publishedAt,
    dateModified: p.updatedAt ?? p.publishedAt,
    author: { "@type": "Organization", name: p.author },
    publisher: { "@type": "Organization", name: BRAND },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
  };
}
```

(`BRAND` and `SITE` are already defined at the top of `lib/seo.ts`; `Locale`
is already imported there.)

- [ ] **Step 2: Add an optional `articleMeta` param to `pageMetadata`**

In `lib/seo.ts`, the `pageMetadata` function signature currently is:

```ts
export function pageMetadata({
  locale,
  path,
  title,
  description,
  image,
  noindex = false,
}: PageMetaArgs): Metadata {
```

Add an optional article block. Change the `PageMetaArgs` type to include:

```ts
  article?: {
    publishedTime: string;
    modifiedTime?: string;
    authors?: string[];
  };
```

and inside `pageMetadata`, where `openGraph` is built, set the type
conditionally — replace the `openGraph: { type: "website", ... }` object so
that when `args.article` is present it uses:

```ts
    openGraph: {
      type: args.article ? "article" : "website",
      siteName: BRAND,
      title: fullTitle,
      description,
      url: ownUrl,
      locale: locale === "ko" ? "ko_KR" : "en_US",
      alternateLocale: locale === "ko" ? ["en_US"] : ["ko_KR"],
      images: image ? [{ url: image, width: 1200, height: 630 }] : undefined,
      ...(args.article
        ? {
            publishedTime: args.article.publishedTime,
            modifiedTime:
              args.article.modifiedTime ?? args.article.publishedTime,
            authors: args.article.authors,
          }
        : {}),
    },
```

(Keep every other field of `pageMetadata` exactly as it is.)

- [ ] **Step 3: Verify types**

Run: `pnpm exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add lib/seo.ts
git commit -m "feat: articleJsonLd + article OG type in lib/seo.ts"
```

---

## Task 5: Shared post card + grid components

**Files:**
- Create: `components/blog/PostCard.tsx`, `components/blog/PostGrid.tsx`

- [ ] **Step 1: Create `components/blog/PostCard.tsx`**

```tsx
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import type { Post } from "@/lib/posts";

export function PostCard({ post }: { post: Post }) {
  const t = useTranslations("blog");
  return (
    <Link href={`/blog/${post.slug}`} className="block group">
      <div
        className="aspect-[16/10] rounded-md bg-surface-card bg-cover bg-center overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, #f6f6f3 0%, #dadad3 100%), url(${post.coverImage})`,
        }}
        aria-hidden
      />
      <p className="text-caption-md uppercase tracking-wider text-mute mt-3">
        {t(`category.${post.category}`)} · {post.publishedAt}
      </p>
      <h2 className="text-heading-md text-ink mt-1 group-hover:text-primary transition-colors">
        {post.title}
      </h2>
      <p className="text-body-sm text-mute mt-1">{post.summary}</p>
    </Link>
  );
}
```

- [ ] **Step 2: Create `components/blog/PostGrid.tsx`**

```tsx
import { useTranslations } from "next-intl";
import type { Post } from "@/lib/posts";
import { PostCard } from "./PostCard";

export function PostGrid({ posts }: { posts: Post[] }) {
  const t = useTranslations("blog");
  if (posts.length === 0) {
    return <p className="text-body-md text-mute">{t("empty")}</p>;
  }
  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((p) => (
        <li key={p.slug}>
          <PostCard post={p} />
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 3: Verify types + lint**

Run: `pnpm exec tsc --noEmit && pnpm run lint`
Expected: both exit 0.

- [ ] **Step 4: Commit**

```bash
git add components/blog
git commit -m "feat: shared PostCard + PostGrid blog components"
```

---

## Task 6: Blog list + pagination pages

**Files:**
- Create: `app/[locale]/blog/page.tsx`
- Create: `app/[locale]/blog/page/[page]/page.tsx`

- [ ] **Step 1: Create `app/[locale]/blog/page.tsx`**

```tsx
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { getAllPosts } from "@/lib/posts";
import { paginate } from "@/lib/blog-pagination";
import { pageMetadata } from "@/lib/seo";
import { DisplayHeading } from "@/components/primitives/DisplayHeading";
import { PostGrid } from "@/components/blog/PostGrid";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  return pageMetadata({
    locale: locale as Locale,
    path: "/blog",
    title: t("title"),
    description: t("subtitle"),
  });
}

export default async function BlogListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("blog");
  const all = await getAllPosts(locale as Locale);
  const { items, totalPages } = paginate(all, 1);

  return (
    <div className="min-h-screen bg-canvas py-section">
      <div className="max-w-page mx-auto px-6">
        <p className="text-caption-md uppercase tracking-wider text-mute mb-3">
          {t("subtitle")}
        </p>
        <DisplayHeading level="lg" className="mb-12">
          {t("title")}
        </DisplayHeading>
        <PostGrid posts={items} />
        {totalPages > 1 && (
          <nav className="mt-12 flex justify-center">
            <Link
              href="/blog/page/2"
              className="text-body-strong text-ink hover:text-primary transition-colors"
            >
              {t("next")} →
            </Link>
          </nav>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `app/[locale]/blog/page/[page]/page.tsx`**

```tsx
import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { getAllPosts } from "@/lib/posts";
import { paginate, PAGE_SIZE } from "@/lib/blog-pagination";
import { pageMetadata } from "@/lib/seo";
import { DisplayHeading } from "@/components/primitives/DisplayHeading";
import { PostGrid } from "@/components/blog/PostGrid";
import { routing, type Locale } from "@/i18n/routing";

export async function generateStaticParams() {
  const params: { locale: string; page: string }[] = [];
  for (const locale of routing.locales) {
    const all = await getAllPosts(locale);
    const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
    for (let p = 2; p <= totalPages; p++) {
      params.push({ locale, page: String(p) });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; page: string }>;
}): Promise<Metadata> {
  const { locale, page } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  return pageMetadata({
    locale: locale as Locale,
    path: `/blog/page/${page}`,
    title: `${t("title")} — ${t("pageLabel")} ${page}`,
    description: t("subtitle"),
  });
}

export default async function BlogPaginatedPage({
  params,
}: {
  params: Promise<{ locale: string; page: string }>;
}) {
  const { locale, page } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("blog");
  const pageNum = Number(page);
  if (!Number.isInteger(pageNum) || pageNum < 2) notFound();

  const all = await getAllPosts(locale as Locale);
  let result;
  try {
    result = paginate(all, pageNum);
  } catch {
    notFound();
  }

  return (
    <div className="min-h-screen bg-canvas py-section">
      <div className="max-w-page mx-auto px-6">
        <DisplayHeading level="lg" className="mb-12">
          {t("title")} — {t("pageLabel")} {pageNum}
        </DisplayHeading>
        <PostGrid posts={result.items} />
        <nav className="mt-12 flex justify-center gap-6">
          <Link
            href={pageNum === 2 ? "/blog" : `/blog/page/${pageNum - 1}`}
            className="text-body-strong text-ink hover:text-primary transition-colors"
          >
            ← {t("prev")}
          </Link>
          {pageNum < result.totalPages && (
            <Link
              href={`/blog/page/${pageNum + 1}`}
              className="text-body-strong text-ink hover:text-primary transition-colors"
            >
              {t("next")} →
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify types + lint**

Run: `pnpm exec tsc --noEmit && pnpm run lint`
Expected: both exit 0.

- [ ] **Step 4: Commit**

```bash
git add "app/[locale]/blog/page.tsx" "app/[locale]/blog/page"
git commit -m "feat: blog list + path-based pagination pages"
```

---

## Task 7: Post detail page + JSON-LD

**Files:**
- Create: `app/[locale]/blog/[slug]/page.tsx`

- [ ] **Step 1: Create the detail page**

```tsx
import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import type { Metadata } from "next";
import { getAllPostSlugs, getPost } from "@/lib/posts";
import { mdxComponents } from "@/mdx-components";
import {
  pageMetadata,
  articleJsonLd,
  breadcrumbJsonLd,
} from "@/lib/seo";
import { routing, type Locale } from "@/i18n/routing";
import type { Post } from "@/lib/posts";

export async function generateStaticParams() {
  const slugs = await getAllPostSlugs();
  return routing.locales.flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  try {
    const post = await getPost(slug, locale as Locale);
    return pageMetadata({
      locale: locale as Locale,
      path: `/blog/${slug}`,
      title: post.title,
      description: post.summary,
      image: post.coverImage,
      article: {
        publishedTime: post.publishedAt,
        modifiedTime: post.updatedAt,
        authors: [post.author],
      },
    });
  } catch {
    return pageMetadata({
      locale: locale as Locale,
      path: `/blog/${slug}`,
      title: "Post",
      description: "Post",
      noindex: true,
    });
  }
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  let post: Post;
  try {
    post = await getPost(slug, locale as Locale);
  } catch {
    notFound();
  }

  const t = await getTranslations("blog");
  const article = articleJsonLd({
    title: post.title,
    summary: post.summary,
    slug: post.slug,
    locale: post.locale,
    image: post.coverImage,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    author: post.author,
  });
  const breadcrumb = breadcrumbJsonLd(post.locale, [
    { name: "Home", path: "/" },
    { name: t("title"), path: "/blog" },
    { name: post.title, path: `/blog/${post.slug}` },
  ]);

  return (
    <article className="min-h-screen bg-canvas py-section">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(article) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <div className="max-w-narrow mx-auto px-6">
        <p className="text-caption-md uppercase tracking-wider text-mute mb-3">
          {t(`category.${post.category}`)} · {t("publishedOn")} {post.publishedAt}
        </p>
        <h1 className="text-display-lg text-ink mb-12">{post.title}</h1>
        <div
          className="aspect-[16/10] rounded-lg bg-surface-card bg-cover bg-center mb-12"
          style={{
            backgroundImage: `linear-gradient(135deg, #f6f6f3 0%, #dadad3 100%), url(${post.coverImage})`,
          }}
          aria-hidden
        />
        <MDXRemote source={post.body} components={mdxComponents} />
      </div>
    </article>
  );
}
```

- [ ] **Step 2: Verify types + lint**

Run: `pnpm exec tsc --noEmit && pnpm run lint`
Expected: both exit 0. (The two `dangerouslySetInnerHTML` JSON-LD scripts
match the existing pattern in `app/[locale]/products/[slug]/page.tsx` — no
eslint-disable needed; that rule is off in this config.)

- [ ] **Step 3: Commit**

```bash
git add "app/[locale]/blog/[slug]/page.tsx"
git commit -m "feat: blog post detail page with BlogPosting + Breadcrumb JSON-LD"
```

---

## Task 8: Per-post dynamic OG image

**Files:**
- Create: `app/[locale]/blog/[slug]/opengraph-image.tsx`

- [ ] **Step 1: Create the OG route** (cloned from the product OG route)

```tsx
import { ImageResponse } from "next/og";
import { getPost } from "@/lib/posts";
import type { Locale } from "@/i18n/routing";

export const alt = "H3 blog post";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function PostOgImage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  let title = "H3";
  let category = "";
  try {
    const post = await getPost(params.slug, params.locale as Locale);
    title = post.title;
    category = post.category;
  } catch {
    // brand-only fallback
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#ffffff",
          padding: 80,
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            color: "#e60023",
            fontSize: 36,
            fontWeight: 800,
            letterSpacing: -1.0,
          }}
        >
          H3
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              color: "#62625b",
              fontSize: 22,
              textTransform: "uppercase",
              letterSpacing: 1.5,
            }}
          >
            {category}
          </div>
          <div
            style={{
              color: "#000000",
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -1.2,
              maxWidth: 1000,
            }}
          >
            {title}
          </div>
        </div>
        <div style={{ color: "#62625b", fontSize: 18 }}>
          h3 / blog / {params.slug}
        </div>
      </div>
    ),
    size
  );
}
```

- [ ] **Step 2: Verify types**

Run: `pnpm exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add "app/[locale]/blog/[slug]/opengraph-image.tsx"
git commit -m "feat: per-post dynamic OG image"
```

---

## Task 9: Tag + category archive pages

**Files:**
- Create: `app/[locale]/blog/tag/[tag]/page.tsx`
- Create: `app/[locale]/blog/category/[category]/page.tsx`

- [ ] **Step 1: Create `app/[locale]/blog/tag/[tag]/page.tsx`**

```tsx
import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllTags, getPostsByTag } from "@/lib/posts";
import { pageMetadata } from "@/lib/seo";
import { DisplayHeading } from "@/components/primitives/DisplayHeading";
import { PostGrid } from "@/components/blog/PostGrid";
import { routing, type Locale } from "@/i18n/routing";

export async function generateStaticParams() {
  const params: { locale: string; tag: string }[] = [];
  for (const locale of routing.locales) {
    for (const tag of await getAllTags(locale)) {
      params.push({ locale, tag: encodeURIComponent(tag) });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; tag: string }>;
}): Promise<Metadata> {
  const { locale, tag } = await params;
  const decoded = decodeURIComponent(tag);
  const t = await getTranslations({ locale, namespace: "blog" });
  return pageMetadata({
    locale: locale as Locale,
    path: `/blog/tag/${tag}`,
    title: `${t("tagLabel")}: ${decoded}`,
    description: `${t("title")} — ${t("tagLabel")} ${decoded}`,
  });
}

export default async function TagArchivePage({
  params,
}: {
  params: Promise<{ locale: string; tag: string }>;
}) {
  const { locale, tag } = await params;
  setRequestLocale(locale);
  const decoded = decodeURIComponent(tag);
  const t = await getTranslations("blog");
  const posts = await getPostsByTag(decoded, locale as Locale);
  if (posts.length === 0) notFound();

  return (
    <div className="min-h-screen bg-canvas py-section">
      <div className="max-w-page mx-auto px-6">
        <p className="text-caption-md uppercase tracking-wider text-mute mb-3">
          {t("tagLabel")}
        </p>
        <DisplayHeading level="lg" className="mb-12">
          #{decoded}
        </DisplayHeading>
        <PostGrid posts={posts} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `app/[locale]/blog/category/[category]/page.tsx`**

```tsx
import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllCategories, getPostsByCategory } from "@/lib/posts";
import { pageMetadata } from "@/lib/seo";
import { DisplayHeading } from "@/components/primitives/DisplayHeading";
import { PostGrid } from "@/components/blog/PostGrid";
import { routing, type Locale } from "@/i18n/routing";

const VALID = ["news", "article", "update"] as const;

export async function generateStaticParams() {
  const params: { locale: string; category: string }[] = [];
  for (const locale of routing.locales) {
    for (const category of await getAllCategories(locale)) {
      params.push({ locale, category });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}): Promise<Metadata> {
  const { locale, category } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  const label = VALID.includes(category as (typeof VALID)[number])
    ? t(`category.${category}`)
    : category;
  return pageMetadata({
    locale: locale as Locale,
    path: `/blog/category/${category}`,
    title: `${t("categoryLabel")}: ${label}`,
    description: `${t("title")} — ${label}`,
  });
}

export default async function CategoryArchivePage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}) {
  const { locale, category } = await params;
  setRequestLocale(locale);
  if (!VALID.includes(category as (typeof VALID)[number])) notFound();
  const t = await getTranslations("blog");
  const posts = await getPostsByCategory(category, locale as Locale);
  if (posts.length === 0) notFound();

  return (
    <div className="min-h-screen bg-canvas py-section">
      <div className="max-w-page mx-auto px-6">
        <p className="text-caption-md uppercase tracking-wider text-mute mb-3">
          {t("categoryLabel")}
        </p>
        <DisplayHeading level="lg" className="mb-12">
          {t(`category.${category}`)}
        </DisplayHeading>
        <PostGrid posts={posts} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify types + lint**

Run: `pnpm exec tsc --noEmit && pnpm run lint`
Expected: both exit 0.

- [ ] **Step 4: Commit**

```bash
git add "app/[locale]/blog/tag" "app/[locale]/blog/category"
git commit -m "feat: tag + category archive pages"
```

---

## Task 10: Sitemap extension

**Files:**
- Modify: `app/sitemap.ts`

- [ ] **Step 1: Read the current `app/sitemap.ts`**

It currently builds KO/EN entries for static + product paths. Add blog
entries. At the top, add imports:

```ts
import {
  getAllPostSlugs,
  getAllTags,
  getAllCategories,
} from "@/lib/posts";
import { getAllPosts } from "@/lib/posts";
import { PAGE_SIZE } from "@/lib/blog-pagination";
```

- [ ] **Step 2: Add blog URL collection inside the `sitemap()` function**

After the existing product-path collection and before the final `entries`
return, add (the existing file pushes `{ url, lastModified, changeFrequency,
priority }` objects into an array — match that exact shape; replace
`SITE_URL`/`now` with whatever the existing file already uses for the origin
and date):

```ts
  // --- Blog ---
  const postSlugs = await getAllPostSlugs();
  for (const slug of postSlugs) {
    for (const loc of ["ko", "en"] as const) {
      const base = loc === "ko" ? SITE_URL : `${SITE_URL}/en`;
      entries.push({
        url: `${base}/blog/${slug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  }
  for (const loc of ["ko", "en"] as const) {
    const base = loc === "ko" ? SITE_URL : `${SITE_URL}/en`;
    const all = await getAllPosts(loc);
    const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
    entries.push({
      url: `${base}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    });
    for (let p = 2; p <= totalPages; p++) {
      entries.push({
        url: `${base}/blog/page/${p}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
    for (const tag of await getAllTags(loc)) {
      entries.push({
        url: `${base}/blog/tag/${encodeURIComponent(tag)}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }
    for (const cat of await getAllCategories(loc)) {
      entries.push({
        url: `${base}/blog/category/${cat}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }
  }
```

If the existing file names the array or origin/date differently, adapt these
three identifiers (`entries`, `SITE_URL`, `now`) to the existing names — do
NOT introduce new ones. Keep the entry object shape identical to the
existing product entries in that file.

- [ ] **Step 2b: Remove the now-redundant duplicate import**

If `getAllPosts` ends up imported twice (once in the combined import, once
separately) collapse to a single import line:

```ts
import {
  getAllPosts,
  getAllPostSlugs,
  getAllTags,
  getAllCategories,
} from "@/lib/posts";
import { PAGE_SIZE } from "@/lib/blog-pagination";
```

- [ ] **Step 3: Verify**

Run: `pnpm exec tsc --noEmit && pnpm run lint`
Expected: both exit 0.

- [ ] **Step 4: Commit**

```bash
git add app/sitemap.ts
git commit -m "feat: sitemap covers blog posts, archives, pagination"
```

---

## Task 11: Dual-locale RSS feeds

**Files:**
- Create: `app/rss.xml/route.ts` (KO)
- Create: `app/en/rss.xml/route.ts` (EN)

- [ ] **Step 1: Create `app/rss.xml/route.ts`**

```ts
import { getAllPosts } from "@/lib/posts";
import { SITE_URL, BRAND_NAME } from "@/lib/seo";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET() {
  const posts = (await getAllPosts("ko")).slice(0, 20);
  const items = posts
    .map(
      (p) => `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${SITE_URL}/blog/${p.slug}</link>
      <guid>${SITE_URL}/blog/${p.slug}</guid>
      <description>${escapeXml(p.summary)}</description>
      <pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>
    </item>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(BRAND_NAME)} 블로그</title>
    <link>${SITE_URL}/blog</link>
    <description>H3의 소식과 이야기</description>
    <language>ko-KR</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
```

- [ ] **Step 2: Create `app/en/rss.xml/route.ts`**

```ts
import { getAllPosts } from "@/lib/posts";
import { SITE_URL, BRAND_NAME } from "@/lib/seo";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET() {
  const posts = (await getAllPosts("en")).slice(0, 20);
  const items = posts
    .map(
      (p) => `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${SITE_URL}/en/blog/${p.slug}</link>
      <guid>${SITE_URL}/en/blog/${p.slug}</guid>
      <description>${escapeXml(p.summary)}</description>
      <pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>
    </item>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(BRAND_NAME)} Blog</title>
    <link>${SITE_URL}/en/blog</link>
    <description>News and stories from H3</description>
    <language>en-US</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
```

(`SITE_URL` and `BRAND_NAME` are already exported from `lib/seo.ts` as
`SITE as SITE_URL, BRAND as BRAND_NAME`.)

- [ ] **Step 3: Verify**

Run: `pnpm exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add "app/rss.xml" "app/en/rss.xml"
git commit -m "feat: dual-locale RSS 2.0 feeds"
```

---

## Task 12: Wire blog into header nav + RSS discovery link

**Files:**
- Modify: `components/layout/Header.tsx`
- Modify: `components/layout/MobileMenu.tsx`
- Modify: `messages/ko.json`, `messages/en.json` (add `nav.blog`)
- Modify: `app/[locale]/layout.tsx` (RSS `<link rel="alternate">`)

- [ ] **Step 1: Add `nav.blog` to both message files**

In `messages/ko.json`, inside the existing `"nav"` object add:

```json
    "blog": "블로그",
```

In `messages/en.json`, inside `"nav"` add:

```json
    "blog": "Blog",
```

- [ ] **Step 2: Add the Blog link to desktop nav in `components/layout/Header.tsx`**

The desktop `<nav>` currently has About / Products / Contact links. Add a
Blog link in the same style, after Products:

```tsx
          <Link href="/blog" className="hover:text-ink-soft transition-colors">
            {t("blog")}
          </Link>
```

- [ ] **Step 3: Add the Blog link to `components/layout/MobileMenu.tsx`**

In the overlay `<nav>`, after the Products link, add (same `data-mm-item`
pattern as the others so it joins the GSAP stagger):

```tsx
          <Link
            data-mm-item
            href="/blog"
            onClick={() => setOpen(false)}
            className="hover:text-primary transition-colors"
          >
            {t("blog")}
          </Link>
```

- [ ] **Step 4: Add RSS discovery links in `app/[locale]/layout.tsx`**

Next.js App Router `<head>` links are best added via metadata. In
`app/[locale]/layout.tsx`, the file already exports `metadata`. Replace the
static `metadata` export with a `generateMetadata` that adds the feed
`alternates` (keep title/description identical to the current values):

```ts
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const feed =
    locale === "en" ? `${SITE_URL}/en/rss.xml` : `${SITE_URL}/rss.xml`;
  return {
    title: "H3",
    description: "H3 company intro site",
    alternates: {
      types: { "application/rss+xml": feed },
    },
  };
}
```

(If `app/[locale]/layout.tsx` currently has `export const metadata: Metadata
= {...}`, delete that line and add the `generateMetadata` above. Keep all
other layout code unchanged. `SITE_URL` is already exported by `lib/seo.ts`.)

- [ ] **Step 5: Verify everything**

```bash
pnpm run check:i18n
pnpm exec tsc --noEmit
pnpm run lint
pnpm run test:unit
```
Expected: i18n parity OK; tsc exit 0; lint exit 0; `posts.test: 19 assertions passed.` + `All unit tests passed.`

- [ ] **Step 6: Commit**

```bash
git add components/layout/Header.tsx components/layout/MobileMenu.tsx messages/ko.json messages/en.json "app/[locale]/layout.tsx"
git commit -m "feat: blog in nav (desktop + mobile) + RSS discovery links"
```

---

## Task 13: Production build verification

**Files:** none (verification only).

- [ ] **Step 1: Ensure no dev server is running** (AGENTS.md OOM rule)

Confirm with the user that any `pnpm dev` is stopped before building.

- [ ] **Step 2: Build**

```bash
pnpm build
```
Expected: clean build. The route table includes `●` (SSG) entries for
`/[locale]/blog`, `/[locale]/blog/page/[page]`, `/[locale]/blog/[slug]`,
`/[locale]/blog/tag/[tag]`, `/[locale]/blog/category/[category]`, and `ƒ`
entries for the blog OG image + `/rss.xml` + `/en/rss.xml` route handlers.

- [ ] **Step 3: If the build fails**

Read the error. The most likely causes and fixes:
- zod frontmatter error in a fixture → fix the offending `.mdx` frontmatter.
- `generateStaticParams` returning a tag with characters needing encoding →
  the tag route already `encodeURIComponent`s; ensure fixture tags are simple.
- Type error in `app/sitemap.ts` from mismatched identifier names → align to
  the existing `entries`/origin/date identifiers per Task 10.
Fix, re-run `pnpm build`. Do not proceed until it is clean.

- [ ] **Step 4: Commit any fixes** (only if files changed)

```bash
git add -A
git commit -m "fix: blog build issues surfaced by pnpm build"
```

---

## Spec coverage check

| Spec requirement | Task |
|---|---|
| File-based MDX posts, separate `lib/posts.ts`, zod frontmatter | Task 1 |
| KO required / EN optional; EN subset; draft prod-filtered; slug from filename | Task 1 |
| getAllPosts/getPost/slugs/tags/categories/byTag/byCategory, publishedAt desc | Task 1 |
| Path-based pagination, 10/page, out-of-range → throw → notFound | Tasks 2, 6 |
| `blog.*` UI strings, ko/en parity | Tasks 3, 12 |
| `articleJsonLd` (BlogPosting) + `og:type=article` | Task 4 |
| Shared card/grid + localized empty state | Task 5 |
| `/blog` list + `/blog/page/[n]` (SSG, metadata, hreflang via pageMetadata) | Task 6 |
| Post detail (MDXRemote) + BlogPosting + Breadcrumb JSON-LD + notFound | Task 7 |
| Per-post dynamic OG image | Task 8 |
| Tag archive + category archive (single page, all matches, notFound on empty/unknown) | Task 9 |
| Sitemap: posts × locales + archives + pagination, lastmod, priority | Task 10 |
| Dual-locale RSS 2.0, latest 20, XML-escaped | Task 11 |
| RSS discovery `<link rel=alternate>`; blog in nav (desktop+mobile) | Task 12 |
| Invalid frontmatter fails build; SSG of all blog routes | Tasks 1, 13 |
| tsc + lint + check:i18n + test:unit + build all pass | Tasks 3–13 gates |
| Sample fixtures (ko+en) | Task 1 |
| Forward-compat fields declared, no logic | Task 1 (schema only) |
| Out of scope (comments/search/CMS/SP2/3/4) | not implemented — correct |
