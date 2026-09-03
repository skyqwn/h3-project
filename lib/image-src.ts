// 본문 이미지 URL에 픽셀 치수를 쿼리로 싣고 다시 읽는 순수 헬퍼.
// 원격(Blob) 이미지는 빌드시 치수를 알 수 없어, 업로드 때 측정한 값을
// URL에 담아 next/image가 박스를 예약하도록 한다.
export function withDims(url: string, width: number, height: number): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}w=${width}&h=${height}`;
}

export function dimsFromSrc(
  src: string
): { width: number; height: number } | null {
  const qIndex = src.indexOf("?");
  if (qIndex === -1) return null;
  const params = new URLSearchParams(src.slice(qIndex + 1));
  const w = Number(params.get("w"));
  const h = Number(params.get("h"));
  if (Number.isInteger(w) && Number.isInteger(h) && w > 0 && h > 0) {
    return { width: w, height: h };
  }
  return null;
}
