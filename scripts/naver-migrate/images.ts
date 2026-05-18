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

// Naver's postfiles CDN serves a ~100px micro-thumb when the URL has NO
// ?type= param (stripping it was the bug behind "화질이 다 깨진다"). The
// readable renditions are a fixed set: w773 / w966 / w2000 / w3840 (no
// in-between). w966 is the sweet spot — ~1:1 for our ~752px reading
// column (crisp, no pixelation) while keeping the page light; w3840
// originals are 2-3 MB each (34 MB/post). w773 is the 404 fallback.
const TYPE_LADDER = ["w966", "w773"] as const;

function withType(url: string, type: string): string {
  const base = url.replace(/[?#].*$/, "");
  return `${base}?type=${type}`;
}

/**
 * Download each URL at the highest available resolution (Referer defeats
 * Naver hotlink protection) into public/blog/<slug>/<n>.<ext>. Returns
 * the local web paths in order.
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
    const original = imageUrls[i]!;
    let saved = false;
    let lastErr = "no rendition succeeded";

    for (const type of TYPE_LADDER) {
      const src = withType(original, type);
      try {
        const res = await fetch(src, {
          headers: { "User-Agent": UA, Referer: "https://blog.naver.com" },
        });
        if (!res.ok) {
          lastErr = `HTTP ${res.status}`;
          continue;
        }
        const ext = extFromContentType(
          res.headers.get("content-type"),
          src
        );
        const buf = Buffer.from(await res.arrayBuffer());
        const file = `${i + 1}.${ext}`;
        await fs.writeFile(path.join(destDir, file), buf);
        localPaths.push(`/blog/${slug}/${file}`);
        saved = true;
        break;
      } catch (e) {
        lastErr = (e as Error).message;
      }
    }

    if (!saved) {
      warnings.push(
        `image ${i} (${original}) failed: ${lastErr} — fix manually`
      );
      localPaths.push(`/blog/${slug}/missing-${i + 1}`);
    }
  }

  return { localPaths, warnings };
}
