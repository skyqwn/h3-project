import type { NaverMigrateEntry } from "./types";

// Add one entry per Naver post to migrate. Run with:
//   pnpm run migrate:naver
// Generated posts land as draft:true — proofread each
// content/posts/<slug>.ko.mdx, then flip draft:false and commit.
// Do NOT re-run after editing generated files (it overwrites them).
export const manifest: NaverMigrateEntry[] = [
  // {
  //   url: "https://blog.naver.com/es_h3/224232524997",
  //   slug: "gold-refining-pvc-pp-fumehood-scrubber-duct",
  //   category: "article",
  //   tags: ["흄후드", "스크러버", "배기배관", "PVC", "PP"],
  // },
  {
    url: "https://blog.naver.com/es_h3/223689538504",
    slug: "pp-tank-fabrication-welding",   // 영문·하이픈, 고유값 (URL/이미지폴더가 됨)
    category: "article",                    // "news" | "article" | "update"
    tags: ["화학공정", "배기배관","PP탱크", "용접","PVC"],
    // publishedAt: "2026-01-15",           // (선택) 없으면 글에서 자동 파싱
  },
];
