import { notify } from "../lib/notify/index";

(async () => {
  await notify({
    name: "E2E 테스트",
    email: "e2e@h3.local",
    company: "H3",
    message:
      "plan Task 7 라이브 검증 — 이 메시지가 그룹에 오면 notify 파이프라인 정상",
    locale: "ko",
    submittedAt: new Date().toISOString(),
  });
  console.log("notify() resolved");
})().catch((err) => {
  console.error("verify-notify FAILED:", err);
  process.exit(1);
});
