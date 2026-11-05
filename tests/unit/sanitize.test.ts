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
// 유튜브 임베드: 정규형(nocookie + start만)으로 유지
const yt = sanitizeBody(
  '<div data-youtube-video=""><iframe src="https://www.youtube.com/embed/cY5_7EkxEcI?controls=1&start=387&rel=1" width="640" height="480" onload="x()"></iframe></div>'
);
assert.ok(yt.includes("data-youtube-video"), "youtube wrapper 유지");
assert.ok(
  yt.includes('src="https://www.youtube-nocookie.com/embed/cY5_7EkxEcI?start=387"'),
  `youtube src 정규화: ${yt}`
);
assert.ok(!yt.includes("onload"), "iframe 이벤트 제거");
// 유튜브가 아닌 iframe은 통째로 제거
assert.ok(!sanitizeBody('<iframe src="https://evil.example/x"></iframe>').includes("iframe"));
assert.ok(!sanitizeBody('<iframe src="javascript:alert(1)"></iframe>').includes("iframe"));
assert.ok(!sanitizeBody("<iframe></iframe>").includes("iframe"));

// looksLikeHtml
assert.equal(looksLikeHtml("<p>hi</p>"), true);
assert.equal(looksLikeHtml("# 제목\n본문"), false);
assert.equal(looksLikeHtml("   <div>x</div>"), true);

console.log("sanitize.test: passed.");
