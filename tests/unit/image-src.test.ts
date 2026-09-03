import assert from "node:assert/strict";
import { withDims, dimsFromSrc } from "@/lib/image-src";

// withDims: 쿼리 없는 URL
assert.equal(
  withDims("https://x.blob/body.jpg", 1200, 800),
  "https://x.blob/body.jpg?w=1200&h=800"
);
// withDims: 이미 쿼리가 있는 URL
assert.equal(
  withDims("https://x.blob/body.jpg?v=1", 100, 50),
  "https://x.blob/body.jpg?v=1&w=100&h=50"
);
// dimsFromSrc: 정상
assert.deepEqual(dimsFromSrc("https://x.blob/body.jpg?w=1200&h=800"), {
  width: 1200,
  height: 800,
});
// dimsFromSrc: 쿼리 없음 → null
assert.equal(dimsFromSrc("https://x.blob/body.jpg"), null);
// dimsFromSrc: 0/음수/비정상 → null
assert.equal(dimsFromSrc("https://x.blob/body.jpg?w=0&h=10"), null);
assert.equal(dimsFromSrc("https://x.blob/body.jpg?w=abc&h=10"), null);

console.log("image-src.test: 6 assertions passed.");
