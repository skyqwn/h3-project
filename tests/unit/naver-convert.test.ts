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

  // se-quotation.se-l-quotation_line -> ## heading (Naver uses these as
  // section titles, NOT as quotes)
  const headingHtml = `<div class="se-main-container">
    <div class="se-component se-quotation se-l-quotation_line"><div class="se-module se-module-text">
      <p class="se-text-paragraph">작업 현장 레이아웃 작성</p>
    </div></div></div>`;
  const r3 = convertSmartEditor(headingHtml);
  assert.ok(
    r3.mdxBody.split("\n").some((l) => l === "## 작업 현장 레이아웃 작성"),
    "se-quotation.se-l-quotation_line -> ## heading"
  );
  assert.ok(
    !r3.mdxBody.includes("> 작업 현장"),
    "quotation_line is NOT emitted as a blockquote"
  );

  // se-quotation (other layouts, e.g. se-l-default) -> > blockquote callout
  const calloutHtml = `<div class="se-main-container">
    <div class="se-component se-quotation se-l-default"><div class="se-module se-module-text">
      <p class="se-text-paragraph">💡 팁: PVC는 내화학성이 뛰어납니다.</p>
    </div></div></div>`;
  const r3b = convertSmartEditor(calloutHtml);
  assert.ok(
    r3b.mdxBody
      .split("\n")
      .some((l) => l.startsWith("> 💡 팁: PVC는 내화학성이 뛰어납니다.")),
    "se-quotation.se-l-default -> > blockquote"
  );
  assert.ok(
    !r3b.mdxBody.includes("## "),
    "a default-layout quotation is NOT a heading"
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

  // se-table -> GFM markdown table (first row is the header)
  const tableHtml = `<div class="se-main-container">
    <div class="se-component se-table"><div class="se-module">
      <table><tbody>
        <tr><td class="se-cell">약품 이름</td><td class="se-cell">주요 역할</td></tr>
        <tr><td class="se-cell">왕수</td><td class="se-cell">금을 녹임</td></tr>
      </tbody></table>
    </div></div></div>`;
  const r8 = convertSmartEditor(tableHtml);
  const tlines = r8.mdxBody.split("\n");
  assert.ok(
    tlines.some((l) => l === "| 약품 이름 | 주요 역할 |"),
    "se-table header row -> markdown table header"
  );
  assert.ok(
    tlines.some((l) => /^\|\s*---\s*\|\s*---\s*\|$/.test(l)),
    "se-table emits a GFM delimiter row"
  );
  assert.ok(
    tlines.some((l) => l === "| 왕수 | 금을 녹임 |"),
    "se-table data row -> markdown table row"
  );
  assert.equal(
    r8.warnings.length,
    0,
    "se-table is supported (no warning)"
  );

  // se-table cell containing a pipe is escaped so it doesn't break the table
  const pipeTableHtml = `<div class="se-main-container">
    <div class="se-component se-table"><div class="se-module">
      <table><tbody>
        <tr><td class="se-cell">A</td><td class="se-cell">B</td></tr>
        <tr><td class="se-cell">x|y</td><td class="se-cell">z</td></tr>
      </tbody></table>
    </div></div></div>`;
  const r9 = convertSmartEditor(pipeTableHtml);
  assert.ok(
    r9.mdxBody.includes("x\\|y"),
    "pipe inside a table cell is escaped"
  );

  // se-horizontalLine -> dropped entirely (no --- noise, no warning)
  const hrHtml = `<div class="se-main-container">
    <div class="se-component se-horizontalLine"><div class="se-module">​</div></div></div>`;
  const r7 = convertSmartEditor(hrHtml);
  assert.ok(
    !r7.mdxBody.includes("---"),
    "se-horizontalLine is dropped (no --- separators)"
  );
  assert.equal(
    r7.warnings.length,
    0,
    "horizontalLine is recognized (no warning)"
  );

  // zero-width characters are stripped from text
  const zwHtml = `<div class="se-main-container">
    <div class="se-component se-text"><div class="se-module se-module-text">
      <p class="se-text-paragraph">​깨끗한​ 문장﻿</p>
    </div></div></div>`;
  const rzw = convertSmartEditor(zwHtml);
  assert.ok(
    rzw.mdxBody.includes("깨끗한 문장"),
    "text content survives zero-width stripping"
  );
  assert.ok(
    !/[​‌‍﻿]/.test(rzw.mdxBody),
    "no zero-width characters remain in output"
  );

  // unsupported widget -> warning, not crash
  const stickerHtml = `<div class="se-main-container">
    <div class="se-component se-sticker"><div class="se-module se-module-sticker">스티커</div></div></div>`;
  const r5 = convertSmartEditor(stickerHtml);
  assert.ok(
    r5.warnings.some((w) => w.includes("se-sticker")),
    "unsupported widget logs a warning"
  );

  console.log("naver-convert.test: 21 assertions passed.");
})().catch((err) => {
  console.error("naver-convert.test FAILED:", err);
  process.exit(1);
});
