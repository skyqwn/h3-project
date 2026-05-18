import { getAllPosts } from "@/lib/posts";
import { SITE_URL, BRAND_NAME } from "@/lib/seo";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET() {
  const posts = (await getAllPosts("en")).slice(0, 20);
  const items = posts
    .map(
      (p) => `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${SITE_URL}/en/blog/${p.slug}</link>
      <guid>${SITE_URL}/en/blog/${p.slug}</guid>
      <description>${escapeXml(p.summary)}</description>
      <pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>
    </item>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(BRAND_NAME)} Blog</title>
    <link>${SITE_URL}/en/blog</link>
    <description>News and stories from H3</description>
    <language>en-US</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
