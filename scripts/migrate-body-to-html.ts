import { readFileSync } from "node:fs";
import { join } from "node:path";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";
import { imageSize } from "image-size";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { sanitizeBody, looksLikeHtml } from "@/lib/html/sanitize";

const md = remark().use(remarkGfm).use(remarkHtml);

// 로컬(/blog/..) 이미지의 실제 치수를 public/에서 측정해 width/height 부여.
// ?w&h 쿼리가 있으면 그걸 사용. 원격/측정 불가면 속성 없이 둔다(렌더 안전망).
function addImgDims(html: string): string {
  return html.replace(/<img\b[^>]*>/g, (tag) => {
    if (/\bwidth=/.test(tag)) return tag;
    const src = tag.match(/src="([^"]+)"/)?.[1];
    if (!src) return tag;
    const q = src.match(/[?&]w=(\d+)&h=(\d+)/);
    if (q) return tag.replace(/\/?>$/, ` width="${q[1]}" height="${q[2]}">`);
    if (src.startsWith("/")) {
      try {
        const rel = src.split("?")[0] ?? src;
        const buf = readFileSync(join(process.cwd(), "public", rel));
        const { width, height } = imageSize(buf);
        if (width && height) {
          return tag.replace(/\/?>$/, ` width="${width}" height="${height}">`);
        }
      } catch {
        // 파일 없거나 측정 불가 → 속성 없이 둔다
      }
    }
    return tag;
  });
}

async function main() {
  const rows = await db.select().from(posts);
  let n = 0;
  for (const r of rows) {
    if (looksLikeHtml(r.body)) {
      console.log("건너뜀(이미 HTML):", r.slug);
      continue;
    }
    const html = String(await md.process(r.body));
    const clean = sanitizeBody(addImgDims(html));
    await db.update(posts).set({ body: clean }).where(eq(posts.id, r.id));
    console.log("이관:", r.slug);
    n++;
  }
  console.log("완료:", n, "건");
}

main();
