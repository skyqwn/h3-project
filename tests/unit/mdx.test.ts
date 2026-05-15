import assert from "node:assert/strict";
import { getAllProducts, getProduct, getAllProductSlugs } from "../../lib/mdx";

(async () => {
  // Korean: at least one product, sorted by order ascending, with valid shape.
  const ko = await getAllProducts("ko");
  assert.ok(ko.length >= 1, "expected at least one Korean product");
  assert.equal(ko[0]?.slug, "sample", "first sorted slug should be 'sample'");
  assert.equal(typeof ko[0]?.title, "string");
  assert.equal(typeof ko[0]?.tagline, "string");
  assert.equal(typeof ko[0]?.order, "number");
  assert.ok(ko[0]?.body && ko[0].body.length > 0, "body content must not be empty");

  // English: parallel structure.
  const en = await getAllProducts("en");
  assert.ok(en.length >= 1, "expected at least one English product");
  assert.equal(en[0]?.slug, "sample");

  // Slug list is locale-agnostic — unique slugs only.
  const slugs = await getAllProductSlugs();
  assert.ok(slugs.includes("sample"));
  assert.equal(new Set(slugs).size, slugs.length, "slugs must be unique");

  // Single-product getter matches.
  const one = await getProduct("sample", "ko");
  assert.equal(one.slug, "sample");
  assert.equal(one.locale, "ko");
  assert.ok(one.body && one.body.length > 0);

  console.log("mdx.test: 7 assertions passed.");
})().catch((err) => {
  console.error("mdx.test FAILED:", err);
  process.exit(1);
});
