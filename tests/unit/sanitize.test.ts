import assert from "node:assert/strict";
import { sanitizeBody, looksLikeHtml } from "@/lib/html/sanitize";

// script 제거
assert.equal(sanitizeBody("<p>a</p><script>alert(1)</script>"), "<p>a</p>");
// 이벤트 핸들러 제거
assert.ok(!sanitizeBody('<p onclick="x()">a</p>').includes("onclick"));
// 허용 style만: text-align 유지, background 제거
const s = sanitizeBody('<p style="text-align:center;background:red">c</p>');
assert.ok(s.includes("text-align:center"), "text-align 유지");
assert.ok(!s.toLowerCase().includes("background"), "background 제거");
// font-size/color 유지
assert.ok(sanitizeBody('<span style="font-size:20px">x</span>').includes("font-size:20px"));
assert.ok(sanitizeBody('<span style="color:#ff0000">x</span>').toLowerCase().includes("color:#ff0000"));
// 이미지 width/height 유지
assert.ok(
  sanitizeBody('<img src="https://x/a.png" alt="a" width="10" height="20" />').includes('width="10"')
);
// looksLikeHtml
assert.equal(looksLikeHtml("<p>hi</p>"), true);
assert.equal(looksLikeHtml("# 제목\n본문"), false);
assert.equal(looksLikeHtml("   <div>x</div>"), true);

console.log("sanitize.test: passed.");
