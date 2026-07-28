import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

async function main() {
  // pnpm/PowerShell 조합이 "--"를 인자로 흘려보내는 경우가 있어 걸러낸다.
  const args = process.argv.slice(2).filter((a) => a !== "--");
  const [username, password] = args;
  if (!username || !password) {
    console.error("사용법: create-admin <아이디> <비밀번호>");
    process.exit(1);
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username));
  if (existing.length > 0) {
    await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.username, username));
    console.log("비밀번호 갱신:", username);
  } else {
    await db
      .insert(users)
      .values({ username, passwordHash, name: "관리자", role: "owner" });
    console.log("관리자 생성:", username);
  }
}

main();
