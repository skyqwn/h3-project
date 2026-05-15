import assert from "node:assert/strict";
import { verifyTurnstile } from "../../lib/turnstile";

const originalFetch = global.fetch;

(async () => {
  // Success path
  global.fetch = (async () =>
    new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })) as typeof fetch;
  assert.equal(await verifyTurnstile("token-ok", "secret"), true);

  // Failure path — Cloudflare returns success:false
  global.fetch = (async () =>
    new Response(JSON.stringify({ success: false }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })) as typeof fetch;
  assert.equal(await verifyTurnstile("token-bad", "secret"), false);

  // Network/HTTP error path
  global.fetch = (async () =>
    new Response("server error", { status: 500 })) as typeof fetch;
  assert.equal(await verifyTurnstile("token", "secret"), false);

  global.fetch = originalFetch;
  console.log("turnstile.test: 3 assertions passed.");
})().catch((err) => {
  console.error("turnstile.test FAILED:", err);
  process.exit(1);
});
