import fs from "node:fs/promises";
import path from "node:path";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function extFromContentType(ct: string | null, url: string): string {
  if (ct?.includes("png")) return "png";
  if (ct?.includes("gif")) return "gif";
  if (ct?.includes("webp")) return "webp";
  if (ct?.includes("jpeg") || ct?.includes("jpg")) return "jpg";
  const m = url.match(/\.(png|gif|webp|jpe?g)(?:[?#]|$)/i);
  return m ? m[1]!.toLowerCase().replace("jpeg", "jpg") : "jpg";
}

/**
 * Download each URL (Referer defeats Naver hotlink protection) into
 * public/blog/<slug>/<n>.<ext>. Returns the local web paths in order.
 */
export async function rehostImages(
  slug: string,
  imageUrls: string[]
): Promise<{ localPaths: string[]; warnings: string[] }> {
  const destDir = path.join(process.cwd(), "public", "blog", slug);
  await fs.mkdir(destDir, { recursive: true });

  const localPaths: string[] = [];
  const warnings: string[] = [];

  for (let i = 0; i < imageUrls.length; i++) {
    const src = imageUrls[i]!.replace(/\?type=w\d+.*$/, ""); // original res
    try {
      const res = await fetch(src, {
        headers: { "User-Agent": UA, Referer: "https://blog.naver.com" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const ext = extFromContentType(res.headers.get("content-type"), src);
      const buf = Buffer.from(await res.arrayBuffer());
      const file = `${i + 1}.${ext}`;
      await fs.writeFile(path.join(destDir, file), buf);
      localPaths.push(`/blog/${slug}/${file}`);
    } catch (e) {
      warnings.push(
        `image ${i} (${src}) failed: ${(e as Error).message} — fix manually`
      );
      localPaths.push(`/blog/${slug}/missing-${i + 1}`);
    }
  }

  return { localPaths, warnings };
}
