import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "./session";

// 서버 액션/라우트에서 세션(2겹 로그인)을 확인. 미인증이면 false.
export async function requireAdmin(): Promise<boolean> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return (await verifySession(token)) !== null;
}
