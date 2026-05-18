// Integration check: drives the real submitContact Server Action with a
// simulated form submission. Turnstile uses Cloudflare's always-pass dummy
// secret (any token string verifies true), so the chain reaches Resend
// (real send to CONTACT_TO_EMAIL) and then notify -> Telegram.
//
// Run: node --env-file=.env.local --import tsx scripts/verify-contact-flow.ts
import { submitContact } from "../actions/contact";

(async () => {
  const fd = new FormData();
  fd.set("name", "통합 검증 봇");
  fd.set("email", "tester@example.com");
  fd.set("company", "H3");
  fd.set("message", "verify-contact-flow: 폼→Turnstile→Resend→notify→Telegram 전구간 검증");
  fd.set("locale", "ko");
  fd.set("turnstileToken", "dummy-token-anything"); // always-pass secret
  fd.set("honeypot", "");

  const result = await submitContact(null, fd);
  console.log("submitContact result:", JSON.stringify(result));

  if (!result.ok) {
    console.error("FAILED: expected ok:true, got an error result");
    process.exit(1);
  }
  console.log(
    "OK: Resend send succeeded -> notify fired. Check skyqwn@gmail.com inbox AND the H3_이메일문의 Telegram group."
  );
})().catch((err) => {
  console.error("verify-contact-flow THREW:", err);
  process.exit(1);
});
