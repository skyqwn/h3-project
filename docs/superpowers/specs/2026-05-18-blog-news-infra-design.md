# Blog / News Infrastructure (SP1) — Design Spec

**Date:** 2026-05-18
**Status:** Draft — pending user review
**Type:** Feature (file-based content section, no backend infra)

## Context & scope decomposition

The user's end goal is an automated content engine. That vision is FOUR
independent subsystems; this spec covers only **SP1**:

| # | Subsystem | This spec? |
|---|---|---|
| **SP1** | Site blog/news infrastructure (MDX posts, list/detail, SEO, RSS) | ✅ THIS |
| SP2 | One-time Naver→site content migration (scrape + image re-host) | later, separate |
| SP3 | Auto-generate site posts (AI pipeline) | later, separate |
| SP4 | Auto-publish site→Naver | later, separate |

SP2/3/4 all depend on SP1 existing. SP1 must not block them; it deliberately
declares (but does not implement) frontmatter fields SP2/SP3 will populate.

## Goal

A blog/news section on the H3 site whose primary purpose is SEO — earning
organic search presence on the company's own domain (rather than only on
blog.naver.com). It mirrors the existing product MDX pattern, maximizes
indexable SEO surface (per-post, tag, category, paginated, RSS), and is
file-based so it needs no server/DB and stays consistent with the future
automation subsystems.

## Decisions locked during brainstorming

1. **File-based, no backend.** A post is a git-committed `.mdx` file rendered
   via SSG. Git is the durable source of truth (version-controlled, renders
   identically every deploy). No DB/server for serving or persistence.
2. **Language: Korean required, English optional per post.** `{slug}.ko.mdx`
   is mandatory; `{slug}.en.mdx` is optional. EN posts appear under `/en/blog`;
   KO-only posts are not faux-translated. UI labels remain fully bilingual.
3. **One section + category/tags.** A single `/blog` section; `category`
   (single, enum) and `tags` (array) in frontmatter — no separate `/news`.
4. **Authoring is file-based now** (GitHub web / local edit + commit). A
   git-CMS (Decap/Tina) is an explicit later follow-up, NOT part of SP1.
5. **Approach B (SEO-maximized):** tag/category archives + pagination +
   Article/Breadcrumb JSON-LD + per-post dynamic OG + RSS.

## Constraints

- No backend infra (Vercel serverless + git only), consistent with the rest
  of the project.
- Must reuse existing patterns: `lib/mdx.ts` (product loader) as the template
  for a separate `lib/posts.ts`; `lib/seo.ts` helpers; `app/sitemap.ts`;
  `next-mdx-remote/rsc` detail rendering; `mdx-components.tsx`; localized 404.
- i18n parity (`pnpm run check:i18n`) must pass for all new `blog.*` UI keys.
- `pnpm exec tsc --noEmit` and `pnpm run lint` (React-compiler rules on) clean.
- Tailwind v4 spacing-collision rule (see AGENTS.md) — only safe tokens.

## Architecture

### Content model

Files:

```
content/posts/{slug}.ko.mdx     # required
content/posts/{slug}.en.mdx     # optional
public/blog/{slug}/...          # per-post images (cover, inline)
lib/posts.ts                    # loader, SEPARATE from lib/mdx.ts
```

Frontmatter (zod-validated at load → invalid content fails the build):

```ts
const PostFrontmatter = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),                 // card excerpt + meta description
  coverImage: z.string().min(1),              // e.g. /blog/<slug>/cover.jpg
  category: z.enum(["news", "article", "update"]),
  tags: z.array(z.string()).default([]),
  publishedAt: z.string(),                    // ISO date
  updatedAt: z.string().optional(),           // ISO date
  author: z.string().default("H3"),
  draft: z.boolean().default(false),
  // SP3 forward-compat — declared, no logic in SP1:
  source: z.string().optional(),              // "naver" | "original" | ...
  sourceUrl: z.string().optional(),
  aiGenerated: z.boolean().default(false),
});
```

`slug` derives from filename (not stored), exactly like the product loader.

### `lib/posts.ts` interface

```ts
type Locale = "ko" | "en";
getAllPosts(locale): Post[]                 // publishedAt desc, draft filtered in prod
getPost(slug, locale): Post                 // throws if missing -> notFound()
getAllPostSlugs(): string[]                 // unique across locales (for SSG/sitemap)
getAllTags(locale): string[]
getAllCategories(locale): ("news"|"article"|"update")[]
getPostsByTag(tag, locale): Post[]
getPostsByCategory(category, locale): Post[]
```

- A post appears for a locale only if `{slug}.{locale}.mdx` exists. KO always
  present; `getAllPosts("en")` returns the EN subset only.
- `draft: true` posts are excluded when `process.env.NODE_ENV === "production"`
  (visible in dev/preview), matching the product loader.
- Separate from `lib/mdx.ts` because the frontmatter schema differs — one file,
  one responsibility.

### Routing (all SSG via generateStaticParams)

```
/[locale]/blog                       # main list, newest first, paginated (page 1)
/[locale]/blog/page/[page]           # main-list pagination, page >= 2
/[locale]/blog/[slug]                # post detail (next-mdx-remote/rsc)
/[locale]/blog/tag/[tag]             # tag archive — single page, all matches
/[locale]/blog/category/[category]   # category archive — single page, all matches
```

Korean at root (`/blog`), English at `/en/blog`. **Only the main list is
paginated**, path-based (`/blog/page/2`) for indexability — never query
params, 10 posts/page. Tag and category archives list ALL matching posts on
one page in SP1 (tag/category sets are small; pagination there is a later
add-on if a tag ever grows large — YAGNI for launch). Out-of-range page
number / unknown slug / unknown tag / unknown category → `notFound()`
(reuses the existing localized 404).

### Data flow

```
build time:
  content/posts/*.mdx ──[lib/posts.ts: gray-matter + zod]──▶ typed Post[]
        ├─▶ /blog + /blog/page/[n]            (paginated list, SSG)
        ├─▶ /blog/[slug]                      (MDXRemote render, SSG)
        ├─▶ /blog/tag|category/[x]            (filtered archives, SSG)
        ├─▶ app/sitemap.ts                    (urls × existing locales)
        └─▶ app/rss.xml + app/en/rss.xml      (latest 20)
runtime: none — all pages prerendered; git is the store
```

## SEO surface (Approach B)

- **Metadata:** every route exports `generateMetadata` via `lib/seo.ts`
  `pageMetadata`. Post detail adds `openGraph.type:"article"` +
  `publishedTime`/`modifiedTime`/`authors`. List/tag/category/pagination pages
  each get a unique title+description, self-canonical, hreflang (ko/en;
  EN alternate only when the EN file exists).
- **JSON-LD** (added to `lib/seo.ts`):
  - `articleJsonLd()` → `BlogPosting` (headline, description, image absolute,
    datePublished, dateModified, author, mainEntityOfPage) on post detail.
  - reuse `breadcrumbJsonLd` → Home › Blog › [Category] › Post on detail.
- **Dynamic OG image:** `app/[locale]/blog/[slug]/opengraph-image.tsx`,
  cloned from the product OG route — post title + category label + brand red.
- **Sitemap:** extend `app/sitemap.ts` with post slugs × existing locales +
  tag archive URLs + category archive URLs + main-list pagination pages
  (`/blog/page/n`). `lastmod = updatedAt ?? publishedAt`. priority: posts
  0.7, list 0.8.
- **RSS:** `app/rss.xml/route.ts` (ko) and `app/en/rss.xml/route.ts` (en),
  RSS 2.0 XML, latest 20 posts; `<link rel="alternate"
  type="application/rss+xml">` in the blog head.
- **Pagination SEO:** each page self-canonical with a unique title
  (`rel=prev/next` is deprecated — not used).
- **Images:** `next/image` for cover + inline; convention
  `public/blog/<slug>/...` (SP2's re-hosted Naver images land here; SP1 only
  defines the convention).

## i18n

- New UI strings under `blog.*` in BOTH `messages/ko.json` and
  `messages/en.json` (list title, "read more", "published on", category
  labels news/article/update, pagination prev/next, empty state). Parity
  enforced by `pnpm run check:i18n`.
- Post body is the `.mdx` file (ko required / en optional) — independent of
  the message catalogs.

## Error handling

- Unknown slug/tag/category, out-of-range page → `notFound()` (existing
  localized `app/[locale]/not-found.tsx`).
- Invalid frontmatter → zod throws at build time → broken content never
  ships (same guarantee as products).
- Zero posts → localized empty-state message ("아직 글이 없습니다").

## Testing

- `tests/unit/posts.test.ts` (tsx, imported by `tests/unit/run.ts`),
  mirroring `mdx.test.ts`:
  1. `getAllPosts("ko")` returns ≥1, sorted by `publishedAt` desc.
  2. `draft:true` excluded when `NODE_ENV=production`.
  3. `getPostsByTag` / `getPostsByCategory` filter correctly.
  4. slugs unique; `getAllPosts("en")` is the EN-file subset.
  5. invalid frontmatter throws.
- `pnpm run check:i18n` covers the new `blog.*` keys.
- `pnpm exec tsc --noEmit` + `pnpm run lint` clean.
- Build (SSG of all blog routes) succeeds.

## Sample content (fixtures)

`content/posts/sample-post.ko.mdx` + `content/posts/sample-post.en.mdx` — one
bilingual sample so tests and pages render before real content / SP2 import.
Same role as the products `sample.{ko,en}.mdx` fixtures.

## Out of scope (explicit)

Comments, on-site search, CMS admin UI, Naver scraping/migration (SP2), AI
auto-generation (SP3), auto-publish to Naver (SP4). The `source`/`sourceUrl`/
`aiGenerated` frontmatter fields are declared only — zero logic in SP1.

## Success criteria

1. `content/posts/<slug>.ko.mdx` (+ optional `.en.mdx`) → the post appears at
   `/blog`, `/blog/<slug>`, its tag/category archives, the sitemap, and the
   RSS feed, with no code change.
2. `/blog`, `/en/blog`, detail, tag, category, `/blog/page/2` all SSG and
   return correct localized metadata + canonical + hreflang.
3. Post detail emits BlogPosting + BreadcrumbList JSON-LD and a dynamic OG
   image.
4. `/rss.xml` and `/en/rss.xml` are valid RSS 2.0 listing the latest posts.
5. KO-only post does not appear under `/en/blog`; bilingual post appears in
   both with correct hreflang alternates.
6. Invalid frontmatter fails the build; unknown slug/page → localized 404.
7. `pnpm run test:unit`, `pnpm run check:i18n`, `pnpm exec tsc --noEmit`,
   `pnpm run lint`, and `pnpm build` all pass.

## References

- Product pattern to mirror: `lib/mdx.ts`, `app/[locale]/products/`,
  `mdx-components.tsx`, `app/[locale]/products/[slug]/opengraph-image.tsx`
- SEO helpers: `lib/seo.ts`, `app/sitemap.ts`, `app/robots.ts`
- Project guide / conventions: `AGENTS.md`
