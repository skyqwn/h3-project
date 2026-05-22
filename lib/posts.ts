import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import { routing, type Locale } from "@/i18n/routing";

// gray-matter parses an unquoted YAML date (publishedAt: 2026-05-18) into a
// JS Date. Normalize Date|string -> "YYYY-MM-DD" so authors don't have to
// remember to quote dates and the string-compare sort stays valid.
const DateString = z.preprocess(
  (v) =>
    v instanceof Date ? v.toISOString().slice(0, 10) : v,
  z.string().min(1)
);

const PostFrontmatterSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  coverImage: z.string().min(1),
  category: z.enum(["news", "article", "update"]),
  tags: z.array(z.string()).default([]),
  publishedAt: DateString,
  updatedAt: DateString.optional(),
  author: z.string().default("H3"),
  draft: z.boolean().default(false),
  source: z.string().optional(),
  sourceUrl: z.string().optional(),
  aiGenerated: z.boolean().default(false),
});

export type PostFrontmatter = z.infer<typeof PostFrontmatterSchema>;
export type PostCategory = PostFrontmatter["category"];

export type Post = PostFrontmatter & {
  slug: string;
  locale: Locale;
  body: string;
};

const CONTENT_DIR = path.join(process.cwd(), "content", "posts");

async function readContentDir(): Promise<string[]> {
  try {
    return await fs.readdir(CONTENT_DIR);
  } catch {
    return [];
  }
}

function parseFilename(
  filename: string
): { slug: string; locale: Locale } | null {
  const m = filename.match(/^(.+)\.(ko|en)\.mdx$/);
  if (!m) return null;
  return { slug: m[1]!, locale: m[2] as Locale };
}

async function loadFile(slug: string, locale: Locale): Promise<Post> {
  const raw = await fs.readFile(
    path.join(CONTENT_DIR, `${slug}.${locale}.mdx`),
    "utf8"
  );
  const { data, content } = matter(raw);
  const fm = PostFrontmatterSchema.parse(data);
  return { ...fm, slug, locale, body: content };
}

export async function getAllPosts(locale: Locale): Promise<Post[]> {
  const files = await readContentDir();
  // Collect which locales each slug actually has a file for.
  const localesBySlug = new Map<string, Set<Locale>>();
  for (const file of files) {
    const parsed = parseFilename(file);
    if (!parsed) continue;
    const set = localesBySlug.get(parsed.slug) ?? new Set<Locale>();
    set.add(parsed.locale);
    localesBySlug.set(parsed.slug, set);
  }

  const posts: Post[] = [];
  for (const [slug, locales] of localesBySlug) {
    // Prefer the requested locale; fall back to the default locale so the
    // blog shows the same posts in every locale even without a translation.
    const fileLocale = locales.has(locale)
      ? locale
      : locales.has(routing.defaultLocale)
        ? routing.defaultLocale
        : [...locales][0];
    if (!fileLocale) continue;
    const post = await loadFile(slug, fileLocale);
    if (post.draft && process.env.NODE_ENV === "production") continue;
    // Keep the requested locale for routing; body may be the fallback's.
    posts.push({ ...post, locale });
  }
  // publishedAt is ISO (YYYY-MM-DD…) so string compare = chronological
  return posts.sort((a, b) =>
    a.publishedAt < b.publishedAt ? 1 : a.publishedAt > b.publishedAt ? -1 : 0
  );
}

export async function getPost(slug: string, locale: Locale): Promise<Post> {
  try {
    return await loadFile(slug, locale);
  } catch {
    // Missing translation: serve the default-locale content, keep the
    // requested locale so links/routing stay in that locale.
    const post = await loadFile(slug, routing.defaultLocale);
    return { ...post, locale };
  }
}

export async function getAllPostSlugs(): Promise<string[]> {
  const files = await readContentDir();
  const slugs = new Set<string>();
  for (const f of files) {
    const parsed = parseFilename(f);
    if (parsed) slugs.add(parsed.slug);
  }
  return [...slugs];
}

export async function getAllTags(locale: Locale): Promise<string[]> {
  const posts = await getAllPosts(locale);
  return [...new Set(posts.flatMap((p) => p.tags))];
}

export async function getAllCategories(
  locale: Locale
): Promise<PostCategory[]> {
  const posts = await getAllPosts(locale);
  return [...new Set(posts.map((p) => p.category))];
}

export async function getPostsByTag(
  tag: string,
  locale: Locale
): Promise<Post[]> {
  return (await getAllPosts(locale)).filter((p) => p.tags.includes(tag));
}

export async function getPostsByCategory(
  category: string,
  locale: Locale
): Promise<Post[]> {
  return (await getAllPosts(locale)).filter((p) => p.category === category);
}
