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
