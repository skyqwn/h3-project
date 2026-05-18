import fs from "node:fs";
import path from "node:path";

/**
 * Rehype plugin: for every <img> with a site-local src (e.g.
 * "/blog/<slug>/3.jpg") that has no width/height, read the real pixel
 * dimensions from the file in `public/` and set them on the node.
 *
 * Why: lazy <img> with no intrinsic size occupies ~0px until its bytes
 * arrive, then snaps to full height. On a Lenis smooth-scrolled page that
 * 6000px+ layout shift fights the scroll interpolation (the post "scrolls
 * down then stalls"), and it is catastrophic CLS for SEO. width+height
 * attributes let the browser reserve the correct box before load.
 *
 * Runs server-side during RSC render / static generation, so the fs reads
 * happen at build time for statically generated pages. No dependency.
 */

type HastNode = {
  type?: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

/** Minimal image header sniffer: PNG, JPEG, GIF, WebP (VP8/VP8L/VP8X). */
function readDimensions(
  buf: Buffer
): { width: number; height: number } | null {
  // PNG: 8-byte sig, IHDR width/height at offset 16/20
  if (buf.length > 24 && buf[0] === 0x89 && buf[1] === 0x50) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  // GIF: logical screen width/height at offset 6/8 (LE)
  if (
    buf.length > 10 &&
    buf[0] === 0x47 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46
  ) {
    return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
  }
  // JPEG: scan SOF0..SOFn markers (skip C4/C8/CC)
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let o = 2;
    while (o + 9 < buf.length) {
      if (buf[o] !== 0xff) {
        o++;
        continue;
      }
      const marker = buf[o + 1]!;
      if (
        marker >= 0xc0 &&
        marker <= 0xcf &&
        marker !== 0xc4 &&
        marker !== 0xc8 &&
        marker !== 0xcc
      ) {
        return {
          height: buf.readUInt16BE(o + 5),
          width: buf.readUInt16BE(o + 7),
        };
      }
      o += 2 + buf.readUInt16BE(o + 2);
    }
  }
  // WebP: RIFF....WEBP
  if (
    buf.length > 30 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  ) {
    const fmt = buf.toString("ascii", 12, 16);
    if (fmt === "VP8 ") {
      return {
        width: buf.readUInt16LE(26) & 0x3fff,
        height: buf.readUInt16LE(28) & 0x3fff,
      };
    }
    if (fmt === "VP8L") {
      const b = buf.readUInt32LE(21);
      return {
        width: (b & 0x3fff) + 1,
        height: ((b >> 14) & 0x3fff) + 1,
      };
    }
    if (fmt === "VP8X") {
      return {
        width: (buf.readUIntLE(24, 3) & 0xffffff) + 1,
        height: (buf.readUIntLE(27, 3) & 0xffffff) + 1,
      };
    }
  }
  return null;
}

const dimCache = new Map<string, { width: number; height: number } | null>();

function dimsFor(src: string): { width: number; height: number } | null {
  if (dimCache.has(src)) return dimCache.get(src)!;
  let result: { width: number; height: number } | null = null;
  try {
    const rel = src.replace(/^\//, "").split(/[?#]/)[0]!;
    const file = path.join(process.cwd(), "public", rel);
    result = readDimensions(fs.readFileSync(file));
  } catch {
    result = null;
  }
  dimCache.set(src, result);
  return result;
}

export function rehypeImageDimensions() {
  return (tree: HastNode) => {
    const walk = (node: HastNode): void => {
      if (node.tagName === "img" && node.properties) {
        const p = node.properties;
        const src = typeof p.src === "string" ? p.src : "";
        const hasDim =
          p.width != null ||
          p.height != null ||
          (typeof p.style === "string" && /aspect-ratio/.test(p.style));
        if (src.startsWith("/") && !hasDim) {
          const d = dimsFor(src);
          if (d) {
            p.width = d.width;
            p.height = d.height;
          }
        }
      }
      node.children?.forEach(walk);
    };
    walk(tree);
  };
}
