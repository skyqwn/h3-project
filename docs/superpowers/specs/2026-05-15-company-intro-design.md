# H3 Company Intro Site — Design Spec

**Date:** 2026-05-15
**Status:** Draft — pending user review
**Type:** Marketing site (frontend only, no backend infra)

## Brand

- Company name: **H3** (capital H, numeral 3). Render the wordmark and all metadata strings as `H3`.
- No logo asset yet. The header wordmark is a styled text mark for now. A visually-hidden `<h1>H3</h1>` is rendered in the header on every page so the brand name is the page's primary semantic heading (the "h1 behind logo" SEO pattern). The visible wordmark is wrapped in `aria-hidden="true"` to prevent duplicate announcement to screen readers.

## Goal

Build a bilingual (KR/EN) company-introduction marketing site that showcases the company's technology and products. The site reads like a magazine with a SpaceX-inspired full-bleed scroll-driven homepage, wrapped in the warm-cream + red-CTA chrome defined in `DESIGN.md` (Pinterest-derived design language). SEO is a first-class concern. There is no backend service; the contact form delivers email via Resend through a Next.js Server Action.

A reader arriving at the homepage should leave convinced that the company's product/technology is real, credible, and worth contacting.

## Constraints

- **No backend** beyond Next.js Server Actions and an external transactional email API (Resend).
- **SEO-first**: every page must be indexable, have unique metadata, dynamic OG images, hreflang alternates, and JSON-LD structured data.
- **Light theme fixed** — no dark mode toggle. `DESIGN.md` is light-canvas only.
- **Single-author content workflow** — content edits are by developers (no headless CMS).
- **Performance budget**: Lighthouse Performance, SEO, Accessibility, Best Practices all ≥ 90 on production. Core Web Vitals: LCP < 2.5s, CLS < 0.1, INP < 200ms.

## Premises

These are baseline assumptions that the design depends on. If any premise is wrong, the design needs revisiting.

1. The site is a marketing surface, not an app. There are no user accounts, no authenticated state, no DB.
2. Content cardinality is small enough that MDX files in a git repo are a better fit than a headless CMS (≤ ~30 products planned).
3. The team is comfortable with Tailwind, App Router server components, and TypeScript.
4. Vercel is acceptable as the deployment target (free tier supports the expected traffic; Server Actions and `@vercel/og` are first-class).
5. Korean is the primary audience; English is added for international visibility.
6. The contact form needs to deliver email to a single inbox, not integrate with a CRM.

## Stack

- **Framework:** Next.js 16 (latest, App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS with `darkMode: 'media'` disabled — light-fixed
- **i18n:** `next-intl` (latest, Korean = root, English = `/en` prefix)
- **Content:** MDX for products, JSON message catalogs for UI strings
- **Animation:** `gsap` + `@gsap/react` (`useGSAP` hook) + `gsap/ScrollTrigger`
- **Smooth scroll:** `lenis` synchronized with `ScrollTrigger`
- **Validation:** `zod` for MDX frontmatter and contact form payloads
- **Email:** Resend SDK called from a Server Action
- **Spam protection:** Cloudflare Turnstile (invisible) + honeypot field
- **Hosting:** Vercel (production = `main` branch, PR previews automatic)
- **Analytics:** Vercel Analytics + Speed Insights (one-line integration)
- **Testing:** TypeScript, ESLint, Playwright (3 E2E flows), Lighthouse CI

## Information Architecture

```
/                       (Korean home — scroll story)
/en                     (English home — scroll story)
/about                  (KR)
/en/about               (EN)
/products               (KR — product list)
/en/products            (EN — product list)
/products/[slug]        (KR — MDX-rendered product detail)
/en/products/[slug]     (EN — MDX-rendered product detail)
/contact                (KR — Resend-backed form)
/en/contact             (EN — Resend-backed form)
```

`hreflang` alternates between KR and EN versions are emitted via `generateMetadata`'s `alternates.languages`.

## Folder Structure

```
/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx                 # Header, Footer, LenisProvider, font setup
│   │   ├── page.tsx                   # Home — scroll story sections
│   │   ├── about/page.tsx
│   │   ├── products/
│   │   │   ├── page.tsx               # Product list (from MDX collection)
│   │   │   └── [slug]/page.tsx        # MDX-rendered product detail
│   │   ├── contact/page.tsx
│   │   ├── not-found.tsx              # Localized 404
│   │   └── opengraph-image.tsx        # Default per-locale OG image
│   ├── error.tsx                      # Global error boundary
│   ├── sitemap.ts                     # Static + dynamic routes × locales
│   ├── robots.ts
│   └── api/
│       └── (none — Server Actions only)
├── actions/
│   └── contact.ts                     # Server Action: zod validate → Resend
├── components/
│   ├── layout/
│   │   ├── Header.tsx                 # primary-nav, locale switcher, red CTA
│   │   ├── Footer.tsx                 # footer-section
│   │   ├── LocaleSwitcher.tsx
│   │   └── LenisProvider.tsx          # Smooth scroll + ScrollTrigger sync
│   ├── sections/
│   │   ├── Hero.tsx                   # Full-bleed media + headline + CTA
│   │   ├── FeatureCardRow.tsx         # Alternating left/right feature cards
│   │   ├── ProductShowcase.tsx        # Pin-grid teaser of products
│   │   ├── TechHighlights.tsx
│   │   └── CtaStrip.tsx               # hero-cta-strip (dark CTA band)
│   ├── primitives/
│   │   ├── ScrollReveal.tsx           # Viewport-enter fade-up wrapper
│   │   ├── ParallaxImage.tsx          # ScrollTrigger-driven parallax
│   │   ├── DisplayHeading.tsx         # Tracking + uppercase enforcement
│   │   └── GhostPill.tsx              # button-pill-on-image variant
│   └── ui/
│       ├── Button.tsx                 # button-primary / -secondary / -tertiary
│       ├── PinCard.tsx                # pin-card, pin-card-large
│       ├── FilterChip.tsx
│       ├── TextInput.tsx
│       └── ContactForm.tsx            # Wraps actions/contact.ts
├── content/
│   └── products/
│       ├── product-a.ko.mdx
│       ├── product-a.en.mdx
│       └── ...
├── messages/
│   ├── ko.json
│   └── en.json
├── lib/
│   ├── i18n.ts                        # next-intl config, locale list
│   ├── mdx.ts                         # Zod-validated MDX loader + collector
│   ├── seo.ts                         # generateMetadata helpers, JSON-LD builders
│   ├── gsap.ts                        # GSAP plugin registration, useGSAP wrapper
│   └── lenis.ts                       # Lenis client setup
├── middleware.ts                      # next-intl middleware (locale detection)
├── (Tailwind theme)                   # DESIGN.md tokens → Tailwind theme (CSS `@theme` for v4+, or tailwind.config.ts for v3)
├── next.config.mjs                    # MDX, image domains, env validation
└── public/
    ├── fonts/                         # Pin Sans (or Inter) self-hosted
    └── (images, video)
```

## Routing & i18n

- `next-intl` with `localePrefix: 'as-needed'` — Korean is served at `/`, English at `/en`. This is friendlier for the primary audience and SEO-equivalent (hreflang handles the alternation).
- `middleware.ts` runs `createMiddleware` to detect locale from path; first-time visitors are NOT auto-redirected based on `Accept-Language` (per Google's recommendation; serve the URL the user requested).
- All UI strings live in `messages/{locale}.json`. Hardcoding strings in JSX is forbidden; the lint config will flag string literals in JSX.
- Server components consume `getTranslations({ locale })`; client components use `useTranslations()`.
- Page metadata uses `getTranslations` server-side inside `generateMetadata` to emit localized titles, descriptions, OG fields, and `alternates.languages`.

## Content Model

### Products (MDX)

Each product is one MDX file per locale: `content/products/{slug}.{locale}.mdx`.

Frontmatter schema (validated by zod at load time):

```ts
const ProductFrontmatter = z.object({
  title: z.string().min(1),
  tagline: z.string().min(1),
  hero_image: z.string(),
  gallery: z.array(z.string()).optional(),
  specs: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  order: z.number().int(),
  draft: z.boolean().default(false),
});
```

The `slug` is derived from the filename, not stored in frontmatter (single source of truth).

`lib/mdx.ts` exports:
- `getAllProducts(locale)` — scans the directory, validates, sorts by `order`, filters drafts in production
- `getProduct(slug, locale)` — loads one MDX file
- `getAllProductSlugs()` — for `generateStaticParams`

Invalid frontmatter throws at build time, so broken content cannot reach production.

### UI Strings (JSON)

`messages/ko.json` and `messages/en.json` mirror the same key tree. Keys are dot-paths (`home.hero.headline`, `nav.products`, etc.). A CI check verifies key parity between the two files.

## Animation Strategy

### Stack Setup

- `gsap` + `@gsap/react` (the `useGSAP` hook handles cleanup and React strict mode safely)
- `gsap/ScrollTrigger` registered once in `lib/gsap.ts` (client-only)
- `lenis` instantiated in `components/layout/LenisProvider.tsx`

### Lenis ↔ ScrollTrigger Synchronization

Lenis intercepts native scroll, which breaks ScrollTrigger's default scroll listener. The sync pattern:

```ts
// LenisProvider (client component, mounted in [locale]/layout.tsx)
useEffect(() => {
  const lenis = new Lenis();
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return () => { lenis.destroy(); /* remove ticker callback */ };
}, []);
```

### Reduced-Motion Handling

`window.matchMedia('(prefers-reduced-motion: reduce)').matches`:
- Lenis is not instantiated.
- ScrollTrigger animations are skipped — elements render in their final state.
- Hero video plays muted but the ambient zoom transform is omitted.

### Animation Patterns

| Pattern | Where | Implementation |
|---|---|---|
| Hero ambient zoom | Homepage hero photo | 1.0 → 1.05 scale over 8s, infinite yoyo |
| Section reveal | Every section below hero | `ScrollReveal` primitive — 24px y-translate + opacity 0→1 on viewport enter |
| Parallax | Hero, FeatureCardRow images | `ParallaxImage` — y-translate keyed to scroll progress, scrub: true |
| Magnetic CTA | Primary red CTA on home hero | Tiny mouse-follow translate (≤ 6px), capped |
| Locale-switch transition | Header LocaleSwitcher | Brief 150ms opacity fade on route change |

No `SplitText` (commercial license). Headline word/character split, if needed, uses a small custom utility wrapping each character in a `span`.

Mobile (< 768px): ScrollTrigger `pin` is disabled; only fade reveals remain.

## SEO Strategy

### Per-Route Metadata

Every page exports `generateMetadata` returning:
- `title` (localized)
- `description` (localized)
- `openGraph` with locale-specific `images` (dynamic per route via `opengraph-image.tsx`)
- `twitter` card
- `alternates.canonical` and `alternates.languages` for hreflang

### Dynamic OG Images

`app/[locale]/opengraph-image.tsx` and `app/[locale]/products/[slug]/opengraph-image.tsx` use `next/og`'s `ImageResponse` to render OG images at request time. Templates use Pin Sans (or Inter) over canvas-white with the title and a red brand mark.

### Structured Data (JSON-LD)

- `Organization` — emitted in `[locale]/layout.tsx` (global)
- `Product` — emitted in `[locale]/products/[slug]/page.tsx`
- `BreadcrumbList` — on product detail pages
- `WebSite` with `potentialAction` searchAction — omitted (no on-site search)

Helpers live in `lib/seo.ts` and return typed JSON-LD objects rendered via `<Script type="application/ld+json">`.

### Sitemap & Robots

`app/sitemap.ts` collects:
- Static routes (about, products, contact, root home) × 2 locales
- All product slugs × 2 locales (`getAllProductSlugs()`)
- `lastmod` from the file mtime of the MDX source

`app/robots.ts` allows all in production; disallows all in preview deployments (detected via `VERCEL_ENV`).

### Performance

- `next/font/local` for Pin Sans (or Inter) — zero external requests, no CLS.
- `next/image` with AVIF/WebP for all imagery. `priority` on the home hero only.
- Hero video uses `<video>` with `poster`, `preload="metadata"`, `playsinline`, `muted`, `autoplay`.
- Lazy-load below-fold imagery (default for `next/image`).
- No third-party JS beyond Vercel Analytics + Turnstile.

### Targets

Lighthouse on production:
- Performance ≥ 90
- SEO ≥ 95
- Accessibility ≥ 95
- Best Practices ≥ 95

Core Web Vitals (75th percentile, real users via Speed Insights):
- LCP < 2.5s
- CLS < 0.1
- INP < 200ms

## Contact Form

### Flow

```
[Client] ContactForm.tsx (controlled inputs, submitted via form action)
  ↓
[Server Action] actions/contact.ts
  ↓ zod validate payload (name, email, company, message, turnstile_token, honeypot)
  ↓ verify Turnstile token via fetch to challenges.cloudflare.com
  ↓ reject if honeypot field is populated
  ↓ send email via Resend SDK to CONTACT_TO_EMAIL
  ↓
return { ok: true } | { ok: false, error: string }
  ↓
[Client] Render inline pending / success / error state (no toasts)
```

### Inputs

`name` (required), `email` (required + email format), `company` (optional), `message` (required, ≤ 2000 chars), `turnstile_token` (required, hidden), `honeypot` (must be empty).

### States

- **Idle:** form interactive.
- **Pending:** submit button shows spinner, all inputs disabled. Driven by `useFormStatus`.
- **Success:** form replaced inline with a success message and a "Send another" link.
- **Error:** inline error banner above the submit button, form remains filled for retry.

### Environment Variables

| Name | Purpose |
|---|---|
| `RESEND_API_KEY` | Resend SDK auth |
| `CONTACT_TO_EMAIL` | Inbox that receives form submissions |
| `CONTACT_FROM_EMAIL` | Verified sender on Resend |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key |
| `TURNSTILE_SECRET_KEY` | Server-side Turnstile verification |
| `NEXT_PUBLIC_SITE_URL` | Used for canonical URLs and sitemap |

All env vars are validated at build time via a `lib/env.ts` zod schema.

## Error Handling

- `app/[locale]/not-found.tsx` — localized 404. Triggered automatically by `notFound()` calls in product pages when slug doesn't resolve.
- `app/error.tsx` — global error boundary for runtime errors. Logs to console; production logs surface in Vercel.
- Invalid MDX frontmatter throws at build time (caught by zod).
- Invalid locale in URL → handled by `next-intl` middleware (redirects or 404 per config).
- Server Action errors are caught and returned as typed `{ ok: false, error }` results — never throw to the client.

## Testing

| Layer | Tool | Coverage |
|---|---|---|
| Types | `tsc --noEmit` | CI gate per PR |
| Lint | ESLint + Prettier | CI gate per PR |
| E2E | Playwright | (1) Home loads and scroll reveals fire, (2) Locale switch KR ↔ EN preserves path, (3) Contact form submission (Resend mocked) |
| Perf/SEO | Lighthouse CI | Gate at ≥ 90 on Performance/SEO/A11y/Best-Practices for PR previews |
| i18n parity | Custom script | Verifies `messages/ko.json` and `messages/en.json` have identical key trees |

Unit tests are not introduced for this scope — the codebase is mostly view code where E2E coverage is more valuable.

## Deployment

- **Hosting:** Vercel. `main` branch = production. Every PR gets a unique preview URL.
- **Build command:** `next build` (default).
- **Env management:** Vercel project env vars, scoped per environment (production / preview / development).
- **Custom domain:** to be connected post-launch (no design impact).
- **CDN / caching:** Vercel defaults; static product pages are SSG and cached at the edge indefinitely.
- **Revalidation:** none initially. If content updates need to skip re-deploys later, add `revalidate` exports on product pages — out of scope for v1.

## Success Criteria

The implementation is complete when:

1. Both `/` (Korean) and `/en` (English) homepages render with the SpaceX-style scroll story, GSAP + Lenis driving the motion.
2. All four route types (`/`, `/about`, `/products[/slug]`, `/contact`) work in both locales.
3. Product list and product detail pages render from MDX. Adding `content/products/foo.{ko,en}.mdx` followed by a redeploy results in two new pages and sitemap entries — no other code changes.
4. Contact form delivers an email to `CONTACT_TO_EMAIL` via Resend, gated by Turnstile.
5. `sitemap.xml` and `robots.txt` are reachable at production URLs and list every locale × route combination.
6. Lighthouse production scores: Performance ≥ 90, SEO ≥ 95, Accessibility ≥ 95, Best Practices ≥ 95.
7. `prefers-reduced-motion: reduce` users see the site with no Lenis, no GSAP transitions, and the hero video does not auto-zoom.
8. `DESIGN.md` tokens are reflected 1:1 in the Tailwind theme (CSS `@theme` block for Tailwind v4+, or `tailwind.config.ts` for v3). No hex colors are written outside the theme source and CSS variable declarations.
9. Lighthouse CI runs on PR previews and blocks merge below the threshold.

## Open Questions

These are not blockers for starting implementation, but should be answered before launch:

1. **Domain name** — needs to be acquired and connected to Vercel before launch.
2. **Pin Sans licensing** — Pin Sans is Pinterest's proprietary face. If a license is not obtained, the implementation falls back to Inter (the documented substitute) with `-1.2px` letter-spacing on display tiers.
3. **Hero media assets** — at least one full-bleed hero photo or video must be supplied before launch.
4. **Initial product roster** — how many products to ship with at launch?
5. **Resend domain verification** — `CONTACT_FROM_EMAIL` must be on a domain verified with Resend.
6. **Turnstile site/secret keys** — to be issued from Cloudflare dashboard.

## Out of Scope (for v1)

- Headless CMS integration.
- Authenticated user state.
- News / blog section.
- E-commerce / shop pages (the design system contains shop-style components — they're not used in v1).
- Multi-region hosting.
- A/B testing infrastructure.
- Email newsletter signup.
- On-site search.
- Dark mode.

## References

- `/DESIGN.md` — design system tokens (single source of truth for color, type, radius, spacing, components)
- Pinterest design analysis (provided by user) — design language source
- SpaceX.com — structural reference for full-bleed scroll-driven hero
