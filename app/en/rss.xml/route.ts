import { buildRssXml } from "@/lib/rss";

export async function GET() {
  const xml = await buildRssXml("en");
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
