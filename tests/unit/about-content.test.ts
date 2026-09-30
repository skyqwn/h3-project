import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { pageMetadata, organizationJsonLd } from "../../lib/seo";

for (const locale of ["ko", "en"] as const) {
  const messages = JSON.parse(readFileSync(`messages/${locale}.json`, "utf8"));
  assert.doesNotMatch(JSON.stringify(messages), /[\u2014\u3161]/);
  assert.match(messages.about.domains.items.ax.tag, locale === "ko" ? /개발/ : /development/i);
  assert.equal(Object.keys(messages.about.faq).filter(k => !["title", "eyebrow"].includes(k)).length, 4);
  assert.doesNotMatch(JSON.stringify(messages.about), /20%|ISO 9001|15곳|4곳/);
  const meta = pageMetadata({ locale, path: "/about", ...messages.about.meta });
  assert.equal(meta.title, `${messages.about.meta.title} | H3Tech`);
  assert.equal(meta.description, messages.about.meta.description);
  assert.equal(organizationJsonLd({
    phone: "032-000-0000", email: "test@example.com", address: "Test",
    description: messages.about.meta.description,
  }).description, meta.description);
}

// Inspect executable string/JSX content, not punctuation in developer comments.
function inspect(directory: string) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) { inspect(path); continue; }
    if (!/\.tsx?$/.test(path)) continue;
    const source = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true);
    function visit(node: ts.Node) {
      if (ts.isStringLiteralLike(node) || ts.isJsxText(node) ||
        node.kind === ts.SyntaxKind.TemplateHead || node.kind === ts.SyntaxKind.TemplateMiddle ||
        node.kind === ts.SyntaxKind.TemplateTail) {
        assert.doesNotMatch(node.getText(source), /[\u2014\u3161]/, `Long dash in ${path}`);
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
}
for (const directory of ["app", "components", "lib"]) inspect(directory);
for (const image of ["feature-site.jpg", "feature-fabrication.jpg"]) {
  assert.ok(existsSync(join("public", image)));
}
console.log("About content, metadata, and static copy checks passed.");
