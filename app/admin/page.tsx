import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

// 관리자 대시보드 = 글 목록(체험용). dev에서는 임시저장(draft)도 보인다.
export default async function AdminHome() {
  const posts = await getAllPosts("ko");

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">글 목록 ({posts.length})</h1>
        <Link
          href="/admin/posts/new"
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          + 새 글
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="text-sm text-gray-500">아직 글이 없어요.</p>
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
                  {p.draft && (
                    <span className="ml-2 rounded bg-yellow-100 px-1.5 py-0.5 text-xs text-yellow-800">
                      임시저장
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {p.publishedAt} · /blog/{p.slug}
                </div>
              </div>
              <Link
                href={`/blog/${p.slug}`}
                className="text-sm text-blue-600"
              >
                보기 →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
