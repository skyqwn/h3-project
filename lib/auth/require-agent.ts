import { timingSafeEqual } from "node:crypto";

// 에이전트(H3 Agent, Cloudflare Worker) 전용 쓰기 API 인증. 세션 쿠키
// (requireAdmin)와는 별도 경로 — Worker에는 브라우저 로그인 세션이 없다.
// 키 미설정이면 무조건 거부(fail closed). 길이가 다르면 timingSafeEqual이
// 던지므로 먼저 길이를 맞춰 확인한다.
export function requireAgentKey(request: Request): boolean {
  const expected = process.env.BLOG_AGENT_WRITE_KEY;
  if (!expected) return false;
  const provided = request.headers.get("x-agent-key");
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
