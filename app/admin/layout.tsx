import "../globals.css";
import Link from "next/link";
import type { Metadata } from "next";

// 관리자 영역은 [locale] 밖이라 여기서 <html>/<body>를 직접 렌더한다.
// 내부용이라 마케팅 헤더/푸터/Lenis 없이 심플하게. 검색 비노출.
export const metadata: Metadata = {
  title: "관리자 — H3",
  robots: { index: false, follow: false },
};

const PRETENDARD_CSS =
  "https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <link
          rel="preconnect"
          href="https://cdn.jsdelivr.net"
          crossOrigin="anonymous"
        />
        <link rel="stylesheet" href={PRETENDARD_CSS} />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
            <Link href="/admin" className="text-lg font-bold">
              H3 관리자
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/admin/posts/new" className="text-blue-600">
                새 글 작성
              </Link>
              <Link href="/blog" className="text-gray-500">
                블로그 보기 →
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
