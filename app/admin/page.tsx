import Link from "next/link";
import { queryAllPosts, rowToPost } from "@/lib/db/posts-repo";
import { DeletePostButton } from "@/components/admin/DeletePostButton";

type Filter = "all" | "draft" | "published";

const TABS: { value: Filter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "draft", label: "임시저장" },
  { value: "published", label: "발행" },
];

// 관리자 대시보드 = 글 목록. 배포 환경에서도 임시저장(draft)까지 모두 보여준다
// (공개 getAllPosts는 프로덕션에서 draft를 거르므로 여기선 직접 조회).
// 에이전트가 만든 임시글이 섞여 늘어나도 찾기 쉽게 draft/발행 필터를 둔다.
export default async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter: rawFilter } = await searchParams;
  const filter: Filter = rawFilter === "draft" || rawFilter === "published" ? rawFilter : "all";

  const rows = await queryAllPosts(true);
  const allPosts = rows.map((r) => rowToPost(r, "ko"));
  const posts = allPosts.filter((p) => {
    if (filter === "draft") return p.draft;
    if (filter === "published") return !p.draft;
    return true;
  });
  const draftCount = allPosts.filter((p) => p.draft).length;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">
          글 목록 ({posts.length})
          {draftCount > 0 && filter !== "draft" && (
            <span className="ml-2 text-sm font-normal text-yellow-700">
              임시저장 {draftCount}건
            </span>
          )}
        </h1>
        <Link
          href="/admin/posts/new"
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          + 새 글
        </Link>
      </div>

      <div className="mb-6 flex gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value === "all" ? "/admin" : `/admin?filter=${tab.value}`}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              filter === tab.value
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {posts.length === 0 ? (
        <p className="text-sm text-gray-500">
          {filter === "draft" ? "임시저장된 글이 없어요." : filter === "published" ? "발행된 글이 없어요." : "아직 글이 없어요."}
        </p>
      ) : (
        <ul className="divide-y divide-gray-200 rounded-md border border-gray-200 bg-white">
          {posts.map((p) => (
            <li
              key={p.slug}
              className="flex items-center justify-between px-4 py-3"
            >
              <div>
                <div className="font-medium">
                  {p.title}
                  {p.draft ? (
                    <span className="ml-2 rounded bg-yellow-100 px-1.5 py-0.5 text-xs text-yellow-800">
                      임시저장
                    </span>
                  ) : (
                    <span className="ml-2 rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-800">
                      발행
                    </span>
                  )}
                  {p.aiGenerated && (
                    <span className="ml-1 rounded bg-purple-100 px-1.5 py-0.5 text-xs text-purple-800">
                      AI 생성
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {p.publishedAt} · /blog/{p.slug}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/admin/posts/${p.slug}/edit`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  편집
                </Link>
                {!p.draft && (
                  <Link
                    href={`/blog/${p.slug}`}
                    className="text-sm text-gray-500 hover:underline"
                  >
                    보기
                  </Link>
                )}
                <DeletePostButton slug={p.slug} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
