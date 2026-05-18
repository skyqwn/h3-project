import type { NaverMigrateEntry } from "./types";

// Add one entry per Naver post to migrate. Run with:
//   pnpm run migrate:naver
// Generated posts land as draft:true — proofread each
// content/posts/<slug>.ko.mdx, then flip draft:false and commit.
// Do NOT re-run after editing generated files (it overwrites them).
export const manifest: NaverMigrateEntry[] = [
  {
    url: "https://blog.naver.com/es_h3/224232524997",
    slug: "gold-refining-pvc-pp-fumehood-scrubber-duct",
    category: "article",
    tags: ["흄후드", "스크러버", "배기배관", "PVC", "PP"],
  },
];
