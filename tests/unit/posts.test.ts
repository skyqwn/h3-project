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
  assert.equal(ko[0]?.slug, "gold-refining-pvc-pp-fumehood-scrubber-duct");
  assert.equal(ko[0]?.category, "article");
  assert.ok(Array.isArray(ko[0]?.tags));
  for (let i = 1; i < ko.length; i++) {
    assert.ok(
      ko[i - 1]!.publishedAt >= ko[i]!.publishedAt,
      "posts must be sorted by publishedAt desc"
    );
  }

  // Migrated Naver posts are KO-only (no .en.mdx) — verify SP1's
  // ko-required / en-optional behavior: a KO-only post is absent from /en.
  const en = await getAllPosts("en");
  assert.ok(
    !en.some(
      (p) => p.slug === "gold-refining-pvc-pp-fumehood-scrubber-duct"
    ),
    "KO-only post must be absent from the EN list"
  );

  const slugs = await getAllPostSlugs();
  assert.ok(slugs.includes("gold-refining-pvc-pp-fumehood-scrubber-duct"));
  assert.equal(new Set(slugs).size, slugs.length, "slugs unique");

  const one = await getPost("gold-refining-pvc-pp-fumehood-scrubber-duct", "ko");
  assert.equal(one.slug, "gold-refining-pvc-pp-fumehood-scrubber-duct");
  assert.ok(one.body.length > 0);

  const tags = await getAllTags("ko");
  assert.ok(tags.includes("흄후드"));

  const cats = await getAllCategories("ko");
  assert.ok(cats.includes("article"));

  const byTag = await getPostsByTag("흄후드", "ko");
  assert.ok(byTag.some((p) => p.slug === "gold-refining-pvc-pp-fumehood-scrubber-duct"));

  const byCat = await getPostsByCategory("article", "ko");
  assert.ok(byCat.some((p) => p.slug === "gold-refining-pvc-pp-fumehood-scrubber-duct"));

  let threw = false;
  try {
    await getPost("does-not-exist", "ko");
  } catch {
    threw = true;
  }
  assert.equal(threw, true, "getPost on missing slug must throw");

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
  console.error("posts.test FAILED:", err);
  process.exit(1);
});
