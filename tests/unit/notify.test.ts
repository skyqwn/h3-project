import assert from "node:assert/strict";
import { telegramChannel } from "../../lib/notify/channels/telegram";
import type { Lead } from "../../lib/notify/types";

const lead: Lead = {
  name: "홍길동",
  email: "gildong@example.com",
  company: "Acme",
  message: "문의 내용입니다",
  locale: "ko",
  submittedAt: "2026-05-18T00:00:00.000Z",
};

const origFetch = global.fetch;
const origToken = process.env.TELEGRAM_BOT_TOKEN;
const origChat = process.env.TELEGRAM_CHAT_ID;

function restore() {
  global.fetch = origFetch;
  if (origToken === undefined) delete process.env.TELEGRAM_BOT_TOKEN;
  else process.env.TELEGRAM_BOT_TOKEN = origToken;
  if (origChat === undefined) delete process.env.TELEGRAM_CHAT_ID;
  else process.env.TELEGRAM_CHAT_ID = origChat;
}

(async () => {
  // Case 1: configured -> posts to sendMessage with chat_id + lead fields
  process.env.TELEGRAM_BOT_TOKEN = "TESTTOKEN";
  process.env.TELEGRAM_CHAT_ID = "-5120610013";
  let calledUrl = "";
  let calledBody = "";
  global.fetch = (async (url: string, init?: RequestInit) => {
    calledUrl = String(url);
    calledBody = String(init?.body ?? "");
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }) as typeof fetch;

  await telegramChannel.send(lead);
  assert.ok(
    calledUrl.includes("/botTESTTOKEN/sendMessage"),
    "should call sendMessage with the token in the path"
  );
  assert.ok(
    calledBody.includes("-5120610013"),
    "body should carry the chat_id"
  );
  assert.ok(
    calledBody.includes("gildong%40example.com") ||
      calledBody.includes("gildong@example.com"),
    "body should carry the lead email"
  );

  // Case 2: unconfigured -> no fetch, no throw
  delete process.env.TELEGRAM_BOT_TOKEN;
  delete process.env.TELEGRAM_CHAT_ID;
  let fetchCount = 0;
  global.fetch = (async () => {
    fetchCount++;
    return new Response("{}", { status: 200 });
  }) as typeof fetch;
  await telegramChannel.send(lead); // must not throw
  assert.equal(fetchCount, 0, "unconfigured channel must not call fetch");

  // --- Hub-level cases ---
  const { runChannels } = await import("../../lib/notify/index");

  // Case 3: a throwing channel does not make the hub reject
  let secondRan = false;
  await runChannels(lead, [
    { name: "boom", send: async () => { throw new Error("boom"); } },
    { name: "ok", send: async () => { secondRan = true; } },
  ]);
  assert.equal(
    secondRan,
    true,
    "fan-out must continue to later channels after one throws"
  );

  // Case 4: notify() (default channels) never throws even if unconfigured
  delete process.env.TELEGRAM_BOT_TOKEN;
  delete process.env.TELEGRAM_CHAT_ID;
  const { notify } = await import("../../lib/notify/index");
  await notify(lead); // unconfigured telegram -> no-op -> notify resolves

  restore();
  console.log("notify.test: 6 assertions passed.");
})().catch((err) => {
  restore();
  console.error("notify.test FAILED:", err);
  process.exit(1);
});
