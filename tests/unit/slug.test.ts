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
