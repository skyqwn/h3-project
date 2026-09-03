import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";

// 업로드 경로 화이트리스트: blog/<slug>/<파일명>. slug는 소문자·숫자·하이픈.
const PATH_RE = /^blog\/[a-z0-9]+(?:-[a-z0-9]+)*\/[^/]+$/;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_BYTES = 5 * 1024 * 1024;

// 클라이언트 직접 업로드용 토큰 발급. 비밀키는 서버에만 있고, 브라우저엔
// 이 라우트가 허가한 "이 경로·이 형식·5MB까지"짜리 단기 토큰만 나간다.
// 로그인 세션이 없으면 토큰 자체를 안 준다(무단 업로드 차단).
export async function POST(request: Request): Promise<NextResponse> {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!PATH_RE.test(pathname)) {
          throw new Error("허용되지 않은 업로드 경로입니다.");
        }
        return {
          allowedContentTypes: ALLOWED,
          maximumSizeInBytes: MAX_BYTES,
          addRandomSuffix: true,
        };
      },
      // 로컬(localhost)에선 호출되지 않음. 후처리 없음(DB 저장 안 함).
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
