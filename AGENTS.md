<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# H3 — Project Guide (read this first)

Bilingual (KR/EN) company-intro marketing site. Any agent (Claude, Codex, etc.)
continuing this project should read this file. `CLAUDE.md` imports it via
`@AGENTS.md`, so it is the single shared source of truth.

## ⚠️ ALWAYS

- **Any user-facing text is bilingual.** Whenever you add, change, or remove
  ANY string a user sees (labels, headings, copy, button text, alt text, aria
  labels, error/success messages, metadata), you MUST update BOTH
  `messages/ko.json` AND `messages/en.json` with the same key tree, and the
  string must be rendered via next-intl (`t("...")`) — never hardcoded in JSX.
  Run `pnpm run check:i18n` before committing; it fails if the two locales
  drift. No text change is "small enough" to skip this.
- Run `pnpm exec tsc --noEmit` and `pnpm run lint` before committing.

## Stack

- **Next.js 16** (App Router, Turbopack), React 19, TypeScript strict
- **pnpm** is the package manager (NOT npm — `packageManager` is pinned). Use
  `pnpm`, `pnpm exec`, `pnpm dlx`.
- **Tailwind v4** (CSS-first `@theme` in `app/globals.css`)
- **next-intl** i18n: Korean at `/` (root), English at `/en`
- **GSAP** + `@gsap/react` + Lenis for scroll/entrance motion
- **MDX** product content (`content/products/{slug}.{ko,en}.mdx`)
- **Resend** (contact email) + **Cloudflare Turnstile** (bot gate) +
  **Telegram** notify hub
- Deployed on **Vercel** (auto-deploys on push to `main`)

## Commands

```bash
pnpm dev            # dev server
pnpm build          # production build (the deploy gate)
pnpm run test:unit  # tsx unit suite (mdx, turnstile, notify)
pnpm run check:i18n # ko.json / en.json key parity (must stay in sync)
pnpm run lint       # eslint (React-compiler rules are ON)
pnpm exec tsc --noEmit
node --env-file=.env.local --import tsx scripts/verify-notify.ts        # live Telegram smoke
node --env-file=.env.local --import tsx scripts/verify-contact-flow.ts  # full chain smoke
pnpm run verify:posts       # DB blog smoke (queries Neon)
pnpm run create:admin <id> <pw>   # create/update an /admin account (upsert)
```

## Hard-won conventions / gotchas (do not relearn these)

- **Tailwind v4 `--spacing-*` collision:** do NOT define `--spacing-{xs,sm,md,lg,xl}`
  in `@theme` — that namespace also drives `max-w-*`/`w-*`. Only
  `--spacing-{xxs,xxl,section}` + container tokens are custom; use Tailwind's
  numeric scale (`p-2`, `p-4`, `p-6`, `p-16`) for the rest.
- **Light theme is fixed.** No dark mode. Design system = Pinterest-derived
  `DESIGN.md` (warm cream/white + `#e60023` red CTA/wordmark). Treat `DESIGN.md`
  as the design source of truth.
- **i18n parity is enforced.** Any new UI string goes in BOTH `messages/ko.json`
  and `messages/en.json`; `pnpm run check:i18n` must pass.
- **`middleware` → `proxy.ts`** (Next 16 renamed the convention). Don't recreate
  `middleware.ts`.
- **Env (`lib/env.ts`):** 5 required vars fail the build if missing
  (`RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`,
  `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`).
  `NEXT_PUBLIC_SITE_URL` and `TELEGRAM_*` are OPTIONAL.
- **Site URL auto-resolves** (`lib/seo.ts resolveSiteUrl`): explicit
  `NEXT_PUBLIC_SITE_URL` → Vercel `VERCEL_PROJECT_PRODUCTION_URL` (prod) →
  `VERCEL_URL` (preview) → `http://localhost:3000`. Don't hardcode the domain.
- **Notify hub** (`lib/notify/`): `notify(lead)` is best-effort and NEVER throws;
  it runs only AFTER a successful Resend send. Add channels in
  `lib/notify/index.ts` `defaultChannels` + a file under `lib/notify/channels/`
  — never edit `actions/contact.ts` to add a channel.
- **`.env.example` is gitignored** (local reference only, by user choice).
- **This machine OOMs easily.** Never run multiple dev servers; kill node
  processes before `pnpm build`. NEVER `rm -rf .next` while a dev server is
  running (corrupts the Turbopack cache). Use `--env-file` tsx scripts (not a
  dev server) for backend verification.

## Current state

- Full site shipped: home (GSAP hero), about, products (MDX list+detail),
  contact (Turnstile + Resend + Telegram notify), SEO (metadata, JSON-LD,
  sitemap, robots, dynamic OG), localized 404, mobile hamburger overlay.
- Live on Vercel; env vars set in the Vercel dashboard.
- Telegram notify verified end-to-end (group `H3_이메일문의`,
  chat_id `-5120610013`).
- **Blog is now DB-backed + authored from `/admin`** (see the Admin section
  above): editor, Blob image upload, drafts/edit/delete, gate+login auth. For
  the live "where we are / what's next" handoff, read
  `docs/superpowers/HANDOFF.md`.

## Admin (`/admin`) — blog authoring + auth

The blog is **DB-backed** (Neon Postgres + Drizzle, `lib/db/`); posts are written
from the site at `/admin`, not from mdx files. `/admin` lives outside `[locale]`
(Korean-only, `robots: noindex`).

- **Auth = 2 layers:** gate password → account login. `proxy.ts` guards `/admin/*`
  at the edge with **jose JWT httpOnly cookies** (`admin_gate` 30d, `admin_session`
  7d, signed with `AUTH_SECRET`). Server actions (`actions/admin/*`) and the
  blob-upload route also call `requireAdmin()` (`lib/auth/require-admin.ts`) — the
  redirect alone does not protect non-page entry points. jose-only helpers live in
  `lib/auth/session.ts` (edge-safe: no `next/headers`/bcrypt/DB import).
- **Passwords are bcrypt-hashed** in `users.passwordHash` (`$2b$…`, never plaintext;
  one-way). Login verifies with `bcrypt.compare`. Login id is **`username`** (plain
  id, not email — the column was renamed from `email`).
- **Accounts:** no public signup. Create/change with
  `pnpm run create:admin <id> <pw>` (upsert — re-run same id to change the password).
- **Authoring:** Tiptap markdown editor (`components/admin/`), cover + body image
  upload to **Vercel Blob** (`blog/<slug>/…`, store MUST be public — see memory),
  slug auto-defaults to today's date (editable; server auto-dedupes `-2`), draft vs
  publish, list/edit/delete. Public site hides drafts in prod (`getAllPosts` +
  `blog/[slug]` `notFound`).
- **Env (runtime-required for `/admin`, NOT in `lib/env.ts` build gate):**
  `AUTH_SECRET`, `ADMIN_GATE_PASSWORD`, `BLOB_READ_WRITE_TOKEN`, `DATABASE_URL`.
  Missing → only `/admin` breaks, public site still deploys. **Set all in the Vercel
  dashboard** for production `/admin` to work.

## Pending / deferred

- **Custom email domain:** sender is `onboarding@resend.dev` (Resend test
  sender — only delivers to the Resend signup email). To use
  `noreply@<domain>`: own a domain → Resend → Add Domain → add the DNS
  records → verify → set `CONTACT_FROM_EMAIL` (`.env.local` + Vercel) → no
  code change. No domain chosen yet.
- **Production Turnstile hostnames:** the Cloudflare widget must list every
  deploy domain (currently `localhost` + `h3-project.vercel.app`); add custom
  domain there too when it exists.
- Real `RESEND_API_KEY` / Turnstile keys are live in `.env.local` and Vercel.
- **Admin auth env on Vercel:** `AUTH_SECRET` + `ADMIN_GATE_PASSWORD` are in
  `.env.local` but must still be added to the Vercel dashboard before the deployed
  `/admin` works.
- **Admin follow-ups (deferred):** web UI for account/password change (only the
  `create:admin` script exists now), user management / roles, editor image orphan
  cleanup, drag-drop/paste image upload.

## Reference docs

- Design system: `DESIGN.md`
- Specs: `docs/superpowers/specs/`
- Plans: `docs/superpowers/plans/`
