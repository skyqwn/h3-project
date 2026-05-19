# Contact Page Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the single-step contact form into a two-step react-hook-form wizard with per-field validation, a composite email field (local part + domain select), and an optional file attachment delivered via the Resend email — using shadcn-style Input/Select components themed to the existing brand.

**Architecture:** One react-hook-form instance, `zodResolver` over a client schema derived from the existing zod schema; a local `step` state gates step 1 → step 2 via `trigger()`. Final submit builds `FormData` (incl. the file) and calls the existing `submitContact` Server Action, which re-validates server-side (source of truth) and attaches the file to the Resend send. Inputs/selects are Radix-based components hand-authored to shadcn's structure but styled only with DESIGN.md `@theme` tokens (no dark mode).

**Tech Stack:** Next 16 (App Router, Server Actions), React 19, TypeScript strict, Tailwind v4 (`@theme`), next-intl, zod, react-hook-form + @hookform/resolvers, @radix-ui/react-select, class-variance-authority, clsx, tailwind-merge, lucide-react, Resend, tsx unit runner.

**Spec:** `docs/superpowers/specs/2026-05-19-contact-enhancement-design.md`

---

## File Structure

- `lib/utils.ts` (new) — `cn()` class merge helper.
- `components/ui/input.tsx` (new) — themed text input primitive.
- `components/ui/select.tsx` (new) — Radix Select primitive, themed.
- `components/ui/contact/EmailField.tsx` (new) — composite local@domain field.
- `components/ui/contact/Step1.tsx` (new) — step 1 fields.
- `components/ui/contact/Step2.tsx` (new) — step 2 fields.
- `components/ui/ContactForm.tsx` (rewrite) — RHF wizard host.
- `lib/contact-schema.ts` (modify) — server + client schemas, new fields.
- `actions/contact.ts` (modify) — parse new fields + file, attach to Resend.
- `lib/notify/types.ts` (modify) — `Lead` shape.
- `lib/notify/channels/telegram.ts` (modify) — formatter for new fields.
- `next.config.ts` (modify) — `serverActions.bodySizeLimit`.
- `messages/ko.json`, `messages/en.json` (modify) — `contact` tree.
- `tests/unit/contact-schema.test.ts` (new) + `tests/unit/run.ts` (modify).
- `package.json` / lockfile (modify) — new deps.

> **Note on shadcn:** the spec says "scaffold via the shadcn CLI". The CLI is interactive, network-bound, and rewrites `components.json`/`globals.css`, which would risk the carefully tuned Tailwind v4 `@theme` and the `--spacing-*` collision rule. This plan instead **hand-authors** `input.tsx`/`select.tsx` to the exact shadcn structure (Radix + cva + `cn`) but styled only with existing tokens and **no `dark:` variants**. Same result, deterministic, no CLI risk. This is an intentional, spec-aligned deviation.

---

### Task 1: Dependencies + `cn()` utility

**Files:**
- Modify: `package.json` (via pnpm)
- Create: `lib/utils.ts`

- [ ] **Step 1: Install runtime deps**

Run:
```bash
pnpm add react-hook-form @hookform/resolvers @radix-ui/react-select class-variance-authority clsx tailwind-merge lucide-react
```
Expected: all added to `dependencies`; `pnpm-lock.yaml` updated; no peer-dep errors for React 19 (these versions support React 19).

- [ ] **Step 2: Create the `cn` helper**

Create `lib/utils.ts`:
```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 3: Verify typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml lib/utils.ts
git commit -m "chore: add RHF + radix-select + cn util for contact wizard"
```

---

### Task 2: Contact schema — server schema with new fields

**Files:**
- Modify: `lib/contact-schema.ts`
- Create: `tests/unit/contact-schema.test.ts`
- Modify: `tests/unit/run.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/contact-schema.test.ts`:
```ts
import assert from "node:assert/strict";
import {
  ContactInputSchema,
  PURPOSES,
  MAX_FILE_BYTES,
  ALLOWED_FILE_EXT,
} from "../../lib/contact-schema";

(async () => {
  const base = {
    company: "H3",
    contactName: "홍길동",
    phone: "010-1234-5678",
    email: "a@b.com",
    purpose: "product",
    message: "안녕하세요",
    locale: "ko",
    turnstileToken: "tok",
    honeypot: "",
  };

  assert.equal(ContactInputSchema.safeParse(base).success, true, "valid input passes");

  assert.equal(
    ContactInputSchema.safeParse({ ...base, company: "" }).success,
    false,
    "company is required"
  );
  assert.equal(
    ContactInputSchema.safeParse({ ...base, contactName: "" }).success,
    false,
    "contactName is required"
  );
  assert.equal(
    ContactInputSchema.safeParse({ ...base, phone: "abc" }).success,
    false,
    "phone rejects letters"
  );
  assert.equal(
    ContactInputSchema.safeParse({ ...base, phone: "+82 10 1234 5678" }).success,
    true,
    "phone allows + space digits"
  );
  assert.equal(
    ContactInputSchema.safeParse({ ...base, purpose: "nope" }).success,
    false,
    "purpose enum enforced"
  );
  assert.equal(
    ContactInputSchema.safeParse({ ...base, email: "notanemail" }).success,
    false,
    "email must be valid"
  );
  assert.equal(
    ContactInputSchema.safeParse({ ...base, honeypot: "x" }).success,
    false,
    "honeypot must stay empty"
  );

  assert.deepEqual(
    PURPOSES,
    ["product", "technical", "partnership", "etc"],
    "purpose options stable"
  );
  assert.equal(MAX_FILE_BYTES, 5 * 1024 * 1024, "5MB cap");
  assert.ok(
    ALLOWED_FILE_EXT.includes("pdf") && ALLOWED_FILE_EXT.includes("docx"),
    "allowed ext list"
  );

  console.log("contact-schema.test: 11 assertions passed.");
})().catch((err) => {
  console.error("contact-schema.test FAILED:", err);
  process.exit(1);
});
```

- [ ] **Step 2: Register the test and run it (expect fail)**

In `tests/unit/run.ts`, add after the last import line `import "./rehype-image-dimensions.test";`:
```ts
import "./contact-schema.test";
```
Run: `pnpm exec tsx tests/unit/contact-schema.test.ts`
Expected: FAIL — `PURPOSES`/`MAX_FILE_BYTES`/`ALLOWED_FILE_EXT` not exported, `contactName`/`phone`/`purpose` unknown.

- [ ] **Step 3: Rewrite the schema**

Replace the entire contents of `lib/contact-schema.ts`:
```ts
import { z } from "zod";

export const PURPOSES = [
  "product",
  "technical",
  "partnership",
  "etc",
] as const;
export type Purpose = (typeof PURPOSES)[number];

export const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_FILE_EXT = [
  "pdf",
  "png",
  "jpg",
  "jpeg",
  "doc",
  "docx",
  "xls",
  "xlsx",
] as const;

// Loose phone rule: digits, spaces, +, -, 8–20 chars. Avoids
// over-strict locale formats while blocking junk.
const phone = z
  .string()
  .trim()
  .regex(/^[0-9+\-\s]{8,20}$/, "invalid phone");

export const ContactInputSchema = z.object({
  company: z.string().trim().min(1).max(120),
  contactName: z.string().trim().min(1).max(120),
  phone,
  email: z.string().trim().email().max(200),
  purpose: z.enum(PURPOSES),
  message: z.string().trim().min(1).max(2000),
  locale: z.enum(["ko", "en"]).default("ko"),
  turnstileToken: z.string().min(1),
  honeypot: z.string().max(0, "spam detected").optional().default(""),
});

export type ContactInput = z.infer<typeof ContactInputSchema>;

export type ContactResult = { ok: true } | { ok: false; error: string };

// File validation lives server-side (a real File/Blob from FormData).
// Returns an error message key or null when ok / absent (file optional).
export function validateUpload(
  file: File | null
): "contact.form.fileTooLarge" | "contact.form.fileType" | null {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_FILE_BYTES) return "contact.form.fileTooLarge";
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_FILE_EXT.includes(ext as (typeof ALLOWED_FILE_EXT)[number]))
    return "contact.form.fileType";
  return null;
}
```

- [ ] **Step 4: Run the test (expect pass)**

Run: `pnpm exec tsx tests/unit/contact-schema.test.ts`
Expected: `contact-schema.test: 11 assertions passed.`

- [ ] **Step 5: Commit**

```bash
git add lib/contact-schema.ts tests/unit/contact-schema.test.ts tests/unit/run.ts
git commit -m "feat: contact schema — contactName, phone, purpose, file rules"
```

---

### Task 3: Client schema (email compose + file refine)

**Files:**
- Modify: `lib/contact-schema.ts`
- Modify: `tests/unit/contact-schema.test.ts`

- [ ] **Step 1: Add failing assertions**

In `tests/unit/contact-schema.test.ts`, before the final `console.log`, insert:
```ts
  const { ContactClientSchema, composeEmail } = await import(
    "../../lib/contact-schema"
  );
  assert.equal(composeEmail("user", "gmail.com"), "user@gmail.com", "compose");
  const cbase = {
    company: "H3",
    contactName: "홍길동",
    phone: "010-1234-5678",
    emailLocal: "user",
    emailDomain: "gmail.com",
    purpose: "product",
    message: "hi",
    locale: "ko",
    turnstileToken: "t",
    honeypot: "",
  };
  assert.equal(ContactClientSchema.safeParse(cbase).success, true, "client ok");
  assert.equal(
    ContactClientSchema.safeParse({ ...cbase, emailLocal: "a b" }).success,
    false,
    "local part rejects space"
  );
  assert.equal(
    ContactClientSchema.safeParse({ ...cbase, emailDomain: "nodot" }).success,
    false,
    "domain must look like a hostname"
  );
```
Update the final log line count from `11` to `15` and the message to `contact-schema.test: 15 assertions passed.`

- [ ] **Step 2: Run (expect fail)**

Run: `pnpm exec tsx tests/unit/contact-schema.test.ts`
Expected: FAIL — `ContactClientSchema` / `composeEmail` not exported.

- [ ] **Step 3: Append client schema to `lib/contact-schema.ts`**

Append at the end of `lib/contact-schema.ts`:
```ts
export function composeEmail(local: string, domain: string): string {
  return `${local.trim()}@${domain.trim()}`;
}

// Client-only shape: the form holds local + domain separately and the
// resolver validates the composed address. The server still validates
// the single composed `email` via ContactInputSchema (source of truth).
export const ContactClientSchema = z
  .object({
    company: z.string().trim().min(1).max(120),
    contactName: z.string().trim().min(1).max(120),
    phone,
    emailLocal: z
      .string()
      .trim()
      .min(1)
      .regex(/^[^\s@]+$/, "invalid email local part"),
    emailDomain: z
      .string()
      .trim()
      .min(1)
      .regex(
        /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "invalid email domain"
      ),
    purpose: z.enum(PURPOSES),
    message: z.string().trim().min(1).max(2000),
    locale: z.enum(["ko", "en"]).default("ko"),
    turnstileToken: z.string().min(1),
    honeypot: z.string().max(0).optional().default(""),
  })
  .refine(
    (v) =>
      z
        .string()
        .email()
        .safeParse(composeEmail(v.emailLocal, v.emailDomain)).success,
    { message: "invalid email", path: ["emailDomain"] }
  );

export type ContactClientInput = z.infer<typeof ContactClientSchema>;

export const EMAIL_DOMAINS = [
  "gmail.com",
  "naver.com",
  "daum.net",
  "hanmail.net",
  "nate.com",
  "outlook.com",
  "icloud.com",
] as const;
```

- [ ] **Step 4: Run (expect pass)**

Run: `pnpm exec tsx tests/unit/contact-schema.test.ts`
Expected: `contact-schema.test: 15 assertions passed.`

- [ ] **Step 5: Commit**

```bash
git add lib/contact-schema.ts tests/unit/contact-schema.test.ts
git commit -m "feat: client contact schema with composed email + domain list"
```

---

### Task 4: Notify lead shape + telegram formatter

**Files:**
- Modify: `lib/notify/types.ts`
- Modify: `lib/notify/channels/telegram.ts`
- Modify: `tests/unit/notify.test.ts`

- [ ] **Step 1: Update the failing test first**

Open `tests/unit/notify.test.ts`. Find every object literal passed as a `Lead` (it currently uses `name`, `company`, `message`, `email`, `locale`, `submittedAt`). For each, replace `name:` with `contactName:` and add `phone: "010-0000-0000", purpose: "product", attachmentName: null,`. Add one assertion after an existing `formatMessage`/send assertion:
```ts
// new-field formatting smoke (telegram formatter is pure on Lead shape)
import { telegramChannel } from "../../lib/notify/channels/telegram";
assert.ok(typeof telegramChannel.send === "function", "telegram channel intact");
```

- [ ] **Step 2: Run (expect fail)**

Run: `pnpm exec tsx tests/unit/notify.test.ts`
Expected: FAIL — type/shape mismatch (`contactName`/`phone`/`purpose`/`attachmentName` not on `Lead`).

- [ ] **Step 3: Update the `Lead` type**

Replace `lib/notify/types.ts`:
```ts
export type Lead = {
  contactName: string;
  email: string;
  company: string;
  phone: string;
  purpose: "product" | "technical" | "partnership" | "etc";
  message: string;
  locale: "ko" | "en";
  attachmentName: string | null;
  submittedAt: string; // ISO 8601
};

export type NotifyChannel = {
  name: string;
  send: (lead: Lead) => Promise<void>;
};
```

- [ ] **Step 4: Update the telegram formatter**

In `lib/notify/channels/telegram.ts`, replace `formatMessage`:
```ts
const PURPOSE_LABEL: Record<Lead["purpose"], string> = {
  product: "제품·견적 문의",
  technical: "기술 상담",
  partnership: "협력·파트너십",
  etc: "기타",
};

function formatMessage(lead: Lead): string {
  return (
    "🔔 H3 새 문의\n" +
    `담당자: ${lead.contactName}\n` +
    `회사: ${lead.company || "—"}\n` +
    `전화: ${lead.phone}\n` +
    `이메일: ${lead.email}\n` +
    `목적: ${PURPOSE_LABEL[lead.purpose]}\n` +
    `첨부: ${lead.attachmentName || "—"}\n` +
    `언어: ${lead.locale}\n\n` +
    lead.message
  );
}
```

- [ ] **Step 5: Run (expect pass)**

Run: `pnpm exec tsx tests/unit/notify.test.ts`
Expected: notify test passes.

- [ ] **Step 6: Commit**

```bash
git add lib/notify/types.ts lib/notify/channels/telegram.ts tests/unit/notify.test.ts
git commit -m "feat: notify lead carries contactName/phone/purpose/attachment"
```

---

### Task 5: Server action — parse new fields + attach file; next.config limit

**Files:**
- Modify: `actions/contact.ts`
- Modify: `next.config.ts`

- [ ] **Step 1: Raise the Server Action body limit**

Replace `next.config.ts`:
```ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    serverActions: {
      // 5 MB attachment + form fields + base64 overhead.
      bodySizeLimit: "6mb",
    },
  },
};

export default withNextIntl(nextConfig);
```

- [ ] **Step 2: Rewrite the server action**

Replace `actions/contact.ts`:
```ts
"use server";

import { Resend } from "resend";
import { env } from "@/lib/env";
import {
  ContactInputSchema,
  validateUpload,
  type ContactResult,
} from "@/lib/contact-schema";
import { verifyTurnstile } from "@/lib/turnstile";
import { notify } from "@/lib/notify";

const PURPOSE_LABEL: Record<string, string> = {
  product: "제품·견적 문의",
  technical: "기술 상담",
  partnership: "협력·파트너십",
  etc: "기타",
};

export async function submitContact(
  _prev: ContactResult | null,
  formData: FormData
): Promise<ContactResult> {
  const parsed = ContactInputSchema.safeParse({
    company: formData.get("company"),
    contactName: formData.get("contactName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    purpose: formData.get("purpose"),
    message: formData.get("message"),
    locale: formData.get("locale") ?? "ko",
    turnstileToken: formData.get("turnstileToken"),
    honeypot: formData.get("honeypot") ?? "",
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  const input = parsed.data;

  const rawFile = formData.get("file");
  const file = rawFile instanceof File ? rawFile : null;
  const fileError = validateUpload(file);
  if (fileError) return { ok: false, error: fileError };

  const captchaOk = await verifyTurnstile(
    input.turnstileToken,
    env.TURNSTILE_SECRET_KEY
  );
  if (!captchaOk) return { ok: false, error: "Bot challenge failed" };

  const attachments =
    file && file.size > 0
      ? [
          {
            filename: file.name,
            content: Buffer.from(await file.arrayBuffer()),
          },
        ]
      : undefined;

  const resend = new Resend(env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: env.CONTACT_FROM_EMAIL,
    to: env.CONTACT_TO_EMAIL,
    subject: `[H3 contact] ${input.company} — ${PURPOSE_LABEL[input.purpose]}`,
    text:
      `Name: ${input.contactName} <${input.email}>\n` +
      `Company: ${input.company}\n` +
      `Phone: ${input.phone}\n` +
      `Purpose: ${PURPOSE_LABEL[input.purpose]}\n` +
      `Attachment: ${file?.name ?? "(none)"}\n\n` +
      `${input.message}`,
    attachments,
  });

  if (error) {
    console.error("Resend send error:", error);
    return { ok: false, error: "Send failed" };
  }

  await notify({
    contactName: input.contactName,
    email: input.email,
    company: input.company,
    phone: input.phone,
    purpose: input.purpose,
    message: input.message,
    locale: input.locale,
    attachmentName: file?.name ?? null,
    submittedAt: new Date().toISOString(),
  });

  return { ok: true };
}
```

- [ ] **Step 3: Verify typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add actions/contact.ts next.config.ts
git commit -m "feat: contact action parses new fields + Resend attachment"
```

---

### Task 6: i18n — contact tree (ko + en)

**Files:**
- Modify: `messages/ko.json`
- Modify: `messages/en.json`

- [ ] **Step 1: Replace the `contact` block in `messages/ko.json`**

Replace the entire `"contact": { ... }` object with:
```json
"contact": {
  "title": "문의",
  "subtitle": "이야기를 시작해 봅시다",
  "step": { "of": "{current} / {total} 단계", "next": "다음", "prev": "이전" },
  "form": {
    "company": "회사명",
    "contactName": "담당자명",
    "phone": "전화번호",
    "email": "이메일",
    "emailLocalPlaceholder": "아이디",
    "emailDomainCustom": "직접입력",
    "emailDomainPlaceholder": "도메인 입력",
    "purpose": "문의 목적",
    "purposePlaceholder": "목적을 선택하세요",
    "purposeProduct": "제품·견적 문의",
    "purposeTechnical": "기술 상담",
    "purposePartnership": "협력·파트너십",
    "purposeEtc": "기타",
    "message": "문의 내용",
    "file": "첨부파일 (선택)",
    "fileHint": "PDF·이미지·문서, 최대 5MB",
    "fileTooLarge": "파일이 5MB를 초과합니다.",
    "fileType": "허용되지 않는 파일 형식입니다.",
    "required": "필수 입력 항목입니다.",
    "invalidEmail": "이메일 형식이 올바르지 않습니다.",
    "invalidPhone": "전화번호 형식이 올바르지 않습니다.",
    "submit": "보내기",
    "submitting": "전송 중...",
    "turnstileWait": "잠시 후 전송 버튼이 활성화됩니다.",
    "success": "메시지가 전달되었습니다. 곧 답신드리겠습니다.",
    "error": "전송에 실패했습니다. 잠시 후 다시 시도해 주세요.",
    "again": "다시 문의하기",
    "home": "홈으로"
  }
}
```

- [ ] **Step 2: Replace the `contact` block in `messages/en.json`**

```json
"contact": {
  "title": "Contact",
  "subtitle": "Let's start a conversation",
  "step": { "of": "Step {current} / {total}", "next": "Next", "prev": "Back" },
  "form": {
    "company": "Company",
    "contactName": "Contact name",
    "phone": "Phone",
    "email": "Email",
    "emailLocalPlaceholder": "username",
    "emailDomainCustom": "Custom",
    "emailDomainPlaceholder": "enter domain",
    "purpose": "Purpose",
    "purposePlaceholder": "Select a purpose",
    "purposeProduct": "Product / quote",
    "purposeTechnical": "Technical consult",
    "purposePartnership": "Partnership",
    "purposeEtc": "Other",
    "message": "Message",
    "file": "Attachment (optional)",
    "fileHint": "PDF / image / document, 5MB max",
    "fileTooLarge": "File exceeds 5MB.",
    "fileType": "File type not allowed.",
    "required": "This field is required.",
    "invalidEmail": "Invalid email address.",
    "invalidPhone": "Invalid phone number.",
    "submit": "Send",
    "submitting": "Sending...",
    "turnstileWait": "The send button will enable shortly.",
    "success": "Message delivered. We'll get back to you soon.",
    "error": "Send failed. Please try again in a moment.",
    "again": "Send another",
    "home": "Back to home"
  }
}
```

- [ ] **Step 3: Verify parity**

Run: `pnpm run check:i18n`
Expected: `i18n parity OK` (key count updated, in sync).

- [ ] **Step 4: Commit**

```bash
git add messages/ko.json messages/en.json
git commit -m "i18n: contact wizard strings (ko + en)"
```

---

### Task 7: Themed `Input` primitive

**Files:**
- Create: `components/ui/input.tsx`

- [ ] **Step 1: Create the component**

Create `components/ui/input.tsx`:
```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.ComponentProps<"input">;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "w-full h-11 px-3 rounded-md bg-canvas text-body-md text-ink",
        "border border-ash placeholder:text-ash",
        "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30",
        "disabled:bg-surface-card disabled:text-mute disabled:cursor-not-allowed",
        "aria-[invalid=true]:border-error aria-[invalid=true]:ring-error/30",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
```

- [ ] **Step 2: Verify typecheck + lint**

Run: `pnpm exec tsc --noEmit && pnpm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/ui/input.tsx
git commit -m "feat: themed Input primitive"
```

---

### Task 8: Themed Radix `Select` primitive

**Files:**
- Create: `components/ui/select.tsx`

- [ ] **Step 1: Create the component**

Create `components/ui/select.tsx`:
```tsx
"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex w-full h-11 items-center justify-between rounded-md bg-canvas px-3",
      "border border-ash text-body-md text-ink",
      "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30",
      "disabled:bg-surface-card disabled:text-mute disabled:cursor-not-allowed",
      "data-[placeholder]:text-ash",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="size-4 text-mute" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = "SelectTrigger";

export const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      className={cn(
        "z-50 overflow-hidden rounded-md border border-hairline bg-surface-elevated",
        "shadow-lg min-w-[var(--radix-select-trigger-width)]",
        className
      )}
      {...props}
    >
      <SelectPrimitive.Viewport className="p-1">
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = "SelectContent";

export const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center",
      "rounded-sm py-2 pl-8 pr-2 text-body-md text-ink",
      "data-[highlighted]:bg-surface-card data-[highlighted]:outline-none",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex size-4 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="size-4 text-primary" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = "SelectItem";
```

- [ ] **Step 2: Verify typecheck + lint**

Run: `pnpm exec tsc --noEmit && pnpm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/ui/select.tsx
git commit -m "feat: themed Radix Select primitive"
```

---

### Task 9: `EmailField` composite component

**Files:**
- Create: `components/ui/contact/EmailField.tsx`

- [ ] **Step 1: Create the component**

Create `components/ui/contact/EmailField.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EMAIL_DOMAINS } from "@/lib/contact-schema";

const CUSTOM = "__custom__";

export function EmailField() {
  const t = useTranslations("contact.form");
  const { register, setValue, formState } = useFormContext();
  const [mode, setMode] = useState<string>(CUSTOM);
  const errors = formState.errors as Record<
    string,
    { message?: string } | undefined
  >;
  const err = errors.emailLocal?.message || errors.emailDomain?.message;

  return (
    <div>
      <label className="block text-body-sm text-ink mb-1" htmlFor="emailLocal">
        {t("email")}
      </label>
      <div className="flex items-center gap-2">
        <Input
          id="emailLocal"
          className="flex-1"
          placeholder={t("emailLocalPlaceholder")}
          aria-invalid={!!errors.emailLocal}
          {...register("emailLocal")}
        />
        <span className="text-ink">@</span>
        <Input
          className="flex-1"
          placeholder={t("emailDomainPlaceholder")}
          disabled={mode !== CUSTOM}
          aria-invalid={!!errors.emailDomain}
          {...register("emailDomain")}
        />
        <Select
          value={mode}
          onValueChange={(v) => {
            setMode(v);
            setValue("emailDomain", v === CUSTOM ? "" : v, {
              shouldValidate: true,
            });
          }}
        >
          <SelectTrigger className="w-40" aria-label={t("email")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={CUSTOM}>{t("emailDomainCustom")}</SelectItem>
            {EMAIL_DOMAINS.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {err && <p className="mt-1 text-body-sm text-error">{err}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck + lint**

Run: `pnpm exec tsc --noEmit && pnpm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/ui/contact/EmailField.tsx
git commit -m "feat: composite email field (local @ domain + select)"
```

---

### Task 10: Step 1 and Step 2 field groups

**Files:**
- Create: `components/ui/contact/Step1.tsx`
- Create: `components/ui/contact/Step2.tsx`

- [ ] **Step 1: Create `Step1.tsx`**

```tsx
"use client";

import { useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmailField } from "./EmailField";
import { PURPOSES } from "@/lib/contact-schema";

function Err({ name }: { name: string }) {
  const { formState } = useFormContext();
  const e = (formState.errors as Record<string, { message?: string }>)[name];
  if (!e?.message) return null;
  return <p className="mt-1 text-body-sm text-error">{e.message}</p>;
}

const PURPOSE_KEY: Record<string, string> = {
  product: "purposeProduct",
  technical: "purposeTechnical",
  partnership: "purposePartnership",
  etc: "purposeEtc",
};

export function Step1() {
  const t = useTranslations("contact.form");
  const { register, setValue, watch, formState } = useFormContext();
  const purpose = watch("purpose");

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-body-sm text-ink mb-1" htmlFor="company">
          {t("company")}
        </label>
        <Input
          id="company"
          aria-invalid={!!(formState.errors as Record<string, unknown>).company}
          {...register("company")}
        />
        <Err name="company" />
      </div>

      <div>
        <label
          className="block text-body-sm text-ink mb-1"
          htmlFor="contactName"
        >
          {t("contactName")}
        </label>
        <Input
          id="contactName"
          aria-invalid={
            !!(formState.errors as Record<string, unknown>).contactName
          }
          {...register("contactName")}
        />
        <Err name="contactName" />
      </div>

      <div>
        <label className="block text-body-sm text-ink mb-1" htmlFor="phone">
          {t("phone")}
        </label>
        <Input
          id="phone"
          inputMode="tel"
          aria-invalid={!!(formState.errors as Record<string, unknown>).phone}
          {...register("phone")}
        />
        <Err name="phone" />
      </div>

      <EmailField />

      <div>
        <label className="block text-body-sm text-ink mb-1">
          {t("purpose")}
        </label>
        <Select
          value={purpose}
          onValueChange={(v) =>
            setValue("purpose", v, { shouldValidate: true })
          }
        >
          <SelectTrigger aria-label={t("purpose")}>
            <SelectValue placeholder={t("purposePlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {PURPOSES.map((p) => (
              <SelectItem key={p} value={p}>
                {t(PURPOSE_KEY[p])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Err name="purpose" />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `Step2.tsx`**

```tsx
"use client";

import { useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";
import { ALLOWED_FILE_EXT } from "@/lib/contact-schema";

export function Step2({
  fileError,
}: {
  fileError: string | null;
}) {
  const t = useTranslations("contact.form");
  const { register, formState } = useFormContext();
  const accept = ALLOWED_FILE_EXT.map((e) => `.${e}`).join(",");
  const msgErr = (formState.errors as Record<string, { message?: string }>)
    .message;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-body-sm text-ink mb-1" htmlFor="message">
          {t("message")}
        </label>
        <textarea
          id="message"
          rows={6}
          aria-invalid={!!msgErr}
          className="w-full px-3 py-3 rounded-md bg-canvas border border-ash text-body-md text-ink focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 aria-[invalid=true]:border-error"
          {...register("message")}
        />
        {msgErr?.message && (
          <p className="mt-1 text-body-sm text-error">{msgErr.message}</p>
        )}
      </div>

      <div>
        <label className="block text-body-sm text-ink mb-1" htmlFor="file">
          {t("file")}
        </label>
        <input
          id="file"
          type="file"
          accept={accept}
          className="block w-full text-body-sm text-ink file:mr-3 file:rounded-md file:border-0 file:bg-secondary-bg file:px-3 file:py-2 file:text-button-sm file:cursor-pointer"
          {...register("file")}
        />
        <p className="mt-1 text-body-sm text-mute">{t("fileHint")}</p>
        {fileError && (
          <p className="mt-1 text-body-sm text-error">{t(fileError)}</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify typecheck + lint**

Run: `pnpm exec tsc --noEmit && pnpm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/ui/contact/Step1.tsx components/ui/contact/Step2.tsx
git commit -m "feat: contact wizard step field groups"
```

---

### Task 11: `ContactForm` wizard host (RHF + steps + submit)

**Files:**
- Modify: `components/ui/ContactForm.tsx` (full rewrite)

- [ ] **Step 1: Rewrite the component**

Replace the entire contents of `components/ui/ContactForm.tsx`:
```tsx
"use client";

import { useActionState, useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations, useLocale } from "next-intl";
import Script from "next/script";
import { submitContact } from "@/actions/contact";
import { Button } from "@/components/ui/Button";
import { Step1 } from "@/components/ui/contact/Step1";
import { Step2 } from "@/components/ui/contact/Step2";
import {
  ContactClientSchema,
  composeEmail,
  validateUpload,
  type ContactResult,
} from "@/lib/contact-schema";

declare global {
  interface Window {
    onTurnstileSuccess?: (token: string) => void;
  }
}

const STEP1_FIELDS = [
  "company",
  "contactName",
  "phone",
  "emailLocal",
  "emailDomain",
  "purpose",
] as const;

export function ContactForm({
  turnstileSiteKey,
}: {
  turnstileSiteKey: string;
}) {
  const t = useTranslations("contact.form");
  const tStep = useTranslations("contact.step");
  const locale = useLocale();

  const methods = useForm({
    resolver: zodResolver(ContactClientSchema),
    mode: "onTouched",
    defaultValues: {
      company: "",
      contactName: "",
      phone: "",
      emailLocal: "",
      emailDomain: "",
      purpose: "",
      message: "",
      locale,
      turnstileToken: "",
      honeypot: "",
    },
  });

  const [step, setStep] = useState<1 | 2>(1);
  const [fileError, setFileError] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [state, formAction, isPending] = useActionState<
    ContactResult | null,
    FormData
  >(submitContact, null);

  useEffect(() => {
    window.onTurnstileSuccess = (tok: string) => setToken(tok);
    return () => {
      delete window.onTurnstileSuccess;
    };
  }, []);

  if (state?.ok) {
    return (
      <div
        role="status"
        className="bg-success-pale text-success-deep rounded-md p-6 space-y-4"
      >
        <p className="text-body-md">{t("success")}</p>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="primary"
            size="md"
            className="cursor-pointer"
            onClick={() => window.location.reload()}
          >
            {t("again")}
          </Button>
          <Button href="/" variant="secondary" size="md">
            {t("home")}
          </Button>
        </div>
      </div>
    );
  }

  const goNext = async () => {
    const ok = await methods.trigger(STEP1_FIELDS as unknown as string[]);
    if (ok) setStep(2);
  };

  const onSubmit = methods.handleSubmit(async (values) => {
    const fileList = values.file as FileList | undefined;
    const file = fileList && fileList.length > 0 ? fileList[0] : null;
    const fErr = validateUpload(file);
    setFileError(fErr);
    if (fErr) return;

    const fd = new FormData();
    fd.set("company", values.company);
    fd.set("contactName", values.contactName);
    fd.set("phone", values.phone);
    fd.set("email", composeEmail(values.emailLocal, values.emailDomain));
    fd.set("purpose", values.purpose);
    fd.set("message", values.message);
    fd.set("locale", locale);
    fd.set("turnstileToken", token);
    fd.set("honeypot", values.honeypot ?? "");
    if (file) fd.set("file", file);

    formAction(fd);
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} className="space-y-6" noValidate>
        {state && !state.ok && (
          <div
            role="alert"
            className="bg-error-deep text-on-primary rounded-md p-3 text-body-sm"
          >
            {t("error")}
          </div>
        )}

        <p className="text-caption-md uppercase tracking-wider text-mute">
          {tStep("of", { current: step, total: 2 })}
        </p>

        {/* Honeypot — hidden from users; bots fill it and get rejected. */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden
          {...methods.register("honeypot")}
        />

        <div className={step === 1 ? "" : "hidden"}>
          <Step1 />
        </div>
        <div className={step === 2 ? "" : "hidden"}>
          <Step2 fileError={fileError} />
          <div
            className="cf-turnstile mt-4"
            data-sitekey={turnstileSiteKey}
            data-callback="onTurnstileSuccess"
          />
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js"
            strategy="afterInteractive"
          />
        </div>

        <div className="flex gap-3">
          {step === 2 && (
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="cursor-pointer"
              onClick={() => setStep(1)}
            >
              {tStep("prev")}
            </Button>
          )}
          {step === 1 ? (
            <Button
              type="button"
              variant="primary"
              size="md"
              className="cursor-pointer"
              onClick={goNext}
            >
              {tStep("next")}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              disabled={isPending || !token}
            >
              {isPending ? t("submitting") : t("submit")}
            </Button>
          )}
        </div>
        {step === 2 && !token && (
          <p className="text-body-sm text-mute">{t("turnstileWait")}</p>
        )}
      </form>
    </FormProvider>
  );
}
```

- [ ] **Step 2: Verify typecheck + lint**

Run: `pnpm exec tsc --noEmit && pnpm run lint`
Expected: no errors. If `zodResolver` generic complains, the resolver already infers from `ContactClientSchema`; do not add explicit `useForm<...>` generics (the schema default on `locale` makes input/output types differ — rely on inference).

- [ ] **Step 3: Commit**

```bash
git add components/ui/ContactForm.tsx
git commit -m "feat: two-step RHF contact wizard host"
```

---

### Task 12: Verification (typecheck, lint, tests, i18n, build, browser)

**Files:** none (verification only)

- [ ] **Step 1: Static checks**

Run: `pnpm exec tsc --noEmit && pnpm run lint && pnpm run check:i18n && pnpm run test:unit`
Expected: tsc clean; lint clean; `i18n parity OK`; `All unit tests passed.` (contact-schema 15, notify updated, others unchanged).

- [ ] **Step 2: Production build (kill dev server first)**

Per AGENTS.md (OOM machine): ensure no dev server / stray node before building.
Run: `pnpm build`
Expected: build succeeds; `/[locale]/contact` compiles; no Server Action body-limit or type errors.

- [ ] **Step 3: Manual browser pass (dev)**

Start one dev server (`pnpm dev`) and, using the browse skill on `http://localhost:3000/ko/contact`, verify:
- Step 1 blocks "다음" with inline errors when empty; advances when valid.
- Email: selecting a preset disables the domain input and shows the value; "직접입력" re-enables it; an invalid local part / domain shows an error.
- Purpose Select opens, is keyboard-navigable, themed (cream/red, no dark).
- Step 2: "이전" preserves entered values; oversized/wrong-type file shows the inline error; valid submit (with Turnstile) reaches the success state.
- `/en/contact` shows English strings; no console errors.

- [ ] **Step 4: Final commit (if any verification fixups were needed)**

```bash
git add -A
git commit -m "chore: contact wizard verification fixups"
```

- [ ] **Step 5: Hand back to the user**

Report status (DONE / DONE_WITH_CONCERNS), summarize what shipped, and ask whether to push to `main` (Vercel auto-deploys). Do not push without explicit user confirmation.

---

## Self-Review

**1. Spec coverage:**
- Two-step wizard → Tasks 11. RHF + zod resolver reusing schema → Tasks 2,3,11. Composite email → Tasks 3,9. File via Resend attachment + 5MB/type rules → Tasks 2,5. Purpose enum → Tasks 2,6,10. Page form-only → unchanged (`page.tsx` not modified; no supporting content added). shadcn-style themed Input/Select, no dark mode, tokens preserved → Tasks 7,8 (+ deviation note). Schema rename name→contactName, company required, phone/purpose → Task 2. Notify lead remap (no new channel, no action-edit-to-add-channel) → Task 4. next.config bodySizeLimit → Task 5. i18n ko+en parity → Task 6. Tests → Tasks 2,3,4,12. YAGNI out-of-scope honored (no storage/multi-file/FAQ/telegram file/Button replacement/dark mode). All spec sections covered.

**2. Placeholder scan:** No TBD/TODO; every code step has full code; commands have expected output. The shadcn-CLI deviation is explicitly justified, not a placeholder.

**3. Type consistency:** `ContactInputSchema` (server: company, contactName, phone, email, purpose, message, locale, turnstileToken, honeypot) vs `ContactClientSchema` (same minus email, plus emailLocal/emailDomain) — consistent across Tasks 2,3,5,11. `Lead` fields (contactName, email, company, phone, purpose, message, locale, attachmentName, submittedAt) consistent across Tasks 4,5 and telegram formatter. `validateUpload` signature consistent (Task 2 defn, used Tasks 5,11). `composeEmail` consistent (Tasks 3,11). `EMAIL_DOMAINS`/`PURPOSES`/`ALLOWED_FILE_EXT` exported in Tasks 2/3 and consumed in 9/10. i18n keys referenced in components all defined in Task 6. Consistent.
