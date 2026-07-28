// Next.js 16 renamed the "middleware" file convention to "proxy".
// next-intl still ships its handler from the next-intl/middleware subpath.
import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import {
  GATE_COOKIE,
  SESSION_COOKIE,
  verifyGate,
  verifySession,
} from "./lib/auth/session";

const intl = createMiddleware(routing);

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // /admin 2겹 가드(엣지): 게이트 쿠키 → 세션 쿠키.
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/gate") return NextResponse.next();
    const gateOk = await verifyGate(req.cookies.get(GATE_COOKIE)?.value);
    if (!gateOk) return NextResponse.redirect(new URL("/admin/gate", req.url));
    if (pathname === "/admin/login") return NextResponse.next();
    const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
    if (!session) return NextResponse.redirect(new URL("/admin/login", req.url));
    return NextResponse.next();
  }

  // 그 외 경로는 기존 next-intl 미들웨어 그대로.
  return intl(req);
}

export const config = {
  // /admin도 프록시가 받도록 admin 제외를 푼다(위 함수에서 next-intl과 분기).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
