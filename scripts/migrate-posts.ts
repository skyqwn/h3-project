import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";

const DIR = path.join(process.cwd(), "content", "posts");

function toDateString(v: unknown): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).slice(0, 10);
}

async function main() {
  const files = (await fs.readdir(DIR)).filter((f) => f.endsWith(".ko.mdx"));
  for (const file of files) {
    const slug = file.replace(/\.ko\.mdx$/, "");
    const raw = await fs.readFile(path.join(DIR, file), "utf8");
    const { data, content } = matter(raw);
    await db
      .insert(posts)
      .values({
        slug,
        title: data.title,
        summary: data.summary,
        coverImage: data.coverImage,
        category: data.category,
        tags: data.tags ?? [],
        body: content,
        author: data.author ?? "H3",
        draft: data.draft ?? false,
        publishedAt: toDateString(data.publishedAt),
        source: data.source ?? null,
        sourceUrl: data.sourceUrl ?? null,
        aiGenerated: data.aiGenerated ?? false,
      })
      .onConflictDoNothing({ target: posts.slug });
    console.log(`이관: ${slug}`);
  }
  console.log("완료");
}

main().then(() => process.exit(0));
