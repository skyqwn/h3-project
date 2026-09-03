"use server";

import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import {
  GATE_COOKIE,
  SESSION_COOKIE,
  cookieBaseOptions,
  signGate,
  signSession,
} from "@/lib/auth/session";

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function submitGate(
  password: string
): Promise<{ ok: boolean; error?: string }> {
  const expected = process.env.ADMIN_GATE_PASSWORD;
  if (!expected) return { ok: false, error: "게이트가 설정되지 않았습니다." };
  if (!safeEqual(password, expected)) {
    return { ok: false, error: "비밀번호가 올바르지 않습니다." };
  }
  (await cookies()).set(GATE_COOKIE, await signGate(), {
    ...cookieBaseOptions,
    maxAge: 60 * 60 * 24 * 30,
  });
  return { ok: true };
}

export async function login(
  username: string,
  password: string
): Promise<{ ok: boolean; error?: string }> {
  const generic = "아이디 또는 비밀번호가 올바르지 않습니다.";
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.username, username));
  const user = rows[0];
  if (!user) return { ok: false, error: generic };
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return { ok: false, error: generic };
  (await cookies()).set(SESSION_COOKIE, await signSession(user.username), {
    ...cookieBaseOptions,
    maxAge: 60 * 60 * 24 * 7,
  });
  return { ok: true };
}

export async function logout(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}
