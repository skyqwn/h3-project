import fs from "node:fs/promises";
import path from "node:path";
import { manifest } from "./manifest";
import { fetchNaverPost } from "./fetch";
import { convertSmartEditor } from "./convert";
import { rehostImages } from "./images";

function yamlString(s: string): string {
  // quote + escape for a YAML double-quoted scalar
  return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

async function processEntry(
  entry: (typeof manifest)[number]
): Promise<void> {
  const warnings: string[] = [];
  const post = await fetchNaverPost(entry.url);
  const {
    mdxBody,
    imageUrls,
    warnings: cw,
  } = convertSmartEditor(post.html);
  warnings.push(...cw);

  const { localPaths, warnings: iw } = await rehostImages(
    entry.slug,
    imageUrls
  );
  warnings.push(...iw);

  // rewrite __IMAGE_n__ tokens to local re-hosted paths
  let body = mdxBody;
  localPaths.forEach((p, i) => {
    body = body.split(`__IMAGE_${i}__`).join(p);
  });

  const coverImage = localPaths[0] ?? `/blog/${entry.slug}/cover.jpg`;
  if (localPaths.length === 0) {
    warnings.push(
      "no images in post — coverImage set to a conventional missing " +
        "path (SP1 gradient covers it); add a real cover in proofread"
    );
  }

  const publishedAt =
    entry.publishedAt ?? post.publishedAt ?? todayISO();
  if (!entry.publishedAt && !post.publishedAt) {
    warnings.push(
      `could not parse publish date — defaulted to ${publishedAt}`
    );
  }

  const frontmatter = [
    "---",
    `title: ${yamlString(post.title)}`,
    `summary: ${yamlString(post.summary || post.title)}`,
    `coverImage: ${yamlString(coverImage)}`,
    `category: ${entry.category}`,
    `tags: [${entry.tags.map(yamlString).join(", ")}]`,
    `publishedAt: ${yamlString(publishedAt)}`,
    `author: "H3"`,
    `source: "naver"`,
    `sourceUrl: ${yamlString(entry.url)}`,
    `draft: true`,
    "---",
    "",
  ].join("\n");

  const dest = path.join(
    process.cwd(),
    "content",
    "posts",
    `${entry.slug}.ko.mdx`
  );
  await fs.writeFile(dest, frontmatter + body, "utf8");

  console.log(`\n✔ ${entry.slug}`);
  console.log(`  title: ${post.title}`);
  console.log(`  images: ${localPaths.length}`);
  console.log(`  -> ${path.relative(process.cwd(), dest)} (draft:true)`);
  if (warnings.length) {
    console.log(`  ⚠ ${warnings.length} warning(s):`);
    for (const w of warnings) console.log(`    - ${w}`);
  }
}

(async () => {
  console.log(`naver-migrate: ${manifest.length} entr(y/ies)`);
  for (const entry of manifest) {
    try {
      await processEntry(entry);
    } catch (e) {
      console.error(`✘ ${entry.slug}: ${(e as Error).message}`);
      process.exitCode = 1;
    }
  }
  console.log(
    "\nDone. Proofread each content/posts/<slug>.ko.mdx, flip " +
      "draft:false, run pnpm build, then commit. Do NOT re-run after editing."
  );
})();
