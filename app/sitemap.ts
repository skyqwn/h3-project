import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { getAllProductSlugs } from "@/lib/mdx";
import {
  getAllPosts,
  getAllTags,
  getAllCategories,
} from "@/lib/posts";
import { PAGE_SIZE } from "@/lib/blog-pagination";
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
    for (const cat of await getAllCategories(loc)) {
      entries.push({
        url: `${base}/blog/category/${cat}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }
  }

  return entries;
}
