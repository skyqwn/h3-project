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

  // image strip (gallery) -> every img collected
  const stripHtml = `<div class="se-main-container">
    <div class="se-component se-imageStrip se-imageStrip2 se-l-default">
      <img src="https://postfiles.pstatic.net/a.jpg?type=w80_blur" data-lazy-src="https://postfiles.pstatic.net/a.jpg?type=w966" alt="a" />
      <img src="https://postfiles.pstatic.net/b.jpg?type=w80_blur" data-lazy-src="https://postfiles.pstatic.net/b.jpg?type=w466" alt="b" />
    </div></div>`;
  const r6 = convertSmartEditor(stripHtml);
  assert.equal(r6.imageUrls.length, 2, "se-imageStrip collects every img");
  assert.ok(
    r6.imageUrls[0]!.includes("a.jpg") && r6.imageUrls[1]!.includes("b.jpg"),
    "strip image urls captured in order"
  );
  assert.ok(
    /!\[[^\]]*\]\(__IMAGE_0__\)[\s\S]*!\[[^\]]*\]\(__IMAGE_1__\)/.test(
      r6.mdxBody
    ),
    "strip emits one token per image"
  );

  // horizontal line -> markdown hr (no warning)
  const hrHtml = `<div class="se-main-container">
    <div class="se-component se-horizontalLine"><div class="se-module">​</div></div></div>`;
  const r7 = convertSmartEditor(hrHtml);
  assert.ok(r7.mdxBody.includes("---"), "se-horizontalLine -> ---");
  assert.equal(
    r7.warnings.length,
    0,
    "horizontalLine is supported (no warning)"
  );

  // unsupported widget -> warning, not crash
  const mapHtml = `<div class="se-main-container">
    <div class="se-component se-map"><div class="se-module se-module-map">지도</div></div></div>`;
  const r5 = convertSmartEditor(mapHtml);
  assert.ok(
    r5.warnings.some((w) => w.includes("se-map")),
    "unsupported widget logs a warning"
  );

  console.log("naver-convert.test: 13 assertions passed.");
})().catch((err) => {
  console.error("naver-convert.test FAILED:", err);
  process.exit(1);
});
