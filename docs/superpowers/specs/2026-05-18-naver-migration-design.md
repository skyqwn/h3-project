# Naver → Site Content Migration (SP2) — Design Spec

**Date:** 2026-05-18
**Status:** Draft — pending user review
**Type:** One-time assisted migration script (no runtime/backend)

## Context & scope decomposition

This is **SP2** of the content-engine vision. SP1 (file-based blog/news
infrastructure) is shipped and live. SP2 imports the existing Naver blog
backlog into that infrastructure.

| # | Subsystem | Status |
|---|---|---|
| SP1 | Site blog/news infra (MDX, list/detail, SEO, RSS) | ✅ done, live |
| **SP2** | One-time Naver→site backlog migration | ✅ THIS |
| SP3 | AI auto-generation of site posts | later, separate |
| SP4 | Auto-publish site→Naver | **dropped** (no clean path; low ROI — see below) |

**SP4 explicitly dropped.** Naver has no clean public blog-write API;
browser-automation publishing is a fragile maintenance liability with poor
ROI for a low-volume company blog. The leverage is owning content on our
domain, not mirroring into a closed platform. SP2 (pulling content OUT of
Naver onto the owned domain) is SEO-positive and bounded; that is the
realistic "Naver" work.

## Goal

Migrate the existing ~10 Naver blog posts (blog `es_h3`) into
`content/posts/*.ko.mdx` + `public/blog/<slug>/` so they live on the owned
domain with our-site canonical URLs, re-hosted images, and full SP1 SEO
treatment. One-time, assisted (script does the heavy lifting; a human does a
quick per-post proofread before publish).

## Probe findings (verified, not assumed)

A read-only probe of `https://blog.naver.com/PostView.naver?blogId=es_h3&logNo=224232524997`:

- **Server-rendered.** Plain HTTP GET (browser UA, no login, no headless
  browser) returns the full SmartEditor HTML (298 KB).
- Title extractable from `og:title`; summary from `og:description`.
- Body is SmartEditor ONE: `.se-main-container` with `.se-component` blocks
  (probe post: 84 `se-module-text`, 34 `se-module-image`).
- Post images are on `postfiles.pstatic.net` with `?type=` query params and
  lazy-load attributes — must read `.se-image` `src`/`data-lazy-src`, not a
  naive regex.

→ Scripted extraction is viable. This de-risks the whole design.

## Locked decisions

1. **Approach B (assisted script).** A manifest the user fills + an
   automated fetch/convert/image-rehost pipeline + a human per-post
   proofread. Chosen over full-auto (quality matters for ~10 company posts)
   and manual-helper (overkill — HTTP fetch is clean).
2. **Direction is OUT of Naver only.** No login, no auto-publish, no ongoing
   sync.
3. **Drafts by default.** Generated posts get `draft: true`; SP1
   prod-filters drafts so a botched conversion never auto-deploys. The user
   flips `draft: false` after proofreading.
4. **KO only.** Naver posts are Korean → `.ko.mdx` only (SP1: ko required,
   en optional — no EN translation here).
5. **Our-site canonical.** SP1 `pageMetadata` self-canonicals.
   `source: "naver"` + `sourceUrl` store provenance only — no rel=canonical
   back to Naver (own the SEO).

## Constraints

- No backend/runtime. SP2 is a `tsx` script run on demand, consistent with
  the project's no-backend architecture.
- New dependency: `node-html-parser` (lightweight, script-only — NOT a
  runtime dependency).
- Must produce posts valid against SP1's `lib/posts.ts` zod schema (invalid
  frontmatter fails the build).
- `pnpm exec tsc --noEmit`, `pnpm run lint`, `pnpm run check:i18n` stay
  clean (the script is lint/type-checked too).

## Architecture

```
scripts/naver-migrate/
├── manifest.ts   # user-authored: entries { url, slug, category, tags, publishedAt? }
├── fetch.ts       # parse blogId+logNo from manifest url -> PostView URL -> HTTP GET (browser UA)
├── convert.ts     # parse .se-main-container -> MDX body + image URL list (PURE, unit-tested)
├── images.ts      # download images (Referer header) -> public/blog/<slug>/<n>.<ext>, rewrite paths
└── run.ts          # iterate manifest -> write content/posts/<slug>.ko.mdx (draft:true) + per-post summary/warnings
tests/unit/naver-convert.test.ts   # pure converter unit tests
```

### Manifest entry shape

```ts
type NaverMigrateEntry = {
  url: string;        // e.g. https://blog.naver.com/es_h3/224232524997
  slug: string;       // human-readable, e.g. gold-refining-pvc-pp-fumehood
  category: "news" | "article" | "update";
  tags: string[];
  publishedAt?: string; // ISO override; else parsed from post HTML; else today + warning
};
```

### Data flow

```
manifest.ts (≤10 entries by the user)
  └─ run.ts per entry:
       fetch.ts   → PostView HTML (verified probe path, no login/headless)
       convert.ts → walk .se-component → MDX body + ordered image URL list
       images.ts  → download each (Referer: https://blog.naver.com) →
                    public/blog/<slug>/<n>.<ext>; rewrite body img paths;
                    first image (or manifest override) → coverImage
       writer     → frontmatter (decoded og:title, trimmed og:description,
                    coverImage, manifest category/tags/slug, publishedAt,
                    author "H3", source "naver", sourceUrl, draft:true)
                    + body → content/posts/<slug>.ko.mdx
  → user proofreads each .ko.mdx → draft:false → pnpm build → commit → push
```

Re-running overwrites generated files. Flow is **generate → proofread →
commit**; do not re-run after manual edits (documented in the script header
and the plan).

## Converter fidelity (explicit support matrix)

| SmartEditor block | → MDX |
|---|---|
| `se-text` paragraph | Markdown paragraph + line breaks |
| heading-ish (standalone bold / large text / `se-title`) | `##` heuristic (ambiguous → paragraph; human fixes in proofread) |
| `se-quotation` | `> blockquote` |
| list (`se-l-*`) | `-` / `1.` markdown list |
| `se-image` | `![alt](/blog/<slug>/<n>.<ext>)` |
| inline link | `[text](url)` |
| Naver-only widgets (map, sticker, video embed, table) | flattened to text/link OR skipped, with a per-post warning logged |

Text/heading/list/quote/image/link are converted cleanly. Naver-only
widgets are NOT guaranteed lossless — a warning is logged and the user
fixes them in the draft proofread. Acceptable: ~10 company posts with a
mandatory review gate.

## Images

- From each `.se-image` component read `src` / `data-lazy-src`; strip
  `?type=w...` to request the original resolution.
- Download with `Referer: https://blog.naver.com` (defeats hotlink
  protection). Save `public/blog/<slug>/<n>.<ext>` (n = 1-based order;
  ext inferred from content-type or URL, default `.jpg`).
- Rewrite the body image paths to the local re-hosted paths.
- First image → `coverImage` unless a manifest override is added later.
  If a post has zero images: set `coverImage` to the conventional string
  `/blog/<slug>/cover.jpg` (a non-empty string satisfies SP1's required
  `coverImage` zod field; SP1's PostCard/detail layer a CSS gradient behind
  the cover URL, so a missing file degrades to the gradient rather than a
  broken image) and log a warning so the user can supply a real cover in
  the draft-proofread step.

## Frontmatter mapping

```yaml
title:       og:title (HTML-entity decoded)
summary:     og:description (decoded, trimmed to ~160 chars)
coverImage:  first re-hosted image path (or manifest override)
category:    manifest (never machine-guessed)
tags:        manifest
publishedAt: parsed from post HTML → manifest override → today + warning
author:      "H3"
source:      "naver"
sourceUrl:   original post URL
draft:       true
```

## Testing

- `tests/unit/naver-convert.test.ts` (tsx, added to `tests/unit/run.ts`):
  feed `.se-main-container` HTML snippets, assert MDX output for each
  supported block (text→paragraph, se-quotation→blockquote, list→md list,
  se-image→`![](path)`, link→`[]()`, unsupported widget→warning/skip).
  `convert.ts` is pure (no network) so it is fully unit-testable.
- Network fetch + image download are integration-level — verified by the
  one-shot run on the real probe URL (a plan task), not unit tests.
- `pnpm exec tsc --noEmit`, `pnpm run lint`, `pnpm run check:i18n` clean.

## Success criteria

1. A manifest entry → `pnpm exec tsx scripts/naver-migrate/run.ts` →
   `content/posts/<slug>.ko.mdx` (draft:true) + `public/blog/<slug>/`
   images, with a per-post summary and warnings for unsupported blocks.
2. The generated MDX passes SP1's zod schema; after `draft:false` the post
   renders at `/blog/<slug>` with images served from our domain and an
   our-site canonical.
3. The probe post (`es_h3/224232524997`) migrates end-to-end and replaces
   the `sample-post` fixture as the first real post.
4. `naver-convert` unit tests pass; `tsc` + `lint` + `check:i18n` clean;
   `pnpm build` clean.
5. Re-running on an unedited manifest is idempotent; the "no re-run after
   editing" rule is documented in the script and plan.

## Out of scope

Ongoing Naver sync, Naver login, auto-publish to Naver (SP4 dropped), EN
translation, lossless conversion of Naver-only widgets, a CMS/admin UI
(separate future work). SP3 (AI auto-generation) is separate.

## References

- SP1 infra to target: `lib/posts.ts` schema, `content/posts/`,
  `public/blog/`, `app/[locale]/blog/`
- SP1 spec/plan: `docs/superpowers/specs/2026-05-18-blog-news-infra-design.md`,
  `docs/superpowers/plans/2026-05-18-blog-news-infra.md`
- Project conventions: `AGENTS.md`
