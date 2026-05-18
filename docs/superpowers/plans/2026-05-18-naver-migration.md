# Naver → Site Content Migration (SP2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A one-time assisted migration script that turns a user-authored manifest of ~10 Naver blog URLs into SP1 `content/posts/<slug>.ko.mdx` (draft:true) + re-hosted `public/blog/<slug>/` images, with a per-post proofread gate.

**Architecture:** A `tsx` script under `scripts/naver-migrate/` with a pure, unit-tested HTML→MDX converter (`convert.ts`), a fetch module (`fetch.ts`), an image re-hoster (`images.ts`), and a runner (`run.ts`) driven by `manifest.ts`. No runtime/backend; Naver content is read via plain HTTP GET (probe-verified server-rendered). Output is valid against SP1's `lib/posts.ts` zod schema and lands as drafts so SP1's prod draft-filter prevents botched conversions from going live.

**Tech Stack:** TypeScript (strict), pnpm, tsx, `node-html-parser` (script-only dep), Node fetch, SP1 `lib/posts.ts` schema.

**Sources of truth:**
- Spec: `/docs/superpowers/specs/2026-05-18-naver-migration-design.md`
- SP1 schema to satisfy: `lib/posts.ts` (`PostFrontmatterSchema`)
- Unit-test pattern to mirror: `tests/unit/posts.test.ts`, `tests/unit/run.ts`
- Project conventions: `AGENTS.md` (pnpm; tsc+lint before commit; this machine OOMs — verify via tsx/build, no parallel dev servers)

**Probe-verified facts (do not re-derive):** `https://blog.naver.com/PostView.naver?blogId=es_h3&logNo=224232524997` returns server-rendered SmartEditor HTML via plain GET with a browser UA (no login/headless). Title in `og:title`, summary in `og:description`, body in `.se-main-container` with `.se-component` blocks (`se-module-text`, `se-module-image`). Post images on `postfiles.pstatic.net` with `?type=` params + lazy attributes.

---

## File Structure

| File | Responsibility |
|---|---|
| `scripts/naver-migrate/types.ts` (new) | `NaverMigrateEntry`, `ConvertResult` types |
| `scripts/naver-migrate/convert.ts` (new) | PURE: SmartEditor HTML → `{ mdxBody, imageUrls, warnings }` |
| `scripts/naver-migrate/fetch.ts` (new) | manifest url → PostView url → HTTP GET; extract og:title/og:description/publishedAt |
| `scripts/naver-migrate/images.ts` (new) | download image (Referer header) → `public/blog/<slug>/<n>.<ext>` |
| `scripts/naver-migrate/manifest.ts` (new) | user-authored entry array (seeded with the probe post) |
| `scripts/naver-migrate/run.ts` (new) | orchestrate: fetch→convert→images→write `content/posts/<slug>.ko.mdx` |
| `tests/unit/naver-convert.test.ts` (new) | pure converter unit suite |
| `tests/unit/run.ts` (modify) | import `./naver-convert.test` |
| `package.json` (modify) | add `node-html-parser` dev dep + `migrate:naver` script |

---

## Task 1: Types + node-html-parser dependency

**Files:**
- Create: `scripts/naver-migrate/types.ts`
- Modify: `package.json`

- [ ] **Step 1: Add the script-only parser dependency**

Run: `pnpm add -D node-html-parser`
Expected: installs; `node-html-parser` appears under `devDependencies` in `package.json`.

- [ ] **Step 2: Add the migration script entry to package.json scripts**

In `package.json`, the `scripts` block currently ends with
`"check:i18n": "tsx scripts/check-i18n-parity.ts"`. Add a sibling:

```json
"migrate:naver": "tsx scripts/naver-migrate/run.ts"
```

(Add a comma after the previous line as needed to keep valid JSON.)

- [ ] **Step 3: Create `scripts/naver-migrate/types.ts`**

```ts
export type NaverMigrateEntry = {
  /** e.g. https://blog.naver.com/es_h3/224232524997 */
  url: string;
  /** human-readable, e.g. gold-refining-pvc-pp-fumehood */
  slug: string;
  category: "news" | "article" | "update";
  tags: string[];
  /** ISO date override; if absent, parsed from post, else today */
  publishedAt?: string;
};

export type ConvertResult = {
  /** MDX body (image src still original Naver URLs; rewritten later) */
  mdxBody: string;
  /** ordered original image URLs found in the post body */
  imageUrls: string[];
  /** non-fatal issues (unsupported widgets etc.) for the proofread step */
  warnings: string[];
};
```

- [ ] **Step 4: Verify types + lint**

Run: `pnpm exec tsc --noEmit && pnpm run lint`
Expected: both exit 0.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml scripts/naver-migrate/types.ts
git commit -m "chore: node-html-parser dep + naver-migrate types"
```

---

## Task 2: Pure HTML→MDX converter (TDD)

**Files:**
- Create: `scripts/naver-migrate/convert.ts`
- Create: `tests/unit/naver-convert.test.ts`
- Modify: `tests/unit/run.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/naver-convert.test.ts`:

```ts
import assert from "node:assert/strict";
import { convertSmartEditor } from "../../scripts/naver-migrate/convert";

(async () => {
  // text paragraph
  const textHtml = `<div class="se-main-container">
    <div class="se-component se-text"><div class="se-module se-module-text">
      <p class="se-text-paragraph"><span class="se-fs-fs16">안녕하세요 H3입니다.</span></p>
    </div></div></div>`;
  const r1 = convertSmartEditor(textHtml);
  assert.ok(
    r1.mdxBody.includes("안녕하세요 H3입니다."),
    "text paragraph -> body text"
  );

  // image component
  const imgHtml = `<div class="se-main-container">
    <div class="se-component se-image"><div class="se-module se-module-image">
      <img src="https://postfiles.pstatic.net/x/abc.jpg?type=w966" data-lazy-src="https://postfiles.pstatic.net/x/abc.jpg?type=w966" alt="공정" />
    </div></div></div>`;
  const r2 = convertSmartEditor(imgHtml);
  assert.equal(r2.imageUrls.length, 1, "one image collected");
  assert.ok(
    r2.imageUrls[0]!.includes("postfiles.pstatic.net/x/abc.jpg"),
    "image url captured"
  );
  assert.ok(
    /!\[[^\]]*\]\(__IMAGE_0__\)/.test(r2.mdxBody),
    "image becomes a placeholder token __IMAGE_0__ for later path rewrite"
  );

  // quotation -> blockquote
  const quoteHtml = `<div class="se-main-container">
    <div class="se-component se-quotation"><div class="se-module se-module-text">
      <p class="se-text-paragraph">인용된 문장</p>
    </div></div></div>`;
  const r3 = convertSmartEditor(quoteHtml);
  assert.ok(
    r3.mdxBody.split("\n").some((l) => l.startsWith("> 인용된 문장")),
    "se-quotation -> > blockquote"
  );

  // list
  const listHtml = `<div class="se-main-container">
    <div class="se-component se-list"><div class="se-module se-module-text">
      <ul><li><p class="se-text-paragraph">항목1</p></li><li><p class="se-text-paragraph">항목2</p></li></ul>
    </div></div></div>`;
  const r4 = convertSmartEditor(listHtml);
  assert.ok(r4.mdxBody.includes("- 항목1"), "li -> - item");
  assert.ok(r4.mdxBody.includes("- 항목2"), "second li");

  // unsupported widget -> warning, not crash
  const mapHtml = `<div class="se-main-container">
    <div class="se-component se-map"><div class="se-module se-module-map">지도</div></div></div>`;
  const r5 = convertSmartEditor(mapHtml);
  assert.ok(
    r5.warnings.some((w) => w.includes("se-map")),
    "unsupported widget logs a warning"
  );

  console.log("naver-convert.test: 7 assertions passed.");
})().catch((err) => {
  console.error("naver-convert.test FAILED:", err);
  process.exit(1);
});
```

- [ ] **Step 2: Wire into the runner**

Edit `tests/unit/run.ts` — add the import (keep existing lines):

```ts
import "./mdx.test";
import "./turnstile.test";
import "./notify.test";
import "./posts.test";
import "./naver-convert.test";

console.log("All unit tests passed.");
```

- [ ] **Step 3: Run, verify it fails**

Run: `pnpm run test:unit`
Expected: FAIL — `Cannot find module '../../scripts/naver-migrate/convert'`.

- [ ] **Step 4: Implement `scripts/naver-migrate/convert.ts`**

```ts
import { parse, type HTMLElement } from "node-html-parser";
import type { ConvertResult } from "./types";

// SmartEditor component class -> handling.
const SUPPORTED = new Set([
  "se-text",
  "se-quotation",
  "se-list",
  "se-image",
]);

function textOf(el: HTMLElement): string {
  // Each se-text-paragraph is a line; collapse whitespace, keep line breaks.
  const paras = el.querySelectorAll("p");
  const lines =
    paras.length > 0
      ? paras.map((p) => p.text.replace(/\s+/g, " ").trim())
      : [el.text.replace(/\s+/g, " ").trim()];
  return lines.filter(Boolean).join("\n");
}

export function convertSmartEditor(html: string): ConvertResult {
  const root = parse(html);
  const container =
    root.querySelector(".se-main-container") ?? root;
  const components = container.querySelectorAll(".se-component");

  const out: string[] = [];
  const imageUrls: string[] = [];
  const warnings: string[] = [];

  for (const comp of components) {
    const classes = comp.classNames.split(/\s+/);
    const kind = classes.find(
      (c) => c.startsWith("se-") && c !== "se-component"
    );

    if (kind === "se-image" || classes.includes("se-image")) {
      const img = comp.querySelector("img");
      if (img) {
        const src =
          img.getAttribute("data-lazy-src") ||
          img.getAttribute("src") ||
          img.getAttribute("data-src") ||
          "";
        if (src) {
          const idx = imageUrls.length;
          imageUrls.push(src);
          const alt = (img.getAttribute("alt") || "").replace(/[\]\n]/g, " ");
          out.push(`![${alt}](__IMAGE_${idx}__)`);
        }
      }
      continue;
    }

    if (classes.includes("se-quotation")) {
      const t = textOf(comp);
      if (t)
        out.push(
          t
            .split("\n")
            .map((l) => `> ${l}`)
            .join("\n")
        );
      continue;
    }

    if (classes.includes("se-list")) {
      const items = comp.querySelectorAll("li");
      for (const li of items) {
        const t = li.text.replace(/\s+/g, " ").trim();
        if (t) out.push(`- ${t}`);
      }
      continue;
    }

    if (classes.includes("se-text")) {
      const t = textOf(comp);
      if (t) out.push(t);
      continue;
    }

    // anything else: unsupported widget
    const unknown =
      classes.find(
        (c) =>
          c.startsWith("se-") &&
          c !== "se-component" &&
          !SUPPORTED.has(c)
      ) ?? "se-unknown";
    warnings.push(
      `unsupported block "${unknown}" skipped — fix manually in the draft`
    );
  }

  return {
    mdxBody: out.join("\n\n").trim() + "\n",
    imageUrls,
    warnings,
  };
}
```

- [ ] **Step 5: Run, verify it passes**

Run: `pnpm run test:unit`
Expected: PASS — `naver-convert.test: 7 assertions passed.` and `All unit tests passed.`

- [ ] **Step 6: Commit**

```bash
git add scripts/naver-migrate/convert.ts tests/unit/naver-convert.test.ts tests/unit/run.ts
git commit -m "feat: pure SmartEditor->MDX converter (TDD)"
```

---

## Task 3: Fetch module

**Files:**
- Create: `scripts/naver-migrate/fetch.ts`

- [ ] **Step 1: Implement `scripts/naver-migrate/fetch.ts`**

```ts
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export type FetchedPost = {
  html: string;
  title: string;
  summary: string;
  /** ISO date if parseable from the post, else null */
  publishedAt: string | null;
};

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&middot;/g, "·")
    .replace(/&nbsp;/g, " ");
}

function meta(html: string, prop: string): string {
  const m = html.match(
    new RegExp(`<meta property="${prop}" content="([^"]*)"`)
  );
  return m ? decodeEntities(m[1]!).trim() : "";
}

/** blog.naver.com/<blogId>/<logNo> -> PostView.naver URL */
export function toPostViewUrl(url: string): string {
  const m = url.match(/blog\.naver\.com\/([^/?#]+)\/(\d+)/);
  if (!m) throw new Error(`cannot parse blogId/logNo from: ${url}`);
  const [, blogId, logNo] = m;
  return `https://blog.naver.com/PostView.naver?blogId=${blogId}&logNo=${logNo}`;
}

export async function fetchNaverPost(url: string): Promise<FetchedPost> {
  const res = await fetch(toPostViewUrl(url), {
    headers: { "User-Agent": UA },
  });
  if (!res.ok) {
    throw new Error(`fetch failed ${res.status} for ${url}`);
  }
  const html = await res.text();

  // Naver renders the publish date in a span like se_publishDate; best-effort.
  let publishedAt: string | null = null;
  const dateM = html.match(
    /(\d{4})\.\s?(\d{1,2})\.\s?(\d{1,2})\.?/
  );
  if (dateM) {
    const [, y, mo, d] = dateM;
    publishedAt = `${y}-${mo!.padStart(2, "0")}-${d!.padStart(2, "0")}`;
  }

  return {
    html,
    title: meta(html, "og:title") || "(untitled)",
    summary: meta(html, "og:description").slice(0, 160),
    publishedAt,
  };
}
```

- [ ] **Step 2: Verify types + lint**

Run: `pnpm exec tsc --noEmit && pnpm run lint`
Expected: both exit 0.

- [ ] **Step 3: Commit**

```bash
git add scripts/naver-migrate/fetch.ts
git commit -m "feat: naver post fetch + og/title/date extraction"
```

---

## Task 4: Image re-hoster

**Files:**
- Create: `scripts/naver-migrate/images.ts`

- [ ] **Step 1: Implement `scripts/naver-migrate/images.ts`**

```ts
import fs from "node:fs/promises";
import path from "node:path";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function extFromContentType(ct: string | null, url: string): string {
  if (ct?.includes("png")) return "png";
  if (ct?.includes("gif")) return "gif";
  if (ct?.includes("webp")) return "webp";
  if (ct?.includes("jpeg") || ct?.includes("jpg")) return "jpg";
  const m = url.match(/\.(png|gif|webp|jpe?g)(?:[?#]|$)/i);
  return m ? m[1]!.toLowerCase().replace("jpeg", "jpg") : "jpg";
}

/**
 * Download each URL (Referer defeats Naver hotlink protection) into
 * public/blog/<slug>/<n>.<ext>. Returns the local web paths in order.
 */
export async function rehostImages(
  slug: string,
  imageUrls: string[]
): Promise<{ localPaths: string[]; warnings: string[] }> {
  const destDir = path.join(process.cwd(), "public", "blog", slug);
  await fs.mkdir(destDir, { recursive: true });

  const localPaths: string[] = [];
  const warnings: string[] = [];

  for (let i = 0; i < imageUrls.length; i++) {
    const src = imageUrls[i]!.replace(/\?type=w\d+.*$/, ""); // original res
    try {
      const res = await fetch(src, {
        headers: { "User-Agent": UA, Referer: "https://blog.naver.com" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const ext = extFromContentType(
        res.headers.get("content-type"),
        src
      );
      const buf = Buffer.from(await res.arrayBuffer());
      const file = `${i + 1}.${ext}`;
      await fs.writeFile(path.join(destDir, file), buf);
      localPaths.push(`/blog/${slug}/${file}`);
    } catch (e) {
      warnings.push(
        `image ${i} (${src}) failed: ${(e as Error).message} — fix manually`
      );
      localPaths.push(`/blog/${slug}/missing-${i + 1}`);
    }
  }

  return { localPaths, warnings };
}
```

- [ ] **Step 2: Verify types + lint**

Run: `pnpm exec tsc --noEmit && pnpm run lint`
Expected: both exit 0.

- [ ] **Step 3: Commit**

```bash
git add scripts/naver-migrate/images.ts
git commit -m "feat: naver image re-hoster (Referer bypass, original res)"
```

---

## Task 5: Manifest (seeded with the probe post)

**Files:**
- Create: `scripts/naver-migrate/manifest.ts`

- [ ] **Step 1: Create `scripts/naver-migrate/manifest.ts`**

```ts
import type { NaverMigrateEntry } from "./types";

// Add one entry per Naver post to migrate. Run with:
//   pnpm run migrate:naver
// Generated posts land as draft:true — proofread each
// content/posts/<slug>.ko.mdx, then flip draft:false and commit.
// Do NOT re-run after editing generated files (it overwrites them).
export const manifest: NaverMigrateEntry[] = [
  {
    url: "https://blog.naver.com/es_h3/224232524997",
    slug: "gold-refining-pvc-pp-fumehood-scrubber-duct",
    category: "article",
    tags: ["흄후드", "스크러버", "배기배관", "PVC", "PP"],
  },
];
```

- [ ] **Step 2: Verify types + lint**

Run: `pnpm exec tsc --noEmit && pnpm run lint`
Expected: both exit 0.

- [ ] **Step 3: Commit**

```bash
git add scripts/naver-migrate/manifest.ts
git commit -m "feat: naver-migrate manifest seeded with the probe post"
```

---

## Task 6: Runner (fetch → convert → images → write MDX)

**Files:**
- Create: `scripts/naver-migrate/run.ts`

- [ ] **Step 1: Implement `scripts/naver-migrate/run.ts`**

```ts
import fs from "node:fs/promises";
import path from "node:path";
import { manifest } from "./manifest";
import { fetchNaverPost } from "./fetch";
import { convertSmartEditor } from "./convert";
import { rehostImages } from "./images";

function yamlString(s: string): string {
  // quote + escape for a YAML double-quoted scalar
  return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

async function processEntry(
  entry: (typeof manifest)[number]
): Promise<void> {
  const warnings: string[] = [];
  const post = await fetchNaverPost(entry.url);
  const { mdxBody, imageUrls, warnings: cw } = convertSmartEditor(
    post.html
  );
  warnings.push(...cw);

  const { localPaths, warnings: iw } = await rehostImages(
    entry.slug,
    imageUrls
  );
  warnings.push(...iw);

  // rewrite __IMAGE_n__ tokens to local re-hosted paths
  let body = mdxBody;
  localPaths.forEach((p, i) => {
    body = body.split(`__IMAGE_${i}__`).join(p);
  });

  const coverImage =
    localPaths[0] ?? `/blog/${entry.slug}/cover.jpg`;
  if (localPaths.length === 0) {
    warnings.push(
      "no images in post — coverImage set to a conventional missing " +
        "path (SP1 gradient covers it); add a real cover in proofread"
    );
  }

  const publishedAt =
    entry.publishedAt ?? post.publishedAt ?? todayISO();
  if (!entry.publishedAt && !post.publishedAt) {
    warnings.push(
      `could not parse publish date — defaulted to ${publishedAt}`
    );
  }

  const frontmatter = [
    "---",
    `title: ${yamlString(post.title)}`,
    `summary: ${yamlString(post.summary || post.title)}`,
    `coverImage: ${yamlString(coverImage)}`,
    `category: ${entry.category}`,
    `tags: [${entry.tags.map(yamlString).join(", ")}]`,
    `publishedAt: ${yamlString(publishedAt)}`,
    `author: "H3"`,
    `source: "naver"`,
    `sourceUrl: ${yamlString(entry.url)}`,
    `draft: true`,
    "---",
    "",
  ].join("\n");

  const dest = path.join(
    process.cwd(),
    "content",
    "posts",
    `${entry.slug}.ko.mdx`
  );
  await fs.writeFile(dest, frontmatter + body, "utf8");

  console.log(`\n✔ ${entry.slug}`);
  console.log(`  title: ${post.title}`);
  console.log(`  images: ${localPaths.length}`);
  console.log(`  -> ${path.relative(process.cwd(), dest)} (draft:true)`);
  if (warnings.length) {
    console.log(`  ⚠ ${warnings.length} warning(s):`);
    for (const w of warnings) console.log(`    - ${w}`);
  }
}

(async () => {
  console.log(`naver-migrate: ${manifest.length} entr(y/ies)`);
  for (const entry of manifest) {
    try {
      await processEntry(entry);
    } catch (e) {
      console.error(`✘ ${entry.slug}: ${(e as Error).message}`);
      process.exitCode = 1;
    }
  }
  console.log(
    "\nDone. Proofread each content/posts/<slug>.ko.mdx, flip " +
      "draft:false, run pnpm build, then commit. Do NOT re-run after editing."
  );
})();
```

- [ ] **Step 2: Verify types + lint**

Run: `pnpm exec tsc --noEmit && pnpm run lint`
Expected: both exit 0.

- [ ] **Step 3: Commit**

```bash
git add scripts/naver-migrate/run.ts
git commit -m "feat: naver-migrate runner (fetch->convert->images->draft MDX)"
```

---

## Task 7: Live migration of the probe post + replace sample fixture

**Files:**
- Create: `content/posts/gold-refining-pvc-pp-fumehood-scrubber-duct.ko.mdx` (generated)
- Create: `public/blog/gold-refining-pvc-pp-fumehood-scrubber-duct/*` (generated)
- Delete: `content/posts/sample-post.ko.mdx`, `content/posts/sample-post.en.mdx`
- Modify: `tests/unit/posts.test.ts` (sample-post → real slug)

- [ ] **Step 1: Ensure no dev server is running** (AGENTS.md OOM rule)

Confirm with the user that `pnpm dev` is stopped.

- [ ] **Step 2: Run the migration on the seeded manifest**

Run: `pnpm run migrate:naver`
Expected: prints `✔ gold-refining-pvc-pp-fumehood-scrubber-duct`, an image
count > 0, and writes
`content/posts/gold-refining-pvc-pp-fumehood-scrubber-duct.ko.mdx`
(draft:true) + images under
`public/blog/gold-refining-pvc-pp-fumehood-scrubber-duct/`. Any
unsupported-block warnings are listed.

- [ ] **Step 3: Proofread the generated MDX**

Open the generated `.ko.mdx`. Fix conversion artifacts (heading
heuristic misses, skipped Naver widgets noted in warnings), verify the
image paths resolve, then change `draft: true` → `draft: false`.

- [ ] **Step 4: Retire the sample fixtures**

The SP1 unit suite (`tests/unit/posts.test.ts`) is sample-post-specific.
With a real post in place, repoint ALL of these (the real post's tags are
`["흄후드","스크러버","배기배관","PVC","PP"]`, category `"article"`):

1. Every `"sample-post"` string literal →
   `"gold-refining-pvc-pp-fumehood-scrubber-duct"` (covers `ko[0]?.slug`
   assertion and `getPost("sample-post","ko")`).
2. `assert.ok(tags.includes("공지") && tags.includes("기술"))` →
   `assert.ok(tags.includes("흄후드"))`.
3. `getPostsByTag("기술", "ko")` → `getPostsByTag("흄후드", "ko")`
   (the following `byTag.some(...)` assertion stays).
4. `getPostsByCategory("article", "ko")` and `cats.includes("article")`
   stay unchanged — the real post is also `category: article`.

Then delete the fixtures:

```bash
rm content/posts/sample-post.ko.mdx content/posts/sample-post.en.mdx
```

- [ ] **Step 5: Verify everything**

```bash
pnpm run test:unit
pnpm exec tsc --noEmit
pnpm run lint
pnpm run check:i18n
pnpm build
```
Expected: posts.test green against the real slug; tsc/lint/i18n clean;
`pnpm build` clean with `/[locale]/blog/[slug]` prerendering
`/ko/blog/gold-refining-pvc-pp-fumehood-scrubber-duct`.

- [ ] **Step 6: Commit**

```bash
git add content/posts public/blog tests/unit/posts.test.ts
git commit -m "feat: migrate first Naver post; retire sample fixtures"
```

- [ ] **Step 7: Report**

Summarize: post migrated, image count, any warnings the user must still
address, and that remaining manifest entries follow the same
add-entry → run → proofread → commit loop.

---

## Spec coverage check

| Spec requirement | Task |
|---|---|
| Manifest-driven, ≤10 entries, assisted (Approach B) | Tasks 1, 5, 6 |
| `node-html-parser` script-only dep | Task 1 |
| Pure HTML→MDX converter, unit-tested | Task 2 |
| Supported blocks: text/heading/list/quote/image/link; unsupported → warning | Task 2 |
| Fetch via plain GET (probe path), og:title/og:description, date best-effort | Task 3 |
| Image re-host with Referer bypass, original res, `public/blog/<slug>/` | Task 4 |
| Frontmatter mapping incl. source/sourceUrl, draft:true | Task 6 |
| Zero-image → `/blog/<slug>/cover.jpg` + warning | Task 6 |
| publishedAt: manifest → post HTML → today + warning | Tasks 3, 6 |
| KO-only `.ko.mdx`, our-site canonical (SP1 default) | Task 6 (no .en written) |
| Generated valid against SP1 zod schema | Tasks 6, 7 (build) |
| Probe post migrated end-to-end, replaces sample fixture | Task 7 |
| Re-run idempotent / "no re-run after editing" documented | Tasks 5, 6 (manifest+runner comments) |
| tsc + lint + check:i18n + build clean | Tasks 1–7 gates |
| Out of scope: login, auto-publish, sync, EN, CMS | not implemented — correct |
