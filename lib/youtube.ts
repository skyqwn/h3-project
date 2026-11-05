// 유튜브 링크/시간 파싱 유틸 (관리자 에디터의 "유튜브" 버튼에서 사용).

// "6:27" | "1:02:03" | "387" | "387s" | "6m27s" | "" → 초. 형식 오류면 null.
export function parseStart(raw: string): number | null {
  const s = raw.trim().toLowerCase();
  if (s === "") return 0;
  if (/^\d+s?$/.test(s)) return parseInt(s, 10);
  const colon = s.match(/^(?:(\d+):)?(\d{1,2}):(\d{1,2})$/);
  if (colon) {
    const [, h, m = "0", sec = "0"] = colon;
    return (h ? parseInt(h, 10) * 3600 : 0) + parseInt(m, 10) * 60 + parseInt(sec, 10);
  }
  const hms = s.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (hms && (hms[1] || hms[2] || hms[3])) {
    return (
      parseInt(hms[1] ?? "0", 10) * 3600 +
      parseInt(hms[2] ?? "0", 10) * 60 +
      parseInt(hms[3] ?? "0", 10)
    );
  }
  return null;
}

// 초 → "6:27" / "1:02:03"
export function formatStart(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

// watch?v= / youtu.be / embed / shorts 링크에서 영상 ID와 t=/start= 시간을 뽑는다.
// 재생목록(list=) 등 나머지 파라미터는 버린다.
export function parseYoutubeInput(
  raw: string
): { id: string; start: number } | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^(www|m|music)\./, "");
  let id: string | null = null;
  if (host === "youtu.be") {
    id = u.pathname.slice(1).split("/")[0] || null;
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    id =
      u.searchParams.get("v") ??
      u.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1] ??
      null;
  }
  if (!id || !/^[\w-]{6,20}$/.test(id)) return null;
  const t = u.searchParams.get("t") ?? u.searchParams.get("start") ?? "";
  return { id, start: parseStart(t) ?? 0 };
}
