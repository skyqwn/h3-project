const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export type FetchedPost = {
  html: string;
  title: string;
  summary: string;
  /** ISO date if parseable from the post, else null */
  publishedAt: string | null;
};

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&middot;/g, "·")
    .replace(/&nbsp;/g, " ");
}

function meta(html: string, prop: string): string {
  const m = html.match(
    new RegExp(`<meta property="${prop}" content="([^"]*)"`)
  );
  return m ? decodeEntities(m[1]!).trim() : "";
}

/** blog.naver.com/<blogId>/<logNo> -> PostView.naver URL */
export function toPostViewUrl(url: string): string {
  const m = url.match(/blog\.naver\.com\/([^/?#]+)\/(\d+)/);
  if (!m) throw new Error(`cannot parse blogId/logNo from: ${url}`);
  const [, blogId, logNo] = m;
  return `https://blog.naver.com/PostView.naver?blogId=${blogId}&logNo=${logNo}`;
}

export async function fetchNaverPost(url: string): Promise<FetchedPost> {
  const res = await fetch(toPostViewUrl(url), {
    headers: { "User-Agent": UA },
  });
  if (!res.ok) {
    throw new Error(`fetch failed ${res.status} for ${url}`);
  }
  const html = await res.text();

  // Naver renders the publish date as e.g. "2026. 5. 18." — best-effort.
  let publishedAt: string | null = null;
  const dateM = html.match(/(\d{4})\.\s?(\d{1,2})\.\s?(\d{1,2})\.?/);
  if (dateM) {
    const [, y, mo, d] = dateM;
    publishedAt = `${y}-${mo!.padStart(2, "0")}-${d!.padStart(2, "0")}`;
  }

  return {
    html,
    title: meta(html, "og:title") || "(untitled)",
    summary: meta(html, "og:description").slice(0, 160),
    publishedAt,
  };
}
