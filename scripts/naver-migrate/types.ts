export type NaverMigrateEntry = {
  /** e.g. https://blog.naver.com/es_h3/224232524997 */
  url: string;
  /** human-readable, e.g. gold-refining-pvc-pp-fumehood */
  slug: string;
  category: "news" | "article" | "update";
  tags: string[];
  /** ISO date override; if absent, parsed from post, else today */
  publishedAt?: string;
};

export type ConvertResult = {
  /** MDX body (image src still original Naver URLs; rewritten later) */
  mdxBody: string;
  /** ordered original image URLs found in the post body */
  imageUrls: string[];
  /** non-fatal issues (unsupported widgets etc.) for the proofread step */
  warnings: string[];
};
