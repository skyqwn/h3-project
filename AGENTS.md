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

## Reference docs

- Design system: `DESIGN.md`
- Specs: `docs/superpowers/specs/`
- Plans: `docs/superpowers/plans/`
