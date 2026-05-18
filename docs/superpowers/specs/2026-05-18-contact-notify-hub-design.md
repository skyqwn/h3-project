# Contact Notification Hub — Design Spec

**Date:** 2026-05-18
**Status:** Draft — pending user review
**Type:** Backend-less feature addition (extends existing contact Server Action)

## Goal

When a visitor submits the contact form, the company team should get an instant notification in a channel they already watch (Telegram), in addition to the existing Resend email. The notification layer must be architected so new channels (auto-reply, Slack, DB persistence, CRM webhook) can be added later **without modifying the Server Action** — it is the foundation for a future "AX" automation layer, delivered now as notification-only.

## Scope

**In scope (v1):**
- A notification hub (`notify(lead)`) called from the contact Server Action after a successful Resend send.
- One channel implementation: Telegram (sends to a group so multiple people, including future employees, see it by group membership alone).
- Best-effort, non-blocking: notification failure never affects the user's success response.

**Out of scope (future, but the architecture must not preclude):**
- Auto-acknowledgement email to the submitter.
- Slack / Discord channels.
- Lead persistence (DB) and an admin dashboard.
- Retry queues / async workers.

## Constraints

- **No backend infra.** Runs inside the existing Next.js Server Action (Vercel serverless). No queue, no DB.
- **Must not break the Vercel build.** `lib/env.ts` parses required env at build time; Telegram credentials must be **optional** and live outside that required schema, so a deploy with no Telegram config still builds and runs.
- **Email is the source of truth.** Resend send is the guaranteed record; notification is a convenience layer layered on top.

## Premises

1. The contact Server Action (`actions/contact.ts`) is the single fan-out point — structured lead data (name, email, company, message, locale) is already in hand there; no email parsing needed.
2. A Telegram **group** (not a personal DM, not a channel) is the delivery target so adding people later is a group-invite, never a code/env change.
3. Notification credentials being absent is a normal, supported state (local dev, preview deploys) — the channel no-ops, the site is unaffected.

## Verified Setup (already done during brainstorming)

- Bot created via @BotFather: username `@h3_contact_bot`, privacy mode ON (bot only sends, never reads group chat — sufficient and safe for our send-only use).
- Group `H3_이메일문의` created; bot added as member.
- Resolved `chat_id`: `-5120610013` (regular group; **caveat:** if Telegram later auto-converts it to a supergroup the id changes and gains a `-100` prefix — re-fetch and update env if that happens).
- End-to-end `sendMessage` test posted successfully to the group (`"ok":true`, message visibly received).
- `.env.local` now holds real `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID=-5120610013`.

## Architecture

```
lib/notify/
├── types.ts              # Lead type + NotifyChannel interface
├── index.ts              # notify(lead): iterates channels, best-effort, never throws
└── channels/
    └── telegram.ts       # Telegram channel: no-op if unconfigured, else sendMessage
actions/contact.ts        # (modified) build Lead, await notify(lead) after Resend success
lib/contact-schema.ts     # (modified) add locale field to ContactInputSchema
components/ui/ContactForm.tsx # (modified) hidden locale input
.env.example              # (modified) document optional TELEGRAM_* vars
tests/unit/notify.test.ts # (new) unit suite
tests/unit/run.ts         # (modified) import notify.test
```

### Types (`lib/notify/types.ts`)

```ts
export type Lead = {
  name: string;
  email: string;
  company: string;   // "" when not provided
  message: string;
  locale: "ko" | "en";
  submittedAt: string; // ISO 8601
};

export type NotifyChannel = {
  name: string;
  send: (lead: Lead) => Promise<void>;
};
```

### Hub (`lib/notify/index.ts`)

- Holds a static channel list: `const channels: NotifyChannel[] = [telegramChannel];`
- `notify(lead)` iterates channels; each `send` is wrapped in try/catch that `console.error`s with the channel name and continues. `notify` itself **never throws** and resolves once all channels settle.
- Adding a channel later = import it + push to the array. The Server Action is never touched again.

### Telegram channel (`lib/notify/channels/telegram.ts`)

- Reads `process.env.TELEGRAM_BOT_TOKEN` and `process.env.TELEGRAM_CHAT_ID` at call time (not via the required `lib/env.ts`).
- If either is missing/empty → `console.info("telegram channel not configured, skipping")` and return (no-op). This is the property that keeps Vercel builds and unconfigured environments healthy.
- Otherwise POST to `https://api.telegram.org/bot<token>/sendMessage` with form body `chat_id`, `text`. **Plain text, no `parse_mode`** — avoids HTML/markdown injection from user-supplied fields entirely (no escaping logic to get wrong).
- Message format:
  ```
  🔔 H3 새 문의
  이름: {name}
  이메일: {email}
  회사: {company || "—"}
  언어: {locale}

  {message}
  ```
- Non-2xx response → throw (caught by the hub, logged, other channels/user unaffected).

### Data flow (modified `actions/contact.ts`)

```
form submit → submitContact
  → zod validate            (existing)
  → Turnstile verify        (existing)
  → Resend send             (existing) ── fails → return {ok:false}; notify NOT called
  → build Lead { name, email, company, message, locale, submittedAt }
  → await notify(lead)      (new) — best-effort fan-out, never throws
  → return { ok: true }     — regardless of notify outcome
```

**Locale capture:** the current `actions/contact.ts` does not receive a
locale. Resolution: `ContactForm` already knows the active locale
(`useLocale()`). Add a hidden input `<input type="hidden" name="locale"
value={locale} />` to the form, extend `ContactInputSchema` with
`locale: z.enum(["ko","en"]).default("ko")`, and read it in the action.
This is explicit and testable (no implicit request-context magic).
`submittedAt = new Date().toISOString()`.

## Failure Behavior

| Failure | User sees | Logged | Notes |
|---|---|---|---|
| Resend send fails | `{ ok:false }` error banner | yes | notify NOT attempted |
| Telegram not configured | `{ ok:true }` success | info line | by design (dev/preview) |
| Telegram HTTP/network error | `{ ok:true }` success | error w/ channel name | email already delivered |
| `notify()` internal throw | `{ ok:true }` success | error | hub guarantees no throw escapes |

Email (Resend) is the guaranteed record; notification is strictly additive.

## Environment

| Var | Required? | Where validated | Behavior if absent |
|---|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Optional | runtime, in telegram channel | channel no-ops |
| `TELEGRAM_CHAT_ID` | Optional | runtime, in telegram channel | channel no-ops |

These are intentionally **NOT** added to `lib/env.ts`'s required `EnvSchema` (that schema fails the build when a var is missing). `.env.example` gains both with a comment marking them optional and noting the group chat_id format.

## Testing (TDD, existing tsx pattern)

`tests/unit/notify.test.ts`, imported by `tests/unit/run.ts`, mocking `global.fetch`:

1. **Configured channel posts correct payload** — with token+chat_id set, `notify(lead)` issues one fetch to the Telegram `sendMessage` URL with a body containing the chat_id and the lead fields.
2. **Unconfigured channel is a no-op** — with token/chat_id unset, `notify(lead)` issues zero fetches and does not throw.
3. **Channel throw is contained** — a channel whose `send` rejects does not cause `notify()` to reject.
4. **Fan-out isolation** — given two channels where the first throws, the second still receives the lead.

(Tests stub `process.env` and `global.fetch`, restoring both afterward, matching the existing `turnstile.test.ts` style.)

## Success Criteria

1. Submitting the contact form with valid input + working Resend delivers the email AND posts the formatted message to the `H3_이메일문의` group.
2. With `TELEGRAM_*` unset, the form still succeeds and the build/site are unaffected (no thrown error, info log only).
3. A Telegram API failure does not change the user-facing result (still success if email sent) and is logged server-side.
4. Adding a hypothetical second channel requires touching only `lib/notify/index.ts` + a new file under `lib/notify/channels/` — `actions/contact.ts` diff is zero for that change.
5. `pnpm run test:unit` passes the 4 new assertions alongside the existing suites.
6. `pnpm exec tsc --noEmit` and `pnpm run lint` stay clean.

## Open Questions

None blocking. Future channels (auto-reply, Slack, DB) are deliberately deferred; the hub array + NotifyChannel interface is the extension point.

## References

- Existing contact pipeline: `actions/contact.ts`, `lib/contact-schema.ts`, `lib/turnstile.ts`
- Env validation pattern: `lib/env.ts`
- Unit test pattern: `tests/unit/turnstile.test.ts`, `tests/unit/run.ts`
