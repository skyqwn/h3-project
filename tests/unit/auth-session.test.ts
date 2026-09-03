import assert from "node:assert/strict";

(async () => {
  // 세션 모듈은 secret을 지연 로드하므로 import 후 env를 세팅해도 된다.
  process.env.AUTH_SECRET = "test-secret-please-change-1234567890";
  const { signGate, verifyGate, signSession, verifySession } = await import(
    "../../lib/auth/session"
  );

  // 게이트 왕복
  const g = await signGate();
  assert.equal(await verifyGate(g), true);
  assert.equal(await verifyGate("garbage.token.here"), false);
  assert.equal(await verifyGate(undefined), false);

  // 세션 왕복
  const s = await signSession("admin@h3.test");
  assert.deepEqual(await verifySession(s), { sub: "admin@h3.test" });
  assert.equal(await verifySession("nope"), null);
  assert.equal(await verifySession(undefined), null);

  // 다른 키로는 검증 실패(위조 방지)
  process.env.AUTH_SECRET = "a-different-secret-value-000000000000";
  assert.equal(await verifyGate(g), false);
  assert.equal(await verifySession(s), null);

  console.log("auth-session.test: 8 assertions passed.");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
