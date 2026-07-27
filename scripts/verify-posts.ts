// DB 스모크 테스트: DB에 연결해 posts 데이터 계층을 검증한다.
// 실행: pnpm run verify:posts (node --env-file=.env.local --import tsx)
//
// lib/posts의 getAllPosts는 unstable_cache(Next 런타임 전용)로 감싸져 있어
// 순수 node 스크립트에서 호출할 수 없다. 그래서 실제 DB 로직인
// posts-repo(queryAllPosts/queryPostBySlug/rowToPost)를 검증한다. 캐시 래퍼와
// 파생 헬퍼(getAllTags 등)의 end-to-end는 build + 브라우저 확인으로 커버한다.
import assert from "node:assert/strict";
import {
  queryAllPosts,
  queryPostBySlug,
  rowToPost,
} from "@/lib/db/posts-repo";

async function main() {
  const rows = await queryAllPosts(true);
  assert.ok(rows.length >= 1, "expected >=1 post in DB");

  // 발행일 내림차순 정렬
  for (let i = 1; i < rows.length; i++) {
    assert.ok(
      rows[i - 1]!.publishedAt >= rows[i]!.publishedAt,
      "posts must be sorted by publishedAt desc"
    );
  }

  // 슬러그 유니크
  const slugs = rows.map((r) => r.slug);
  assert.equal(new Set(slugs).size, slugs.length, "slugs unique");

  // rowToPost 매핑 검증
  const first = rows[0]!;
  const post = rowToPost(first, "ko");
  assert.equal(post.slug, first.slug);
  assert.equal(post.locale, "ko");
  assert.ok(post.body.length > 0, "body must be non-empty");
  assert.ok(Array.isArray(post.tags));
  assert.match(post.publishedAt, /^\d{4}-\d{2}-\d{2}$/, "publishedAt YYYY-MM-DD");

  // locale은 콘텐츠와 무관하게 라우팅 태그로만 붙는다(한국어 콘텐츠가 en에도).
  const enPost = rowToPost(first, "en");
  assert.equal(enPost.locale, "en");
  assert.equal(enPost.body, post.body);

  // 단건 조회 + 없는 slug
  const bySlug = await queryPostBySlug(first.slug);
  assert.ok(bySlug, "queryPostBySlug must find existing slug");
  const missing = await queryPostBySlug("does-not-exist");
  assert.equal(missing, null, "missing slug must return null");

  console.log(`verify:posts OK — ${rows.length}개 글 검증 통과.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("verify:posts FAILED:", err);
    process.exit(1);
  });
