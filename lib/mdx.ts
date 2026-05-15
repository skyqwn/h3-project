import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import type { Locale } from "@/i18n/routing";

const ProductFrontmatterSchema = z.object({
  title: z.string().min(1),
  tagline: z.string().min(1),
  hero_image: z.string().min(1),
  gallery: z.array(z.string()).optional(),
  specs: z
    .array(z.object({ label: z.string(), value: z.string() }))
    .optional(),
  order: z.number().int(),
  draft: z.boolean().default(false),
});

export type ProductFrontmatter = z.infer<typeof ProductFrontmatterSchema>;

export type Product = ProductFrontmatter & {
  slug: string;
  locale: Locale;
  body: string;
};

const CONTENT_DIR = path.join(process.cwd(), "content", "products");

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

async function loadFile(
  slug: string,
  locale: Locale
): Promise<Product> {
  const filename = `${slug}.${locale}.mdx`;
  const raw = await fs.readFile(path.join(CONTENT_DIR, filename), "utf8");
  const { data, content } = matter(raw);
  const frontmatter = ProductFrontmatterSchema.parse(data);
  return { ...frontmatter, slug, locale, body: content };
}

/**
 * Loads every product file for the given locale, drops drafts in production
 * builds, and sorts by frontmatter `order` ascending.
 */
export async function getAllProducts(locale: Locale): Promise<Product[]> {
  const files = await readContentDir();
  const products: Product[] = [];
  for (const file of files) {
    const parsed = parseFilename(file);
    if (!parsed || parsed.locale !== locale) continue;
    const product = await loadFile(parsed.slug, parsed.locale);
    if (product.draft && process.env.NODE_ENV === "production") continue;
    products.push(product);
  }
  return products.sort((a, b) => a.order - b.order);
}

export async function getProduct(slug: string, locale: Locale): Promise<Product> {
  return loadFile(slug, locale);
}

/**
 * Unique slug set across all locales — used by generateStaticParams and
 * sitemap to enumerate every product route.
 */
export async function getAllProductSlugs(): Promise<string[]> {
  const files = await readContentDir();
  const slugs = new Set<string>();
  for (const file of files) {
    const parsed = parseFilename(file);
    if (parsed) slugs.add(parsed.slug);
  }
  return [...slugs];
}
