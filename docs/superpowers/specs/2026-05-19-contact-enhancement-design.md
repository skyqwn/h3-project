# Contact Page Enhancement — Design Spec

**Date:** 2026-05-19
**Status:** Approved (brainstorming) → ready for implementation plan
**Topic:** Two-step wizard contact form with react-hook-form validation,
composite email field, file attachment, shadcn-sourced inputs themed to
the existing brand.

## Goal

Replace the current single-step contact form with a two-step wizard that
has real client-side validation (react-hook-form + zod), a composite
email field (local part + domain select), and an optional file
attachment delivered as a Resend email attachment. No new backend or
storage. The contact page stays form-only (no supporting content).

## Background / current state

- `app/[locale]/contact/page.tsx` — server component, renders subtitle +
  `DisplayHeading` + `<ContactForm>` in a `max-w-form` (640px) column.
- `components/ui/ContactForm.tsx` — client, `useActionState` + Server
  Action `submitContact`. Fields: name, email, company (optional),
  message, hidden locale, honeypot, Turnstile token. Client validation =
  HTML `required`/`maxLength` only (no per-field messages). Success and
  error states already implemented.
- `lib/contact-schema.ts` — `ContactInputSchema` (zod): name, email,
  company, message, locale, turnstileToken, honeypot.
- `actions/contact.ts` — zod validate → Resend email → notify hub
  (Telegram, best-effort, never throws, runs only after Resend success).
- Stack constraints (AGENTS.md): Next 16 App Router, React 19, Tailwind
  v4 CSS-first `@theme`, fixed light theme (NO dark mode), DESIGN.md is
  the design source of truth, i18n parity enforced (`pnpm run
  check:i18n`), pnpm only, `--spacing-{xs..xl}` is a forbidden token
  namespace, notify channels are added in `lib/notify/`, never by
  editing `actions/contact.ts`.

## Decisions (locked during brainstorming)

1. **Two-step wizard** (single RHF form, step-gated).
2. **react-hook-form + @hookform/resolvers/zod**, reusing/extending the
   existing zod schema so client and server validate against one source.
3. **File** delivered as a **Resend email attachment** (no storage). Single
   file, ≤5MB, types: pdf, png, jpg/jpeg, doc/docx, xls/xlsx. Optional.
4. **Purpose** select: `product` (제품·견적 문의), `technical` (기술
   상담), `partnership` (협력·파트너십), `etc` (기타).
5. **Page stays form-only** (no contact panel / FAQ / map).
6. **Components:** scaffold shadcn `Input` + `Select` (Radix) into the
   repo, **restyled to DESIGN.md brand tokens, dark mode removed**. Do
   not adopt shadcn's default theme. Keep existing `Button.tsx`.
7. **Email composite field** is a client-only UX concern; the zod schema
   keeps a single `email` string (server remains source of truth).
8. Telegram notify stays text-only; it mentions the attachment filename
   but does not send the file.

## Form structure

### Step 1 — 연락처 & 목적 (all required)

| Field | Validation | Component |
|-------|-----------|-----------|
| `company` 회사명 | required, 1–120 | shadcn Input |
| `contactName` 담당자명 | required, 1–120 | shadcn Input |
| `phone` 전화번호 | required, regex `^[0-9+\-\s]{8,20}$` | shadcn Input |
| `email` 이메일 | composite (below), final must be a valid email ≤200 | composite |
| `purpose` 문의목적 | required, enum product\|technical\|partnership\|etc | shadcn Select |

"다음" button calls RHF `trigger([...step1 fields])`; advances to step 2
only if step 1 is valid. Focus moves to the first step-2 field.

### Step 2 — 상세 내용

| Field | Validation | Component |
|-------|-----------|-----------|
| `message` 문의내용 | required, 1–2000 | textarea (styled to tokens) |
| `file` 첨부파일 | optional; ≤5MB; pdf/png/jpg/jpeg/doc/docx/xls/xlsx | file input |
| Turnstile | token required before submit (submit disabled until present) | existing widget |

"이전" returns to step 1 preserving entered values (single RHF form, no
remount). Submit on step 2.

### Composite email field (Step 1)

Layout: `[ localPart input ] @ [ domain input ] [ domain Select ]`

- Domain `Select` options (in order): `직접입력` (custom), `gmail.com`,
  `naver.com`, `daum.net`, `hanmail.net`, `nate.com`, `outlook.com`,
  `icloud.com`.
- `직접입력` selected → domain input is **editable** (user types the
  domain).
- A preset selected → domain input shows the selected value and is
  **`disabled`**.
- RHF holds `emailLocal` and `emailDomain` (and the select state).
  Before validation/submit they compose into `email =
  ${emailLocal}@${emailDomain}`; zod validates the composed `email`.
- Field-level validation: `emailLocal` required, no spaces or `@`;
  `emailDomain` required, hostname-shaped (`x.y`); composed value must
  pass `z.string().email()`. Messages are i18n keys.

## Architecture

- One `react-hook-form` instance for the whole form. Resolver:
  `zodResolver` over a **client schema** derived from
  `ContactInputSchema` (adds `emailLocal`/`emailDomain` shaping; keeps
  `email` as the composed value). `step` state is local `useState<1|2>`.
- Final submit: RHF `handleSubmit` builds a `FormData` (text fields +
  `file` blob + composed `email` + `locale` + `turnstileToken` +
  `honeypot`) and invokes the existing `submitContact` Server Action via
  `useActionState` (kept for `isPending` and the result banner/success
  screen). Server **re-validates** with the (extended) server schema —
  client validation is UX only, never trusted.
- Success state resets the RHF form and returns to step 1 (reuses the
  existing success UI: "다시 보내기" / "홈").

## Schema changes — `lib/contact-schema.ts`

- Rename `name` → `contactName`. Promote `company` to required.
- Add `contactName`, `phone` (regex above), `purpose`
  (`z.enum(["product","technical","partnership","etc"])`).
- Add `file`: server-side validation only — accept `File | undefined`;
  if present, enforce size ≤ 5 * 1024 * 1024 and an allowed MIME / ext
  allowlist. The client mirrors this with a `superRefine` for inline
  errors before submit.
- Keep `email` (single string, ≤200, `.email()`), `message` (1–2000),
  `locale`, `turnstileToken`, `honeypot` as-is.
- Export a `ContactClientSchema` (adds `emailLocal`/`emailDomain` and
  the compose refinement) used only by the form resolver; the server
  imports the existing/extended `ContactInputSchema`.

## Backend — `actions/contact.ts` + `next.config.ts`

- Read `file` from `FormData`. Validate via the server schema. On
  success, add it to the Resend send as an attachment
  (`{ filename, content: base64 }`). Include `company`, `contactName`,
  `phone`, localized `purpose` label in the email body.
- Notify hub call is unchanged structurally (text, best-effort). The
  lead shape it receives must be updated for the renamed/added fields
  (`name`→`contactName`, plus `company`/`phone`/`purpose`/optional
  attachment filename); update the lead type + the existing channel's
  text formatting in `lib/notify/` accordingly. No NEW channel, and no
  edits to `actions/contact.ts` to add a channel (rule honored) — only
  the lead payload/type and the existing formatter change.
- `next.config.ts`: set `serverActions.bodySizeLimit: "6mb"` (5MB file +
  field overhead). Verify the exact Next 16 option name in
  `node_modules/next/dist/docs/` before writing it.

## Components — shadcn, themed to brand

- Run the shadcn CLI configured for Tailwind v4 + React 19. Scaffold
  only `Input` and `Select` into `components/ui/` (kebab-case files per
  shadcn convention, e.g. `components/ui/input.tsx`,
  `components/ui/select.tsx`). Add `lib/utils.ts` `cn()`.
- New deps: `@radix-ui/react-select`, `class-variance-authority`,
  `tailwind-merge`, `clsx`, `lucide-react`.
- Restyle the scaffolded components to DESIGN.md tokens (canvas/cream
  surfaces, `--color-primary` #e60023 focus/active, `--color-ash`
  borders, existing radii). **Remove all dark-mode `dark:` variants and
  any `.dark` selector.** Do not introduce shadcn's `--background` /
  `--foreground` HSL variable convention into `@theme`; map to existing
  tokens instead.
- Must not add `--spacing-{xs,sm,md,lg,xl}` to `@theme` (documented
  collision). Must not modify the existing token block beyond additive,
  non-colliding entries if strictly needed. `Button.tsx` and existing
  primitives are untouched.
- The wizard's text inputs, purpose select, and email-domain select all
  use these themed components for visual consistency.

## i18n

Every new user-facing string (field labels, placeholders, validation
messages, purpose option labels, step labels / "다음" / "이전" / file
hint + size/type error, email parts) goes into BOTH `messages/ko.json`
and `messages/en.json` under the `contact` tree, rendered via
`next-intl` (`t(...)`), never hardcoded. `pnpm run check:i18n` must pass.

## Error handling / edge cases

- Step 1 invalid → "다음" blocked, inline errors shown, focus first
  invalid field.
- File too large / disallowed type → inline error before submit (client
  `superRefine`); server re-rejects as a fallback with the generic
  error banner.
- Turnstile not completed → submit button disabled; server rejects as a
  fallback.
- Server/Resend failure → existing error banner. Notify hub failure is
  swallowed (unchanged behavior).
- Success → existing success screen; "다시 보내기" resets RHF to a clean
  step 1.
- Reduced motion / a11y: `aria-invalid`, error text associated via
  `aria-describedby`, focus management on step change, Radix Select
  keyboard nav.

## Testing

- Unit (tsx suite): extend contact-schema tests — `contactName`,
  `phone` regex (valid/invalid), `purpose` enum, file size/type
  refinement (under/over/limit, allowed/disallowed), email compose
  (local+domain → valid/invalid), honeypot still rejects.
- `pnpm run check:i18n` parity, `pnpm exec tsc --noEmit`, `pnpm run
  lint` all green.
- Manual / script: extend `scripts/verify-contact-flow.ts` or manually
  verify wizard navigation, validation gating, and that an attachment
  arrives in the Resend email and the Telegram text mentions it.

## Out of scope (YAGNI)

Object storage, multiple-file upload, supporting page content (contact
panel / map / FAQ), sending the file to Telegram, replacing existing
`Button`/primitives, dark mode, any full shadcn theme adoption.

## File map

- Modify: `lib/contact-schema.ts`, `actions/contact.ts`,
  `components/ui/ContactForm.tsx`, `app/[locale]/contact/page.tsx`
  (only if layout wrapper needs width change), `next.config.ts`,
  `messages/ko.json`, `messages/en.json`,
  `tests/unit/contact-schema.test.ts` (or the relevant existing test),
  `package.json` / lockfile.
- Create: `components/ui/input.tsx`, `components/ui/select.tsx`,
  `lib/utils.ts`, optional `components/ui/contact/Step1.tsx` /
  `Step2.tsx` / `EmailField.tsx` if `ContactForm.tsx` grows unwieldy
  (split by responsibility, decided in the plan).
