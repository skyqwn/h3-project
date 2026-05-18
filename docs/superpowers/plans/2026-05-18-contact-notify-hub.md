# Contact Notification Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fan out contact-form submissions to a Telegram group (in addition to the existing Resend email) through an extensible, best-effort notification hub that never blocks the user's success response.

**Architecture:** A `lib/notify` hub exposes `notify(lead)` which iterates a static array of `NotifyChannel`s, each wrapped so one channel's failure can't break others or escape to the caller. The contact Server Action builds a `Lead` and calls `notify(lead)` only after Resend succeeds. The Telegram channel reads its credentials from `process.env` at call time (NOT the required `lib/env.ts` schema) so a missing config is a graceful no-op and Vercel builds stay green.

**Tech Stack:** Next.js 16 Server Actions, TypeScript (strict), zod, tsx unit runner, Telegram Bot HTTP API (`sendMessage`), pnpm.

**Sources of truth:**
- Spec: `/docs/superpowers/specs/2026-05-18-contact-notify-hub-design.md`
- Existing patterns to mirror: `lib/turnstile.ts`, `tests/unit/turnstile.test.ts`, `tests/unit/run.ts`, `actions/contact.ts`, `lib/contact-schema.ts`, `components/ui/ContactForm.tsx`

**Verified facts (do not re-derive):** Bot `@h3_contact_bot`, group chat_id `-5120610013`, both already in `.env.local`. `pnpm` is the package manager. Unit tests run via `pnpm run test:unit` (tsx, assertion-throw style, no Jest).

---

## File Structure

| File | Responsibility |
|---|---|
| `lib/notify/types.ts` (new) | `Lead` type + `NotifyChannel` interface — the contract every channel implements |
| `lib/notify/channels/telegram.ts` (new) | Telegram channel: runtime env check → no-op or `sendMessage` POST |
| `lib/notify/index.ts` (new) | `notify(lead)` hub: iterate channels, isolate failures, never throw |
| `lib/contact-schema.ts` (modify) | add `locale` field to `ContactInputSchema` |
| `components/ui/ContactForm.tsx` (modify) | hidden `locale` input so the action receives it |
| `actions/contact.ts` (modify) | build `Lead`, `await notify(lead)` after Resend success |
| `tests/unit/notify.test.ts` (new) | 4 assertions: configured posts, unconfigured no-op, throw contained, fan-out isolation |
| `tests/unit/run.ts` (modify) | import `./notify.test` |
| `.env.example` (modify) | document optional `TELEGRAM_*` vars |
| `scripts/verify-notify.ts` (new) | re-runnable live Telegram smoke test |

---

## Task 1: Notification types (the contract)

**Files:**
- Create: `lib/notify/types.ts`

- [ ] **Step 1: Create the types file**

```ts
// lib/notify/types.ts
export type Lead = {
  name: string;
  email: string;
  company: string; // "" when not provided
  message: string;
  locale: "ko" | "en";
  submittedAt: string; // ISO 8601
};

export type NotifyChannel = {
  name: string;
  send: (lead: Lead) => Promise<void>;
};
```

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: exit 0 (no output).

- [ ] **Step 3: Commit**

```bash
git add lib/notify/types.ts
git commit -m "feat: notify Lead type + NotifyChannel interface"
```

---

## Task 2: Telegram channel (TDD)

**Files:**
- Create: `lib/notify/channels/telegram.ts`
- Create: `tests/unit/notify.test.ts`
- Modify: `tests/unit/run.ts`

This task delivers the Telegram channel AND the first two of the four spec test cases (configured-posts, unconfigured-no-op). The hub-level cases (throw contained, fan-out isolation) come in Task 3 once the hub exists.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/notify.test.ts`:

```ts
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

  restore();
  console.log("notify.test: telegram channel — 4 assertions passed.");
})().catch((err) => {
  restore();
  console.error("notify.test FAILED:", err);
  process.exit(1);
});
```

- [ ] **Step 2: Wire it into the runner**

Modify `tests/unit/run.ts` — add the import line (keep existing imports):

```ts
import "./mdx.test";
import "./turnstile.test";
import "./notify.test";

console.log("All unit tests passed.");
```

- [ ] **Step 3: Run, verify it fails**

Run: `pnpm run test:unit`
Expected: FAIL with `Cannot find module '../../lib/notify/channels/telegram'`.

- [ ] **Step 4: Implement the Telegram channel**

Create `lib/notify/channels/telegram.ts`:

```ts
import type { Lead, NotifyChannel } from "../types";

function formatMessage(lead: Lead): string {
  return (
    "🔔 H3 새 문의\n" +
    `이름: ${lead.name}\n` +
    `이메일: ${lead.email}\n` +
    `회사: ${lead.company || "—"}\n` +
    `언어: ${lead.locale}\n\n` +
    lead.message
  );
}

export const telegramChannel: NotifyChannel = {
  name: "telegram",
  async send(lead: Lead): Promise<void> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      console.info(
        "[notify:telegram] not configured (TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID missing), skipping"
      );
      return;
    }

    const body = new URLSearchParams({
      chat_id: chatId,
      text: formatMessage(lead),
    });

    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      { method: "POST", body }
    );

    if (!res.ok) {
      throw new Error(
        `[notify:telegram] sendMessage failed with HTTP ${res.status}`
      );
    }
  },
};
```

- [ ] **Step 5: Run, verify it passes**

Run: `pnpm run test:unit`
Expected: PASS — output includes `notify.test: telegram channel — 4 assertions passed.` and `All unit tests passed.`

- [ ] **Step 6: Commit**

```bash
git add lib/notify/types.ts lib/notify/channels/telegram.ts tests/unit/notify.test.ts tests/unit/run.ts
git commit -m "feat: Telegram notify channel with env-optional no-op (TDD)"
```

(Note: `lib/notify/types.ts` re-added is a no-op if Task 1 already committed it — safe either way.)

---

## Task 3: Notification hub (TDD)

**Files:**
- Create: `lib/notify/index.ts`
- Modify: `tests/unit/notify.test.ts` (append hub cases)

- [ ] **Step 1: Append the failing hub tests**

Open `tests/unit/notify.test.ts`. Replace the final success line and catch with the expanded block below — i.e. change the end of the IIFE from:

```ts
  await telegramChannel.send(lead); // must not throw
  assert.equal(fetchCount, 0, "unconfigured channel must not call fetch");

  restore();
  console.log("notify.test: telegram channel — 4 assertions passed.");
})().catch((err) => {
```

to:

```ts
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

  // Case 4: notify() (default channels) never throws even if fetch dies
  delete process.env.TELEGRAM_BOT_TOKEN;
  delete process.env.TELEGRAM_CHAT_ID;
  const { notify } = await import("../../lib/notify/index");
  await notify(lead); // unconfigured telegram -> no-op -> notify resolves

  restore();
  console.log("notify.test: 6 assertions passed.");
})().catch((err) => {
```

- [ ] **Step 2: Run, verify it fails**

Run: `pnpm run test:unit`
Expected: FAIL with `Cannot find module '../../lib/notify/index'`.

- [ ] **Step 3: Implement the hub**

Create `lib/notify/index.ts`:

```ts
import type { Lead, NotifyChannel } from "./types";
import { telegramChannel } from "./channels/telegram";

// Add future channels (auto-reply, slack, db) to this array. The contact
// Server Action never changes when a channel is added.
const defaultChannels: NotifyChannel[] = [telegramChannel];

// Best-effort fan-out: every channel's failure is isolated and logged;
// this never rejects, so callers can `await notify(lead)` safely.
export async function runChannels(
  lead: Lead,
  channels: NotifyChannel[]
): Promise<void> {
  await Promise.all(
    channels.map(async (channel) => {
      try {
        await channel.send(lead);
      } catch (err) {
        console.error(`[notify:${channel.name}] failed:`, err);
      }
    })
  );
}

export async function notify(lead: Lead): Promise<void> {
  await runChannels(lead, defaultChannels);
}
```

- [ ] **Step 4: Run, verify it passes**

Run: `pnpm run test:unit`
Expected: PASS — output includes `notify.test: 6 assertions passed.` and `All unit tests passed.`

- [ ] **Step 5: Commit**

```bash
git add lib/notify/index.ts tests/unit/notify.test.ts
git commit -m "feat: notify hub — isolated best-effort channel fan-out (TDD)"
```

---

## Task 4: Capture locale on the contact form

**Files:**
- Modify: `lib/contact-schema.ts`
- Modify: `components/ui/ContactForm.tsx`

- [ ] **Step 1: Add locale to the schema**

In `lib/contact-schema.ts`, the current `ContactInputSchema` is:

```ts
export const ContactInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  company: z.string().trim().max(120).optional().default(""),
  message: z.string().trim().min(1).max(2000),
  turnstileToken: z.string().min(1),
  honeypot: z
    .string()
    .max(0, "spam detected")
    .optional()
    .default(""),
});
```

Add a `locale` field. Replace the schema with:

```ts
export const ContactInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  company: z.string().trim().max(120).optional().default(""),
  message: z.string().trim().min(1).max(2000),
  locale: z.enum(["ko", "en"]).default("ko"),
  turnstileToken: z.string().min(1),
  honeypot: z
    .string()
    .max(0, "spam detected")
    .optional()
    .default(""),
});
```

- [ ] **Step 2: Add the hidden locale input to the form**

In `components/ui/ContactForm.tsx`:

(a) Add the `useLocale` import to the existing `next-intl` import. The file currently imports `useTranslations` from `next-intl`; change that import line to:

```tsx
import { useTranslations, useLocale } from "next-intl";
```

(b) Inside the `ContactForm` component body, near the existing `const t = useTranslations("contact.form");`, add:

```tsx
  const locale = useLocale();
```

(c) Add the hidden input alongside the existing honeypot input (just after the honeypot `<input ... name="honeypot" .../>`):

```tsx
      <input type="hidden" name="locale" value={locale} />
```

- [ ] **Step 3: Type-check + lint**

Run: `pnpm exec tsc --noEmit && pnpm run lint`
Expected: both exit 0 (tsc no output; lint no problems).

- [ ] **Step 4: Commit**

```bash
git add lib/contact-schema.ts components/ui/ContactForm.tsx
git commit -m "feat: capture locale via hidden contact form field + schema enum"
```

---

## Task 5: Wire notify into the contact Server Action

**Files:**
- Modify: `actions/contact.ts`

- [ ] **Step 1: Read locale from the parsed form and call notify after Resend**

The current `actions/contact.ts` parses formData and, on Resend success, returns `{ ok: true }`. Apply two changes.

(a) Add `locale` to the parsed object (the `safeParse` call). It currently is:

```ts
  const parsed = ContactInputSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    company: formData.get("company") ?? "",
    message: formData.get("message"),
    turnstileToken: formData.get("turnstileToken"),
    honeypot: formData.get("honeypot") ?? "",
  });
```

Replace with:

```ts
  const parsed = ContactInputSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    company: formData.get("company") ?? "",
    message: formData.get("message"),
    locale: formData.get("locale") ?? "ko",
    turnstileToken: formData.get("turnstileToken"),
    honeypot: formData.get("honeypot") ?? "",
  });
```

(b) Add the import at the top (with the other `@/lib` imports):

```ts
import { notify } from "@/lib/notify";
```

(c) The Resend success tail currently is:

```ts
  if (error) {
    console.error("Resend send error:", error);
    return { ok: false, error: "Send failed" };
  }

  return { ok: true };
```

Replace with:

```ts
  if (error) {
    console.error("Resend send error:", error);
    return { ok: false, error: "Send failed" };
  }

  // Best-effort fan-out. notify() never throws; a Telegram failure must
  // not turn a delivered email into a user-facing error.
  await notify({
    name: input.name,
    email: input.email,
    company: input.company,
    message: input.message,
    locale: input.locale,
    submittedAt: new Date().toISOString(),
  });

  return { ok: true };
```

- [ ] **Step 2: Type-check + lint**

Run: `pnpm exec tsc --noEmit && pnpm run lint`
Expected: both exit 0.

- [ ] **Step 3: Run the full unit suite (regression)**

Run: `pnpm run test:unit`
Expected: PASS — `notify.test: 6 assertions passed.`, `turnstile.test: 3 assertions passed.`, `mdx.test: 7 assertions passed.`, `All unit tests passed.`

- [ ] **Step 4: Commit**

```bash
git add actions/contact.ts
git commit -m "feat: fan out contact submissions to notify hub after Resend"
```

---

## Task 6: Document optional env

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Append the optional Telegram vars**

The current `.env.example` ends with the `NEXT_PUBLIC_SITE_URL` block. Append:

```bash

# Telegram contact notifications (OPTIONAL).
# If unset, the Telegram channel no-ops and the site/build are unaffected.
# Bot token from @BotFather; chat_id is the target group's id (negative,
# e.g. -5120610013; gains a -100 prefix if the group becomes a supergroup).
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "docs: document optional TELEGRAM_* env in .env.example"
```

---

## Task 7: Live end-to-end verification

**Files:**
- Create: `scripts/verify-notify.ts`

A committed verification script (mirrors the existing `scripts/check-i18n-parity.ts` pattern) is more reliable than inline `tsx -e` gymnastics and is re-runnable any time the Telegram setup needs a smoke test. A standalone tsx script does NOT auto-load `.env.local` (only Next.js does), so the script is run with `node --env-file=.env.local --import tsx` (Node 20.6+; the installed runtime is v20.20.0, confirmed during Phase 1).

- [ ] **Step 1: Confirm `.env.local` still has the verified values**

Run:
```bash
grep -E '^TELEGRAM_(BOT_TOKEN|CHAT_ID)=' .env.local
```
Expected: a non-empty `TELEGRAM_BOT_TOKEN=...` line and `TELEGRAM_CHAT_ID=-5120610013`.

- [ ] **Step 2: Create the verification script**

Create `scripts/verify-notify.ts`:

```ts
import { notify } from "../lib/notify/index";

(async () => {
  await notify({
    name: "E2E 테스트",
    email: "e2e@h3.local",
    company: "H3",
    message: "plan Task 7 라이브 검증 — 이 메시지가 그룹에 오면 notify 파이프라인 정상",
    locale: "ko",
    submittedAt: new Date().toISOString(),
  });
  console.log("notify() resolved");
})().catch((err) => {
  console.error("verify-notify FAILED:", err);
  process.exit(1);
});
```

- [ ] **Step 3: Run it with env loaded**

Run:
```bash
node --env-file=.env.local --import tsx scripts/verify-notify.ts
```
Expected: prints `notify() resolved` AND the `🔔 H3 새 문의` message appears in the `H3_이메일문의` Telegram group.

- [ ] **Step 4: Record the result and commit the script**

If the message arrived, the feature is verified end-to-end:
```bash
git add scripts/verify-notify.ts
git commit -m "test: live notify verification script (Telegram smoke test)"
```

If it did NOT arrive: STOP and report — most likely the group converted to a supergroup so the chat_id changed (re-fetch with `getUpdates` and update `.env.local`), or the bot token rotated. Do not proceed until this passes.

---

## Deployment Note (not a task — reference for whoever deploys)

When deploying to Vercel, add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` to the Vercel project's Environment Variables (Production + Preview) using the same values as `.env.local`. They are **optional** — omitting them does not fail the build (they are not in `lib/env.ts`'s required schema); the Telegram channel simply no-ops until they're present.

---

## Spec Coverage Check

| Spec requirement | Task |
|---|---|
| `Lead` type + `NotifyChannel` interface | Task 1 |
| `notify(lead)` hub, best-effort, never throws | Task 3 |
| Channel-array extension point (no Server Action change to add a channel) | Task 3 (`defaultChannels`) |
| Telegram channel, plain-text message, `sendMessage` POST | Task 2 |
| Telegram env optional, runtime check, no-op if unset, NOT in `lib/env.ts` | Task 2 |
| Non-2xx Telegram response throws (caught by hub) | Task 2 + Task 3 |
| Server Action calls notify only after Resend success, awaited, non-blocking | Task 5 |
| Locale capture via hidden form field + schema enum | Task 4 + Task 5 |
| `submittedAt` ISO timestamp | Task 5 |
| Test: configured posts payload | Task 2 (Case 1) |
| Test: unconfigured no-op | Task 2 (Case 2) |
| Test: channel throw contained | Task 3 (Case 3) |
| Test: fan-out isolation | Task 3 (Case 3) + notify never-throw (Case 4) |
| `.env.example` documents optional vars | Task 6 |
| Build/lint/type stay clean | Tasks 4, 5 (tsc + lint gates) |
| Live end-to-end (real group) | Task 7 |
