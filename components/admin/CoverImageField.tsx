"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { uploadImage } from "@/lib/blob-upload";

// 커버 이미지 입력. 파일을 골라 Blob(blog/<slug>/cover.*)에 직접 업로드하고
// 반환 URL을 상위 폼(value/onChange)에 넘긴다. 커버는 렌더 시 next/image
// fill이라 치수 쿼리는 붙이지 않는다. slug가 없으면 업로드 불가.
export function CoverImageField({
  value,
  slug,
  onChange,
}: {
  value: string;
  slug: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const disabled = uploading || !slug;

  async function onPick(file: File) {
    setError(null);
    setUploading(true);
    try {
      const { url } = await uploadImage(file, { slug, kind: "cover" });
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "업로드 실패");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        커버 이미지
      </label>

      <div className="relative aspect-[16/10] w-full max-w-sm overflow-hidden rounded-md border border-gray-300 bg-gray-50">
        <Image
          src={value}
          alt="커버 이미지 미리보기"
          fill
          sizes="384px"
          className="object-cover"
        />
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm text-gray-600">
            업로드 중…
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          이미지 선택
        </button>
        <span className="truncate text-xs text-gray-500">{value}</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPick(file);
        }}
      />

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <p className="mt-1 text-xs text-gray-500">
        {slug
          ? "JPG·PNG·WebP·AVIF, 5MB 이하. 선택하지 않으면 기본 이미지가 쓰입니다."
          : "먼저 slug를 입력하면 이미지를 올릴 수 있습니다."}
      </p>
    </div>
  );
}
