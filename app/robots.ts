import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  // Vercel sets VERCEL_ENV to 'production' on the main branch deployment,
  // 'preview' on PR previews, 'development' locally. We index only in
  // production so previews don't compete for ranking.
  const isProd = process.env.VERCEL_ENV === "production";

  return {
    rules: isProd
      ? [
          {
            userAgent: "*",
            allow: "/",
            disallow: ["/api/"],
          },
        ]
      : [{ userAgent: "*", disallow: "/" }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
