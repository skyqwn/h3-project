import { buildRssXml } from "@/lib/rss";

// See app/sitemap.ts for why this is needed — same static-caching staleness risk.
export const dynamic = "force-dynamic";

export async function GET() {
  const xml = await buildRssXml("en");
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
