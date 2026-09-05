"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RichTextEditor } from "./RichTextEditor";
import { CoverImageField } from "./CoverImageField";
import { createPost, updatePost } from "@/actions/admin/posts";
import type { CreatePostInput } from "@/actions/admin/posts";

const CATEGORIES = ["news", "blog", "update"] as const;

// URL(slug) 기본값용 오늘 날짜(YYYY-MM-DD).
function todayStr(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

type InitialPost = {
  slug: string;
  title: string;
  summary: string;
  category: (typeof CATEGORIES)[number];
  tags: string[];
  coverImage: string;
  body: string;
  draft: boolean;
  source?: string;
  sourceUrl?: string;
};

export function PostForm({
  mode = "new",
  initialPost,
}: {
  mode?: "new" | "edit";
  initialPost?: InitialPost;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(initialPost?.title ?? "");
  const [slug, setSlug] = useState(initialPost?.slug ?? "");
  const [summary, setSummary] = useState(initialPost?.summary ?? "");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>(
    initialPost?.category ?? "blog"
  );
  const [tags, setTags] = useState(initialPost?.tags.join(", ") ?? "");
  const [coverImage, setCoverImage] = useState(
    initialPost?.coverImage ?? "/og-default.png"
  );
  const [body, setBody] = useState(initialPost?.body ?? "");
  const [source, setSource] = useState(initialPost?.source ?? "");
  const [sourceUrl, setSourceUrl] = useState(initialPost?.sourceUrl ?? "");

  // 새 글일 때만 URL(slug) 기본값을 오늘 날짜로 채운다(편집은 기존 slug 유지).
  // 정적 프리렌더라 "오늘"은 클라이언트에서만 정확하므로 마운트 후 채운다.
  useEffect(() => {
    if (initialPost) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 클라이언트 전용 현재 날짜 주입
    setSlug((cur) => (cur === "" ? todayStr() : cur));
  }, [initialPost]);

  function submit(draft: boolean) {
    setError(null);
    startTransition(async () => {
      const payload: CreatePostInput = {
        title,
        slug,
        summary,
        category,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        coverImage,
        body,
        draft,
        source: source.trim() || undefined,
        sourceUrl: sourceUrl.trim() || undefined,
      };
      const result =
        mode === "edit" && initialPost
          ? await updatePost(initialPost.slug, payload)
          : await createPost(payload);
      if (result.ok) {
        // 임시저장은 관리자 목록으로, 발행은 공개 글로 이동.
        router.push(draft ? "/admin" : `/blog/${result.slug}`);
      } else {
        setError(result.error);
      }
    });
  }

  const label = "block text-sm font-medium text-gray-700 mb-1";
  const input =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none";

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        submit(false);
      }}
    >
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div>
        <label className={label}>제목</label>
        <input
          className={input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="글 제목"
        />
      </div>

      <div>
        <label className={label}>URL 주소 · 자동</label>
        <input
          className={input}
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="2026-07-28"
        />
        <p className="mt-1 text-xs text-gray-500">
          오늘 날짜로 자동 입력됩니다. 그대로 둬도 되고, SEO용으로 원하면 영문
          키워드(소문자·숫자·하이픈)로 바꾸세요. 주소: /blog/{slug || "…"}
        </p>
      </div>

      <div>
        <label className={label}>요약</label>
        <input
          className={input}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="목록·검색에 보이는 짧은 요약"
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className={label}>카테고리</label>
          <select
            className={input}
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as (typeof CATEGORIES)[number])
            }
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className={label}>태그 (쉼표로 구분)</label>
          <input
            className={input}
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="PVC, 흄후드, 스크러버"
          />
        </div>
      </div>

      {category === "news" && (
        <div className="flex gap-4 rounded-md border border-gray-200 bg-gray-50 p-3">
          <div className="flex-1">
            <label className={label}>출처(매체명)</label>
            <input
              className={input}
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="예: 전자신문"
            />
          </div>
          <div className="flex-1">
            <label className={label}>원문 링크</label>
            <input
              className={input}
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>
      )}

      <CoverImageField value={coverImage} slug={slug} onChange={setCoverImage} />

      <div>
        <label className={label}>본문</label>
        <RichTextEditor value={body} slug={slug} onChange={setBody} />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {pending ? "저장 중…" : "발행하기"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => submit(true)}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          임시저장(비공개)
        </button>
      </div>
    </form>
  );
}
