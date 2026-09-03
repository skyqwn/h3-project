import assert from "node:assert/strict";
import { paginate, PAGE_SIZE } from "@/lib/blog-pagination";

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

console.log("blog-pagination.test: 8 assertions passed.");
