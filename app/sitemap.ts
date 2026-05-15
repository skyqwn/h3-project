import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { getAllProductSlugs } from "@/lib/mdx";
import { routing } from "@/i18n/routing";

const STATIC_PATHS = ["", "/about", "/products", "/contact"] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getAllProductSlugs();
  const productPaths = slugs.map((slug) => `/products/${slug}`);
  const allPaths = [...STATIC_PATHS, ...productPaths];

  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const path of allPaths) {
    // Korean URLs sit at the root, English at /en.
    const koUrl = `${SITE_URL}${path}`;
    const enUrl = `${SITE_URL}/en${path === "" ? "" : path}`;
    const alternates = {
      languages: {
        "ko-KR": koUrl,
        "en-US": enUrl,
        "x-default": koUrl,
      },
    };

    entries.push({
      url: koUrl,
      lastModified: now,
      changeFrequency: path === "" ? "weekly" : "monthly",
      priority: path === "" ? 1.0 : path === "/products" ? 0.9 : 0.7,
      alternates,
    });
    entries.push({
      url: enUrl,
      lastModified: now,
      changeFrequency: path === "" ? "weekly" : "monthly",
      priority: path === "" ? 1.0 : path === "/products" ? 0.9 : 0.7,
      alternates,
    });
  }

  return entries;
}

// Reference routing so the import isn't flagged unused — kept for type
// safety even though the path enumeration above is locale-agnostic.
void routing;
