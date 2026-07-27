import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";
import { getAllPosts } from "@/lib/posts";
import { SITE_URL, BRAND_NAME } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";

// Escape a plain-text value for use inside an XML text node / attribute.
function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Root-relative asset/link paths (src="/..", href="/..") must become absolute
// in a feed — Naver requires every URL in the feed to live on the verified
// domain, and feed readers can't resolve site-relative paths.
function absolutizeUrls(html: string): string {
  return html.replace(/(src|href)="\/(?!\/)/g, `$1="${SITE_URL}/`);
}

// Wrap already-serialized HTML for a CDATA section, neutralizing any literal
// "]]>" so it can't close the section early.
function cdata(html: string): string {
  return `<![CDATA[${html.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

const markdownProcessor = remark().use(remarkGfm).use(remarkHtml);

async function markdownToHtml(markdown: string): Promise<string> {
  const file = await markdownProcessor.process(markdown);
  return absolutizeUrls(String(file));
}

type Channel = {
  base: string; // absolute blog index URL, e.g. https://.../blog or https://.../en/blog
  title: string;
  description: string;
  language: string;
};

function channelFor(locale: Locale): Channel {
  return locale === "ko"
    ? {
        base: `${SITE_URL}/blog`,
        title: `${BRAND_NAME} 블로그`,
        description: "H3의 소식과 이야기",
        language: "ko-KR",
      }
    : {
        base: `${SITE_URL}/en/blog`,
        title: `${BRAND_NAME} Blog`,
        description: "News and stories from H3",
        language: "en-US",
      };
}

// Build a full RSS 2.0 feed for a locale. Each item carries the post summary in
// <description> AND the full rendered body (with images) in <content:encoded>,
// which is the shape Naver's Search Advisor recommends ("full body including
// image links"). Images/links are absolutized to the verified domain.
export async function buildRssXml(locale: Locale): Promise<string> {
  const ch = channelFor(locale);
  const posts = (await getAllPosts(locale)).slice(0, 20);

  const items = await Promise.all(
    posts.map(async (p) => {
      const url = `${ch.base}/${p.slug}`;
      const bodyHtml = await markdownToHtml(p.body);
      const coverAbs = absolutizeUrls(`src="${p.coverImage}"`).slice(5, -1);
      // Prepend the cover image only when the body doesn't already show it, so
      // posts without an inline lead image still carry a representative image.
      const lead = bodyHtml.includes(coverAbs)
        ? ""
        : `<p><img src="${coverAbs}" alt="${escapeXml(p.title)}" /></p>`;
      const contentHtml = lead + bodyHtml;

      return `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(p.summary)}</description>
      <content:encoded>${cdata(contentHtml)}</content:encoded>
      <pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>
    </item>`;
    })
  );

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(ch.title)}</title>
    <link>${ch.base}</link>
    <description>${escapeXml(ch.description)}</description>
    <language>${ch.language}</language>
${items.join("\n")}
  </channel>
</rss>`;
}
