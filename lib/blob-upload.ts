import { upload } from "@vercel/blob/client";

export type UploadedImage = { url: string; width: number; height: number };

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

// 브라우저에서 실제 픽셀 크기 측정(모든 표시 가능한 형식 지원).
function measure(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지 크기를 읽지 못했습니다."));
    };
    img.src = url;
  });
}

export async function uploadImage(
  file: File,
  opts: { slug: string; kind: "cover" | "body" }
): Promise<UploadedImage> {
  const ext = EXT[file.type];
  if (!ext) throw new Error("JPG·PNG·WebP·AVIF 이미지만 올릴 수 있습니다.");
  const { width, height } = await measure(file);
  // 파일명은 kind.ext로 고정하고 서버 addRandomSuffix로 유니크화(특수문자 회피).
  const pathname = `blog/${opts.slug}/${opts.kind}.${ext}`;
  const blob = await upload(pathname, file, {
    access: "public",
    handleUploadUrl: "/api/admin/blob-upload",
    contentType: file.type,
  });
  return { url: blob.url, width, height };
}
