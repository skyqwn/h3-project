import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Without this, Next treats this route as static (no dynamic APIs used) and
// only regenerates it on deploy — new/published posts wouldn't show up in
// the sitemap until the next deploy even though revalidateTag("posts")
// invalidates the inner getAllPosts() data cache. Confirmed stale in
// production (2026-09-12): x-vercel-cache: HIT on a day-old snapshot missing
// a post published hours earlier.
export const dynamic = "force-dynamic";
import { getAllProductSlugs } from "@/lib/mdx";
import { getNotices } from "@/lib/notices";
import {
  getAllPosts,
  getAllTags,
  getAllCategories,
  getPostsByCategory,
} from "@/lib/posts";
import { PAGE_SIZE } from "@/lib/blog-pagination";
import { routing } from "@/i18n/routing";

const STATIC_PATHS = [
  "",
  "/about",
  "/about/history",
  "/about/location",
  "/products",
  "/contact",
  "/notice",
  "/news",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getAllProductSlugs();
  const productPaths = slugs.map((slug) => `/products/${slug}`);
  const noticePaths = getNotices().map((n) => `/notice/${n.id}`);
  const allPaths = [...STATIC_PATHS, ...productPaths, ...noticePaths];

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

  // --- Blog (per-locale via getAllPosts: excludes drafts in prod and
  // never emits an /en URL for a KO-only post) ---
  for (const loc of routing.locales) {
    const base = loc === "ko" ? SITE_URL : `${SITE_URL}/en`;
    for (const post of await getAllPosts(loc)) {
      entries.push({
        url: `${base}/blog/${post.slug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  }
  for (const loc of routing.locales) {
    const base = loc === "ko" ? SITE_URL : `${SITE_URL}/en`;
    const localePosts = await getAllPosts(loc);
    const totalPages = Math.max(
      1,
      Math.ceil(localePosts.length / PAGE_SIZE)
    );
    entries.push({
      url: `${base}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    });
    for (let p = 2; p <= totalPages; p++) {
      entries.push({
        url: `${base}/blog/page/${p}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
    for (const tag of await getAllTags(loc)) {
      entries.push({
        url: `${base}/blog/tag/${encodeURIComponent(tag)}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }
    // "news" moved to the top-level /news route (see STATIC_PATHS above).
    for (const cat of await getAllCategories(loc)) {
      if (cat === "news") continue;
      entries.push({
        url: `${base}/blog/category/${cat}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }

    const newsPosts = await getPostsByCategory("news", loc);
    const newsTotalPages = Math.max(1, Math.ceil(newsPosts.length / PAGE_SIZE));
    for (let p = 2; p <= newsTotalPages; p++) {
      entries.push({
        url: `${base}/news/page/${p}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }
  }

  return entries;
}
