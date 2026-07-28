import { SignJWT, jwtVerify } from "jose";

export const GATE_COOKIE = "admin_gate";
export const SESSION_COOKIE = "admin_session";

export const cookieBaseOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
};

// secret은 호출 시점에 읽는다(엣지·테스트·런타임 모두 안전).
function secretKey(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET 환경변수가 없습니다.");
  return new TextEncoder().encode(s);
}

export async function signGate(): Promise<string> {
  return new SignJWT({ gate: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey());
}

export async function verifyGate(token?: string): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload.gate === true;
  } catch {
    return false;
  }
}

export async function signSession(username: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(username)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());
}

export async function verifySession(
  token?: string
): Promise<{ sub: string } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return typeof payload.sub === "string" ? { sub: payload.sub } : null;
  } catch {
    return null;
  }
}
