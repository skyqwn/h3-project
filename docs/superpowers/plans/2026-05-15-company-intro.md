# h3 Company-Intro Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a bilingual (KR/EN) Next.js marketing site for h3 per `docs/superpowers/specs/2026-05-15-company-intro-design.md`. SpaceX-inspired scroll-driven homepage, Pinterest-derived warm-cream + red-CTA design system (`DESIGN.md`), MDX-backed product pages, Resend-backed contact form, SEO-optimized.

**Architecture:** Next.js 16 App Router, single Vercel deployment, Korean at root and English at `/en` via `next-intl`. All routes SSG; the only runtime mutation is the contact form Server Action calling Resend. GSAP + Lenis drive scroll-linked motion; `prefers-reduced-motion` short-circuits all transitions. Light theme is fixed (no dark mode).

**Tech Stack:** Next.js 16, TypeScript (strict), Tailwind CSS, `next-intl`, `gsap` + `@gsap/react`, `lenis`, MDX (`@next/mdx`), `zod`, `resend`, Cloudflare Turnstile, Playwright, Lighthouse CI, Vercel.

**Sources of truth:**
- Design tokens: `/DESIGN.md`
- Requirements & success criteria: `/docs/superpowers/specs/2026-05-15-company-intro-design.md`

**Brand:**
- Company name is **H3** (capital H, numeral 3). Use exactly that string in wordmark, metadata, JSON-LD, OG images, README, and `.env.example` comments.
- No logo asset yet. The header includes a visually-hidden `<h1>H3</h1>` for SEO (the "h1 behind logo" pattern). Visible wordmark is `aria-hidden`.

**Version note:** This plan targets Next.js 16 and Tailwind v4 (latest at time of writing). When commands say "latest", install the actual latest at execution time — do not pin to a stale minor version.

---

## Phase 1 — Project Foundation

### Task 1: Initialize git and Next.js project

**Files:**
- Create: project files via `create-next-app`

- [ ] **Step 1: Initialize git**

The project directory exists but is not a git repo. Initialize:

```bash
cd C:/Users/skyqw/project/h3-project
git init
git branch -M main
```

- [ ] **Step 2: Run create-next-app in place**

Next.js scaffolding into the current directory. Answer the prompts as listed (TypeScript yes, ESLint yes, Tailwind yes, `src/` no, App Router yes, Turbopack yes, import alias `@/*`).

```bash
npx create-next-app@latest . --typescript --eslint --tailwind --app --no-src-dir --import-alias "@/*" --use-npm --turbopack
```

If `create-next-app` refuses because the directory is non-empty, move `DESIGN.md` and `docs/` aside, scaffold, then restore them:

```bash
mv DESIGN.md docs ../h3-tmp/
npx create-next-app@latest . --typescript --eslint --tailwind --app --no-src-dir --import-alias "@/*" --use-npm --turbopack
mv ../h3-tmp/DESIGN.md ../h3-tmp/docs ./
rmdir ../h3-tmp 2>/dev/null
```

- [ ] **Step 3: Verify the dev server boots**

```bash
npm run dev
```

Expected: server listening on `http://localhost:3000` returning the default Next.js landing page. Stop the server (Ctrl-C).

- [ ] **Step 4: Configure TypeScript strict mode**

Open `tsconfig.json` and confirm or set:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 16 project with TypeScript strict + Tailwind"
```

---

### Task 2: Install runtime dependencies

**Files:**
- Modify: `package.json` (via npm install)

- [ ] **Step 1: Install runtime deps**

```bash
npm install next-intl gsap @gsap/react lenis zod resend @next/mdx @mdx-js/loader @mdx-js/react gray-matter rehype-pretty-code react-wrap-balancer
```

- [ ] **Step 2: Install dev deps**

```bash
npm install -D @playwright/test @types/mdx tsx
```

- [ ] **Step 3: Install Playwright browsers**

```bash
npx playwright install --with-deps chromium
```

- [ ] **Step 4: Verify install**

```bash
npm ls next-intl gsap lenis zod resend
```

Expected: all five listed without UNMET PEER warnings.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add runtime and dev dependencies"
```

---

### Task 3: Map DESIGN.md tokens to Tailwind theme

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Replace globals.css with the design-system theme**

Tailwind v4 uses CSS-first config. Write the complete theme block:

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  /* --- Color tokens from DESIGN.md --- */
  --color-primary: #e60023;
  --color-primary-pressed: #cc001f;
  --color-on-primary: #ffffff;

  --color-canvas: #ffffff;
  --color-surface-soft: #fbfbf9;
  --color-surface-card: #f6f6f3;
  --color-surface-elevated: #ffffff;
  --color-surface-dark: #262622;

  --color-ink: #000000;
  --color-ink-soft: #211922;
  --color-body: #33332e;
  --color-charcoal: #262622;
  --color-mute: #62625b;
  --color-ash: #91918c;
  --color-stone: #c8c8c1;

  --color-hairline: #dadad3;
  --color-hairline-soft: #e5e5e0;

  --color-secondary-bg: #e5e5e0;
  --color-secondary-pressed: #c8c8c1;
  --color-on-secondary: #000000;

  --color-on-dark: #ffffff;
  --color-on-dark-mute: rgba(255, 255, 255, 0.7);

  --color-focus-outer: #435ee5;
  --color-focus-inner: #ffffff;

  --color-error: #9e0a0a;
  --color-error-deep: #cc001f;
  --color-success-deep: #103c25;
  --color-success-pale: #c7f0da;

  --color-accent-purple: #7e238b;
  --color-accent-purple-deep: #6845ab;
  --color-accent-blue-pressed: #617bff;

  /* --- Radii --- */
  --radius-sm: 8px;
  --radius-md: 16px;
  --radius-lg: 32px;
  --radius-full: 9999px;

  /* --- Spacing --- */
  --spacing-xxs: 4px;
  --spacing-xs: 6px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 24px;
  --spacing-xxl: 32px;
  --spacing-section: 64px;

  /* --- Fonts (set by next/font/local in layout.tsx) --- */
  --font-display: var(--font-pin-sans), Inter, -apple-system, system-ui, sans-serif;
  --font-body: var(--font-pin-sans), Inter, -apple-system, system-ui, sans-serif;
}

/* Base reset */
html, body { background: var(--color-canvas); color: var(--color-body); }
body { font-family: var(--font-body); -webkit-font-smoothing: antialiased; }

/* Display utility classes that DESIGN.md treats as roles, not arbitrary sizes */
.text-display-xl { font-size: 70px; font-weight: 600; line-height: 1.1; letter-spacing: -1.2px; }
.text-display-lg { font-size: 44px; font-weight: 700; line-height: 1.15; letter-spacing: -0.8px; }
.text-heading-xl { font-size: 28px; font-weight: 700; line-height: 1.2; letter-spacing: -1.2px; }
.text-heading-lg { font-size: 22px; font-weight: 600; line-height: 1.25; }
.text-heading-md { font-size: 18px; font-weight: 600; line-height: 1.3; }
.text-body-md    { font-size: 16px; font-weight: 400; line-height: 1.4; }
.text-body-strong{ font-size: 16px; font-weight: 600; line-height: 1.4; }
.text-body-sm    { font-size: 14px; font-weight: 400; line-height: 1.4; }
.text-caption-md { font-size: 12px; font-weight: 500; line-height: 1.5; }
.text-button-md  { font-size: 14px; font-weight: 700; line-height: 1; }
.text-button-sm  { font-size: 12px; font-weight: 700; line-height: 1; }

@media (max-width: 767px) {
  .text-display-xl { font-size: 44px; letter-spacing: -0.8px; }
  .text-display-lg { font-size: 32px; }
  .text-heading-xl { font-size: 22px; }
}

/* Visually-hidden but available to screen readers and search engines */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Reduced motion: nuke transitions/animations globally */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 2: Sanity-check by editing app/page.tsx**

Replace the default body with a single test element:

```tsx
// app/page.tsx (temporary; will be deleted in Task 7)
export default function Test() {
  return <main className="p-section bg-canvas text-ink">
    <h1 className="text-display-xl">h3</h1>
    <button className="bg-primary text-on-primary rounded-md px-4 h-10">Sign up</button>
  </main>;
}
```

- [ ] **Step 3: Run dev server and verify tokens render**

```bash
npm run dev
```

Open `http://localhost:3000`. Expected: a large "h3" headline at 70px and a red rounded button. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css app/page.tsx
git commit -m "feat: install DESIGN.md tokens into Tailwind v4 theme"
```

---

### Task 4: Self-host Inter as Pin Sans substitute

**Files:**
- Modify: `app/layout.tsx`

The DESIGN.md fallback chain starts with Pin Sans (proprietary) and substitutes Inter. We ship with Inter via `next/font/google` (no manual font files; Google Fonts is fetched at build time and inlined for zero runtime CLS).

- [ ] **Step 1: Edit app/layout.tsx**

```tsx
// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-pin-sans",
});

export const metadata: Metadata = {
  title: "h3",
  description: "h3 company intro site",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Restart dev server and verify font**

```bash
npm run dev
```

Open the page in DevTools → Computed → font-family on the `h1`. Expected: `Inter, -apple-system, ...`. Stop the server.

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: self-host Inter via next/font as Pin Sans substitute"
```

---

### Task 5: Environment variable validation

**Files:**
- Create: `lib/env.ts`
- Create: `.env.example`
- Modify: `.gitignore` (verify `.env.local` is already ignored)

- [ ] **Step 1: Create lib/env.ts**

```ts
// lib/env.ts
import { z } from "zod";

const EnvSchema = z.object({
  RESEND_API_KEY: z.string().min(1),
  CONTACT_TO_EMAIL: z.string().email(),
  CONTACT_FROM_EMAIL: z.string().email(),
  TURNSTILE_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
});

export const env = EnvSchema.parse({
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  CONTACT_TO_EMAIL: process.env.CONTACT_TO_EMAIL,
  CONTACT_FROM_EMAIL: process.env.CONTACT_FROM_EMAIL,
  TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

export type Env = z.infer<typeof EnvSchema>;
```

- [ ] **Step 2: Create .env.example**

```bash
# .env.example
RESEND_API_KEY=re_xxx
CONTACT_TO_EMAIL=hello@example.com
CONTACT_FROM_EMAIL=noreply@example.com
TURNSTILE_SECRET_KEY=0x4xxx
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4xxx
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- [ ] **Step 3: Create .env.local with placeholder values**

```bash
cp .env.example .env.local
```

Then open `.env.local` and fill placeholder strings that pass the zod schema (real values are added before deploy):

```
RESEND_API_KEY=re_placeholder
CONTACT_TO_EMAIL=hello@local.test
CONTACT_FROM_EMAIL=noreply@local.test
TURNSTILE_SECRET_KEY=placeholder
NEXT_PUBLIC_TURNSTILE_SITE_KEY=placeholder
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- [ ] **Step 4: Verify .env.local is gitignored**

```bash
git check-ignore -v .env.local
```

Expected: outputs `.gitignore:N:.env*` (or similar). If not gitignored, add `.env*.local` to `.gitignore`.

- [ ] **Step 5: Commit**

```bash
git add lib/env.ts .env.example .gitignore
git commit -m "feat: env validation via zod with .env.example"
```

---

## Phase 2 — i18n & Routing Shell

### Task 6: Configure next-intl

**Files:**
- Create: `i18n/routing.ts`
- Create: `i18n/request.ts`
- Create: `middleware.ts`
- Create: `messages/ko.json`
- Create: `messages/en.json`
- Modify: `next.config.ts`

- [ ] **Step 1: Create i18n/routing.ts**

```ts
// i18n/routing.ts
import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["ko", "en"],
  defaultLocale: "ko",
  localePrefix: "as-needed",
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

- [ ] **Step 2: Create i18n/request.ts**

```ts
// i18n/request.ts
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as "ko" | "en")) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

- [ ] **Step 3: Create middleware.ts**

```ts
// middleware.ts
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
```

- [ ] **Step 4: Create messages/ko.json**

```json
{
  "nav": {
    "about": "회사 소개",
    "products": "제품",
    "contact": "문의",
    "cta": "지금 만나기"
  },
  "home": {
    "hero": {
      "eyebrow": "미션 컴퍼니",
      "headline": "기술이 만드는 다음 장면",
      "cta": "제품 보기"
    }
  },
  "about": {
    "title": "회사 소개"
  },
  "products": {
    "title": "제품",
    "subtitle": "우리가 만든 것들"
  },
  "contact": {
    "title": "문의",
    "subtitle": "이야기를 시작해 봅시다",
    "form": {
      "name": "이름",
      "email": "이메일",
      "company": "회사 (선택)",
      "message": "메시지",
      "submit": "보내기",
      "submitting": "전송 중...",
      "success": "메시지가 전달되었습니다. 곧 답신드리겠습니다.",
      "error": "전송에 실패했습니다. 잠시 후 다시 시도해 주세요."
    }
  },
  "footer": {
    "copyright": "© 2026 h3"
  },
  "notFound": {
    "title": "페이지를 찾을 수 없습니다",
    "back": "홈으로"
  }
}
```

- [ ] **Step 5: Create messages/en.json**

```json
{
  "nav": {
    "about": "About",
    "products": "Products",
    "contact": "Contact",
    "cta": "Get in touch"
  },
  "home": {
    "hero": {
      "eyebrow": "MISSION COMPANY",
      "headline": "The next scene, engineered",
      "cta": "See products"
    }
  },
  "about": {
    "title": "About"
  },
  "products": {
    "title": "Products",
    "subtitle": "What we built"
  },
  "contact": {
    "title": "Contact",
    "subtitle": "Let's start a conversation",
    "form": {
      "name": "Name",
      "email": "Email",
      "company": "Company (optional)",
      "message": "Message",
      "submit": "Send",
      "submitting": "Sending...",
      "success": "Message delivered. We'll get back to you soon.",
      "error": "Send failed. Please try again in a moment."
    }
  },
  "footer": {
    "copyright": "© 2026 h3"
  },
  "notFound": {
    "title": "Page not found",
    "back": "Back to home"
  }
}
```

- [ ] **Step 6: Wire next-intl into next.config.ts**

```ts
// next.config.ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  experimental: {},
};

export default withNextIntl(nextConfig);
```

- [ ] **Step 7: Commit**

```bash
git add i18n middleware.ts messages next.config.ts
git commit -m "feat: configure next-intl with KR (root) and EN (/en) routing"
```

---

### Task 7: Locale-scoped app layout and home stub

**Files:**
- Delete: `app/page.tsx` (the test stub from Task 3)
- Modify: `app/layout.tsx`
- Create: `app/[locale]/layout.tsx`
- Create: `app/[locale]/page.tsx`

- [ ] **Step 1: Delete the temporary test page**

```bash
rm app/page.tsx
```

- [ ] **Step 2: Trim app/layout.tsx to a passthrough**

next-intl recommends owning `<html>` inside `[locale]/layout.tsx` so the `lang` attribute is locale-correct. The root layout becomes a thin passthrough:

```tsx
// app/layout.tsx
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

(The Inter font + `<html>`/`<body>` move into `[locale]/layout.tsx` in the next step.)

- [ ] **Step 3: Create app/[locale]/layout.tsx**

```tsx
// app/[locale]/layout.tsx
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Inter } from "next/font/google";
import { routing } from "@/i18n/routing";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-pin-sans",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as "ko" | "en")) notFound();
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <html lang={locale} className={inter.variable} suppressHydrationWarning>
        <body>{children}</body>
      </html>
    </NextIntlClientProvider>
  );
}
```

- [ ] **Step 4: Create app/[locale]/page.tsx stub**

```tsx
// app/[locale]/page.tsx
import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("home.hero");
  return (
    <main className="min-h-screen flex items-center justify-center bg-canvas">
      <h1 className="text-display-xl text-ink">{t("headline")}</h1>
    </main>
  );
}
```

- [ ] **Step 5: Verify both locales render**

```bash
npm run dev
```

- Open `http://localhost:3000` → expect the Korean headline ("기술이 만드는 다음 장면")
- Open `http://localhost:3000/en` → expect the English headline ("The next scene, engineered")

Stop the server.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: locale-scoped layout + stub home page"
```

---

### Task 8: LocaleSwitcher component

**Files:**
- Create: `components/layout/LocaleSwitcher.tsx`

- [ ] **Step 1: Implement the switcher**

```tsx
// components/layout/LocaleSwitcher.tsx
"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { useTransition } from "react";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const switchTo = (next: "ko" | "en") => {
    if (next === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  };

  return (
    <div className="flex items-center gap-xs text-button-sm" aria-busy={isPending}>
      <button
        onClick={() => switchTo("ko")}
        className={locale === "ko" ? "font-bold text-ink" : "text-mute"}
        aria-current={locale === "ko" ? "true" : undefined}
      >
        KO
      </button>
      <span className="text-stone">/</span>
      <button
        onClick={() => switchTo("en")}
        className={locale === "en" ? "font-bold text-ink" : "text-mute"}
        aria-current={locale === "en" ? "true" : undefined}
      >
        EN
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/layout/LocaleSwitcher.tsx
git commit -m "feat: LocaleSwitcher component"
```

---

## Phase 3 — Layout Primitives

### Task 9: Header component

**Files:**
- Create: `components/layout/Header.tsx`
- Create: `components/ui/Button.tsx`

- [ ] **Step 1: Create Button component**

```tsx
// components/ui/Button.tsx
import Link from "next/link";
import { ComponentProps } from "react";

type ButtonProps = {
  variant?: "primary" | "secondary" | "tertiary";
  size?: "md" | "sm";
  href?: string;
  className?: string;
  children: React.ReactNode;
} & Omit<ComponentProps<"button">, "className">;

const baseClasses = "inline-flex items-center justify-center rounded-md text-button-md transition-colors disabled:cursor-not-allowed";
const sizeClasses = { md: "h-10 px-4", sm: "h-8 px-3 text-button-sm" };
const variantClasses = {
  primary:   "bg-primary text-on-primary hover:bg-primary-pressed disabled:bg-surface-card disabled:text-ash",
  secondary: "bg-secondary-bg text-on-secondary hover:bg-secondary-pressed disabled:bg-surface-card disabled:text-ash",
  tertiary:  "bg-transparent text-ink hover:bg-surface-card",
};

export function Button({
  variant = "primary",
  size = "md",
  href,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const cls = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;
  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return <button className={cls} {...rest}>{children}</button>;
}
```

- [ ] **Step 2: Create Header component**

```tsx
// components/layout/Header.tsx
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { Button } from "@/components/ui/Button";

export async function Header() {
  const t = await getTranslations("nav");
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-canvas border-b border-hairline">
      {/* SEO: brand name as the page's primary h1, visually hidden.
          Renders on every page; pair with aria-hidden on the visible wordmark
          so screen readers don't announce the brand twice. */}
      <h1 className="sr-only">H3</h1>
      <div className="max-w-[1280px] mx-auto h-full px-xl flex items-center justify-between">
        <Link href="/" aria-hidden="true" tabIndex={-1} className="text-heading-xl text-primary font-bold">
          H3
        </Link>
        <nav className="hidden md:flex items-center gap-xl text-body-strong text-ink">
          <Link href="/about">{t("about")}</Link>
          <Link href="/products">{t("products")}</Link>
          <Link href="/contact">{t("contact")}</Link>
        </nav>
        <div className="flex items-center gap-md">
          <LocaleSwitcher />
          <Button href="/contact" variant="primary" size="md">{t("cta")}</Button>
        </div>
      </div>
      {/* Keyboard-accessible home link, also visually hidden — replaces the
          aria-hidden visible wordmark for assistive tech and keyboard nav. */}
      <Link href="/" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-canvas focus:p-2">
        Home
      </Link>
    </header>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/ui/Button.tsx components/layout/Header.tsx
git commit -m "feat: Header with locale switcher and primary CTA"
```

---

### Task 10: Footer component

**Files:**
- Create: `components/layout/Footer.tsx`

- [ ] **Step 1: Implement footer**

```tsx
// components/layout/Footer.tsx
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";

export async function Footer() {
  const tNav = await getTranslations("nav");
  const tFoot = await getTranslations("footer");
  return (
    <footer className="bg-canvas border-t border-hairline text-body-sm text-mute">
      <div className="max-w-[1280px] mx-auto px-xl py-xxl grid grid-cols-2 md:grid-cols-4 gap-xl">
        <div>
          <h3 className="text-body-sm font-bold text-ink mb-md">h3</h3>
          <p className="text-body-sm">{tFoot("copyright")}</p>
        </div>
        <div>
          <h3 className="text-body-sm font-bold text-ink mb-md">{tNav("about")}</h3>
          <Link href="/about" className="block">{tNav("about")}</Link>
        </div>
        <div>
          <h3 className="text-body-sm font-bold text-ink mb-md">{tNav("products")}</h3>
          <Link href="/products" className="block">{tNav("products")}</Link>
        </div>
        <div>
          <h3 className="text-body-sm font-bold text-ink mb-md">{tNav("contact")}</h3>
          <Link href="/contact" className="block">{tNav("contact")}</Link>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Wire Header + Footer into the locale layout**

Edit `app/[locale]/layout.tsx`. After `setRequestLocale(locale)` and within the `<body>`, render Header above and Footer below children:

```tsx
// app/[locale]/layout.tsx (replace the existing body)
return (
  <NextIntlClientProvider messages={messages}>
    <html lang={locale} suppressHydrationWarning>
      <body>
        <Header />
        <div className="pt-16">{children}</div>
        <Footer />
      </body>
    </html>
  </NextIntlClientProvider>
);
```

Add imports at top:
```tsx
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
```

- [ ] **Step 3: Verify layout renders**

```bash
npm run dev
```

Visit `/` and `/en`. Expect the header sticky at top, headline below, and footer at bottom. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add components/layout/Footer.tsx app/[locale]/layout.tsx
git commit -m "feat: Footer and wire layout shell"
```

---

### Task 11: GSAP registration and Lenis provider

**Files:**
- Create: `lib/gsap.ts`
- Create: `components/layout/LenisProvider.tsx`

- [ ] **Step 1: Create lib/gsap.ts**

```ts
// lib/gsap.ts
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export { gsap, ScrollTrigger, useGSAP };
```

- [ ] **Step 2: Create LenisProvider**

```tsx
// components/layout/LenisProvider.tsx
"use client";

import { useEffect, ReactNode } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";

export function LenisProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    const onScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onScroll);

    const tickerFn = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tickerFn);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.off("scroll", onScroll);
      gsap.ticker.remove(tickerFn);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
```

- [ ] **Step 3: Wrap children with LenisProvider in [locale]/layout.tsx**

Edit `app/[locale]/layout.tsx`:

```tsx
import { LenisProvider } from "@/components/layout/LenisProvider";
// ...
<body>
  <LenisProvider>
    <Header />
    <div className="pt-16">{children}</div>
    <Footer />
  </LenisProvider>
</body>
```

- [ ] **Step 4: Smoke test**

```bash
npm run dev
```

Scroll the page — motion should feel slightly smoother (Lenis-driven). In DevTools, toggle "Emulate CSS prefers-reduced-motion: reduce" and reload: scroll should be native again. Stop server.

- [ ] **Step 5: Commit**

```bash
git add lib/gsap.ts components/layout/LenisProvider.tsx app/[locale]/layout.tsx
git commit -m "feat: GSAP registration and Lenis smooth-scroll provider with reduced-motion guard"
```

---

### Task 12: ScrollReveal primitive

**Files:**
- Create: `components/primitives/ScrollReveal.tsx`

- [ ] **Step 1: Implement ScrollReveal**

```tsx
// components/primitives/ScrollReveal.tsx
"use client";

import { useRef, ReactNode } from "react";
import { useGSAP, gsap, ScrollTrigger } from "@/lib/gsap";

type Props = {
  children: ReactNode;
  y?: number;
  duration?: number;
  delay?: number;
  className?: string;
};

export function ScrollReveal({ children, y = 24, duration = 0.6, delay = 0, className = "" }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useGSAP(() => {
    if (!ref.current) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      gsap.set(ref.current, { opacity: 1, y: 0 });
      return;
    }
    gsap.fromTo(
      ref.current,
      { opacity: 0, y },
      {
        opacity: 1,
        y: 0,
        duration,
        delay,
        ease: "power2.out",
        scrollTrigger: { trigger: ref.current, start: "top 85%", once: true },
      }
    );
  }, { scope: ref });

  return <div ref={ref} className={className} style={{ opacity: 0 }}>{children}</div>;
}
```

- [ ] **Step 2: Commit**

```bash
git add components/primitives/ScrollReveal.tsx
git commit -m "feat: ScrollReveal primitive (viewport-enter fade-up)"
```

---

### Task 13: DisplayHeading and GhostPill primitives

**Files:**
- Create: `components/primitives/DisplayHeading.tsx`
- Create: `components/primitives/GhostPill.tsx`

- [ ] **Step 1: DisplayHeading**

```tsx
// components/primitives/DisplayHeading.tsx
import { ReactNode } from "react";

type Level = "xl" | "lg" | "heading-xl" | "heading-lg";
const classes: Record<Level, string> = {
  xl: "text-display-xl",
  lg: "text-display-lg",
  "heading-xl": "text-heading-xl",
  "heading-lg": "text-heading-lg",
};

export function DisplayHeading({
  as: As = "h1",
  level = "xl",
  className = "",
  children,
}: {
  as?: keyof React.JSX.IntrinsicElements;
  level?: Level;
  className?: string;
  children: ReactNode;
}) {
  const Tag = As as React.ElementType;
  return <Tag className={`${classes[level]} ${className}`}>{children}</Tag>;
}
```

- [ ] **Step 2: GhostPill**

```tsx
// components/primitives/GhostPill.tsx
import Link from "next/link";
import { ReactNode } from "react";

type Variant = "on-image" | "on-light";
const variantClasses: Record<Variant, string> = {
  "on-image": "bg-canvas text-ink",
  "on-light": "bg-transparent text-ink border border-ink",
};

export function GhostPill({
  href,
  variant = "on-image",
  children,
  className = "",
}: {
  href: string;
  variant?: Variant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center rounded-full px-md py-xs text-button-md ${variantClasses[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/primitives/
git commit -m "feat: DisplayHeading and GhostPill primitives"
```

---

## Phase 4 — Home Page Sections

### Task 14: Hero section

**Files:**
- Create: `components/sections/Hero.tsx`
- Create: `public/hero-placeholder.jpg` (or use a remote placeholder image)

- [ ] **Step 1: Hero image placeholder**

The Hero component (next step) has a `backgroundColor: "#0a0a0a"` fallback, so a missing `/hero-placeholder.jpg` renders as a black hero. Do not create a fake JPEG. Real artwork is added before launch (see README workflow note).

If you want a placeholder during development, drop ANY real `.jpg` or `.png` into `public/hero-placeholder.jpg` — no code change needed.

- [ ] **Step 2: Implement Hero**

```tsx
// components/sections/Hero.tsx
"use client";

import { useGSAP, gsap } from "@/lib/gsap";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { Button } from "@/components/ui/Button";

export function Hero() {
  const t = useTranslations("home.hero");
  const imgRef = useRef<HTMLDivElement | null>(null);

  useGSAP(() => {
    if (!imgRef.current) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    gsap.to(imgRef.current, { scale: 1.05, duration: 8, repeat: -1, yoyo: true, ease: "sine.inOut" });
  }, { scope: imgRef });

  return (
    <section className="relative h-screen w-full overflow-hidden bg-surface-dark">
      <div
        ref={imgRef}
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url(/hero-placeholder.jpg)",
          backgroundColor: "#0a0a0a",
        }}
        aria-hidden
      />
      <div className="absolute inset-0 flex flex-col justify-end p-section text-on-dark">
        <div className="max-w-[1280px] mx-auto w-full">
          <p className="text-caption-md uppercase tracking-wider mb-md text-on-dark-mute">
            {t("eyebrow")}
          </p>
          <h1 className="text-display-xl max-w-4xl mb-xl">{t("headline")}</h1>
          <Button href="/products" variant="primary" size="md">
            {t("cta")}
          </Button>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Use Hero in app/[locale]/page.tsx**

```tsx
// app/[locale]/page.tsx
import { Hero } from "@/components/sections/Hero";

export default function Home() {
  return (
    <main>
      <Hero />
    </main>
  );
}
```

Note: remove the `pt-16` wrapper around children only on the home route IF you want the hero to truly bleed under the nav. For now, accept the nav-pushed-down content; we'll address fullbleed-under-nav in Task 19 if needed.

- [ ] **Step 4: Verify**

```bash
npm run dev
```

Visit `/`. Expect a full-viewport black/photo area with the eyebrow, headline, and red CTA at the bottom. Stop server.

- [ ] **Step 5: Commit**

```bash
git add components/sections/Hero.tsx app/[locale]/page.tsx public/
git commit -m "feat: Hero section with ambient zoom and reduced-motion guard"
```

---

### Task 15: Feature card row section

**Files:**
- Create: `components/sections/FeatureCardRow.tsx`

- [ ] **Step 1: Implement**

```tsx
// components/sections/FeatureCardRow.tsx
import { ScrollReveal } from "@/components/primitives/ScrollReveal";
import { DisplayHeading } from "@/components/primitives/DisplayHeading";
import { Button } from "@/components/ui/Button";

type Item = {
  title: string;
  body: string;
  cta: { label: string; href: string };
  image: string;
  reverse?: boolean;
};

export function FeatureCardRow({ items }: { items: Item[] }) {
  return (
    <section className="py-section bg-surface-soft">
      <div className="max-w-[1280px] mx-auto px-xl space-y-section">
        {items.map((item, i) => (
          <ScrollReveal key={i}>
            <div className={`grid md:grid-cols-2 gap-xl items-center ${item.reverse ? "md:[&>*:first-child]:order-2" : ""}`}>
              <div
                className="aspect-[4/5] rounded-md bg-surface-card bg-cover bg-center"
                style={{ backgroundImage: `url(${item.image})` }}
                aria-hidden
              />
              <div className="space-y-md">
                <DisplayHeading as="h2" level="heading-xl">{item.title}</DisplayHeading>
                <p className="text-body-md text-body">{item.body}</p>
                <Button href={item.cta.href} variant="primary" size="md">{item.cta.label}</Button>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/sections/FeatureCardRow.tsx
git commit -m "feat: FeatureCardRow section primitive"
```

---

### Task 16: CTA strip and product showcase teaser sections

**Files:**
- Create: `components/sections/CtaStrip.tsx`
- Create: `components/sections/ProductShowcase.tsx`

- [ ] **Step 1: CtaStrip**

```tsx
// components/sections/CtaStrip.tsx
import { Button } from "@/components/ui/Button";

export function CtaStrip({ title, ctaLabel, ctaHref }: { title: string; ctaLabel: string; ctaHref: string }) {
  return (
    <section className="bg-surface-dark text-on-dark py-xxl px-xl">
      <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-xl">
        <h2 className="text-heading-xl">{title}</h2>
        <Button href={ctaHref} variant="primary" size="md">{ctaLabel}</Button>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: ProductShowcase**

```tsx
// components/sections/ProductShowcase.tsx
import { Link } from "@/i18n/routing";
import { DisplayHeading } from "@/components/primitives/DisplayHeading";
import { ScrollReveal } from "@/components/primitives/ScrollReveal";

type Product = { slug: string; title: string; tagline: string; hero_image: string };

export function ProductShowcase({ products, title }: { products: Product[]; title: string }) {
  return (
    <section className="py-section bg-canvas">
      <div className="max-w-[1280px] mx-auto px-xl">
        <DisplayHeading as="h2" level="heading-xl" className="mb-xl">{title}</DisplayHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-sm">
          {products.map((p) => (
            <ScrollReveal key={p.slug}>
              <Link href={`/products/${p.slug}`} className="block group">
                <div className="aspect-[4/5] rounded-md bg-surface-card bg-cover bg-center overflow-hidden"
                  style={{ backgroundImage: `url(${p.hero_image})` }}
                />
                <h3 className="text-heading-md mt-md text-ink">{p.title}</h3>
                <p className="text-body-sm text-mute">{p.tagline}</p>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/sections/CtaStrip.tsx components/sections/ProductShowcase.tsx
git commit -m "feat: CtaStrip and ProductShowcase sections"
```

---

## Phase 5 — Products via MDX

### Task 17: MDX loader with zod validation (TDD)

**Files:**
- Create: `lib/mdx.ts`
- Create: `tests/unit/mdx.test.ts`
- Create: `content/products/sample.ko.mdx` (test fixture)
- Create: `content/products/sample.en.mdx` (test fixture)
- Modify: `package.json` to add a unit test runner

- [ ] **Step 1: Add a test runner**

Use `tsx` to run a tiny custom node assertion (no Jest/Vitest needed for one-file coverage). Add to `package.json` scripts:

```json
"scripts": {
  "test:unit": "tsx tests/unit/run.ts"
}
```

- [ ] **Step 2: Create tests/unit/run.ts**

```ts
// tests/unit/run.ts
import "./mdx.test";
console.log("All unit tests passed.");
```

- [ ] **Step 3: Create the failing test first**

```ts
// tests/unit/mdx.test.ts
import assert from "node:assert/strict";
import { getAllProducts, getProduct } from "../../lib/mdx";

(async () => {
  const koProducts = await getAllProducts("ko");
  assert.ok(koProducts.length >= 1, "expected at least one Korean product");
  assert.equal(koProducts[0].slug, "sample");
  assert.equal(typeof koProducts[0].title, "string");

  const enProducts = await getAllProducts("en");
  assert.ok(enProducts.length >= 1, "expected at least one English product");

  const one = await getProduct("sample", "ko");
  assert.equal(one.slug, "sample");
  assert.ok(one.body.length > 0, "expected body content");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 4: Run the test, confirm it fails**

```bash
npm run test:unit
```

Expected: error like "Cannot find module '../../lib/mdx'".

- [ ] **Step 5: Create the sample fixtures**

```mdx
{/* content/products/sample.ko.mdx */}
---
title: 샘플 제품
tagline: 임시 제품 설명입니다.
hero_image: /hero-placeholder.jpg
order: 1
draft: false
---

# 샘플 제품 소개

이것은 자리표시자 콘텐츠입니다. 실제 내용을 작성해 주세요.
```

```mdx
{/* content/products/sample.en.mdx */}
---
title: Sample Product
tagline: Placeholder product description.
hero_image: /hero-placeholder.jpg
order: 1
draft: false
---

# Sample Product Overview

This is placeholder content. Replace with real copy before launch.
```

- [ ] **Step 6: Implement lib/mdx.ts**

```ts
// lib/mdx.ts
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";

const ProductFrontmatter = z.object({
  title: z.string().min(1),
  tagline: z.string().min(1),
  hero_image: z.string(),
  gallery: z.array(z.string()).optional(),
  specs: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  order: z.number().int(),
  draft: z.boolean().default(false),
});

export type Product = z.infer<typeof ProductFrontmatter> & {
  slug: string;
  locale: "ko" | "en";
  body: string;
};

const CONTENT_DIR = path.join(process.cwd(), "content", "products");

async function readDir() {
  try { return await fs.readdir(CONTENT_DIR); }
  catch { return []; }
}

function parseFilename(filename: string): { slug: string; locale: "ko" | "en" } | null {
  const m = filename.match(/^(.+)\.(ko|en)\.mdx$/);
  if (!m) return null;
  return { slug: m[1], locale: m[2] as "ko" | "en" };
}

export async function getAllProducts(locale: "ko" | "en"): Promise<Product[]> {
  const files = await readDir();
  const out: Product[] = [];
  for (const f of files) {
    const parsed = parseFilename(f);
    if (!parsed || parsed.locale !== locale) continue;
    const raw = await fs.readFile(path.join(CONTENT_DIR, f), "utf8");
    const { data, content } = matter(raw);
    const fm = ProductFrontmatter.parse(data);
    if (fm.draft && process.env.NODE_ENV === "production") continue;
    out.push({ ...fm, slug: parsed.slug, locale: parsed.locale, body: content });
  }
  return out.sort((a, b) => a.order - b.order);
}

export async function getProduct(slug: string, locale: "ko" | "en"): Promise<Product> {
  const filename = `${slug}.${locale}.mdx`;
  const raw = await fs.readFile(path.join(CONTENT_DIR, filename), "utf8");
  const { data, content } = matter(raw);
  const fm = ProductFrontmatter.parse(data);
  return { ...fm, slug, locale, body: content };
}

export async function getAllProductSlugs(): Promise<string[]> {
  const files = await readDir();
  const slugs = new Set<string>();
  for (const f of files) {
    const parsed = parseFilename(f);
    if (parsed) slugs.add(parsed.slug);
  }
  return [...slugs];
}
```

- [ ] **Step 7: Re-run the test, confirm it passes**

```bash
npm run test:unit
```

Expected: `All unit tests passed.`

- [ ] **Step 8: Commit**

```bash
git add lib/mdx.ts tests/unit content/products package.json
git commit -m "feat: MDX loader with zod-validated frontmatter (TDD)"
```

---

### Task 18: Products list page

**Files:**
- Create: `app/[locale]/products/page.tsx`

- [ ] **Step 1: Implement the list page**

```tsx
// app/[locale]/products/page.tsx
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getAllProducts } from "@/lib/mdx";
import { DisplayHeading } from "@/components/primitives/DisplayHeading";

export default async function ProductsPage({
  params,
}: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("products");
  const products = await getAllProducts(locale as "ko" | "en");

  return (
    <main className="min-h-screen bg-canvas pt-section">
      <div className="max-w-[1280px] mx-auto px-xl">
        <p className="text-caption-md uppercase tracking-wider text-mute mb-md">
          {t("subtitle")}
        </p>
        <DisplayHeading level="lg" className="mb-xxl">{t("title")}</DisplayHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-sm">
          {products.map((p) => (
            <Link key={p.slug} href={`/products/${p.slug}`} className="block">
              <div
                className="aspect-[4/5] rounded-md bg-surface-card bg-cover bg-center"
                style={{ backgroundImage: `url(${p.hero_image})` }}
              />
              <h2 className="text-heading-md mt-md text-ink">{p.title}</h2>
              <p className="text-body-sm text-mute">{p.tagline}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify**

```bash
npm run dev
```

Visit `/products` and `/en/products`. Expect the sample product to render in a card grid. Stop server.

- [ ] **Step 3: Commit**

```bash
git add app/[locale]/products
git commit -m "feat: products list page reading from MDX"
```

---

### Task 19: Product detail page with MDX rendering

**Files:**
- Create: `app/[locale]/products/[slug]/page.tsx`
- Create: `mdx-components.tsx`

- [ ] **Step 1: Configure MDX components**

```tsx
// mdx-components.tsx (root level — Next.js convention)
import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => <h1 className="text-display-lg text-ink mb-xl">{children}</h1>,
    h2: ({ children }) => <h2 className="text-heading-xl text-ink mt-xxl mb-md">{children}</h2>,
    h3: ({ children }) => <h3 className="text-heading-lg text-ink mt-xl mb-md">{children}</h3>,
    p:  ({ children }) => <p className="text-body-md text-body my-md leading-relaxed">{children}</p>,
    a:  ({ children, href }) => <a href={href} className="text-ink-soft underline">{children}</a>,
    ul: ({ children }) => <ul className="list-disc pl-xl text-body-md text-body">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal pl-xl text-body-md text-body">{children}</ol>,
    ...components,
  };
}
```

- [ ] **Step 2: Enable MDX in next.config.ts**

```ts
// next.config.ts (replace contents)
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import createMDX from "@next/mdx";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");
const withMDX = createMDX({});

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
};

export default withNextIntl(withMDX(nextConfig));
```

- [ ] **Step 3: Implement the detail page**

We compile MDX server-side using `next-mdx-remote-client` style via a dynamic import. Simpler approach: render the raw markdown body via `react-markdown` is one option, but to stay with MDX semantics, use `@next/mdx` with file-based imports. Since our content files are dynamic by slug, use `next-mdx-remote/rsc`:

First install the runtime:

```bash
npm install next-mdx-remote
```

Then:

```tsx
// app/[locale]/products/[slug]/page.tsx
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getAllProductSlugs, getProduct } from "@/lib/mdx";
import { MDXRemote } from "next-mdx-remote/rsc";
import { useMDXComponents } from "@/mdx-components";

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return ["ko", "en"].flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export default async function ProductDetail({
  params,
}: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  let product;
  try {
    product = await getProduct(slug, locale as "ko" | "en");
  } catch {
    notFound();
  }

  const components = useMDXComponents({});

  return (
    <main className="min-h-screen bg-canvas pt-section">
      <article className="max-w-[800px] mx-auto px-xl">
        <p className="text-caption-md uppercase tracking-wider text-mute mb-md">
          {product.tagline}
        </p>
        <h1 className="text-display-lg text-ink mb-xxl">{product.title}</h1>
        <div
          className="aspect-[16/10] rounded-lg bg-surface-card bg-cover bg-center mb-xxl"
          style={{ backgroundImage: `url(${product.hero_image})` }}
        />
        <MDXRemote source={product.body} components={components} />
      </article>
    </main>
  );
}
```

- [ ] **Step 4: Verify**

```bash
npm run dev
```

Visit `/products/sample` and `/en/products/sample`. Expect the MDX-rendered body. Stop server.

- [ ] **Step 5: Commit**

```bash
git add mdx-components.tsx next.config.ts app/[locale]/products/[slug] package.json package-lock.json
git commit -m "feat: product detail page rendering MDX with custom components"
```

---

### Task 20: Wire home page with all sections

**Files:**
- Modify: `app/[locale]/page.tsx`

- [ ] **Step 1: Update home page**

```tsx
// app/[locale]/page.tsx
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Hero } from "@/components/sections/Hero";
import { FeatureCardRow } from "@/components/sections/FeatureCardRow";
import { ProductShowcase } from "@/components/sections/ProductShowcase";
import { CtaStrip } from "@/components/sections/CtaStrip";
import { getAllProducts } from "@/lib/mdx";

export default async function Home({
  params,
}: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const products = await getAllProducts(locale as "ko" | "en");

  return (
    <main>
      <Hero />
      <FeatureCardRow
        items={[
          {
            title: locale === "ko" ? "기술" : "Technology",
            body:  locale === "ko" ? "우리가 만든 핵심 기술과 그 배경." : "The core technology and why it matters.",
            image: "/hero-placeholder.jpg",
            cta:   { label: t("nav.about"), href: "/about" },
          },
          {
            title: locale === "ko" ? "팀" : "Team",
            body:  locale === "ko" ? "팀의 미션과 일하는 방식." : "The team's mission and how we work.",
            image: "/hero-placeholder.jpg",
            cta:   { label: t("nav.about"), href: "/about" },
            reverse: true,
          },
        ]}
      />
      <ProductShowcase title={t("products.title")} products={products.slice(0, 6)} />
      <CtaStrip
        title={locale === "ko" ? "함께 일할 준비가 되었다면" : "Ready to work together?"}
        ctaLabel={t("nav.cta")}
        ctaHref="/contact"
      />
    </main>
  );
}
```

- [ ] **Step 2: Smoke test**

```bash
npm run dev
```

Visit `/`. Expect Hero → FeatureCardRow → ProductShowcase → CtaStrip → Footer. Stop server.

- [ ] **Step 3: Commit**

```bash
git add app/[locale]/page.tsx
git commit -m "feat: assemble home page with all sections"
```

---

### Task 21: About page

**Files:**
- Create: `app/[locale]/about/page.tsx`

- [ ] **Step 1: Implement**

```tsx
// app/[locale]/about/page.tsx
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { DisplayHeading } from "@/components/primitives/DisplayHeading";
import { ScrollReveal } from "@/components/primitives/ScrollReveal";

export default async function About({
  params,
}: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");

  return (
    <main className="min-h-screen bg-canvas pt-section pb-section">
      <div className="max-w-[800px] mx-auto px-xl space-y-xxl">
        <DisplayHeading level="lg">{t("title")}</DisplayHeading>
        <ScrollReveal>
          <p className="text-body-md text-body">
            {locale === "ko"
              ? "h3는 ... (실제 회사 소개 문구를 채워주세요)"
              : "h3 is ... (replace with actual company introduction copy)"}
          </p>
        </ScrollReveal>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/[locale]/about
git commit -m "feat: About page skeleton"
```

---

## Phase 6 — Contact Form (Backend + UI)

### Task 22: Contact form zod schema and types

**Files:**
- Create: `lib/contact-schema.ts`

- [ ] **Step 1: Schema**

```ts
// lib/contact-schema.ts
import { z } from "zod";

export const ContactInputSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  company: z.string().max(120).optional().default(""),
  message: z.string().min(1).max(2000),
  turnstileToken: z.string().min(1),
  honeypot: z.string().max(0, "spam detected").optional().default(""),
});

export type ContactInput = z.infer<typeof ContactInputSchema>;

export type ContactResult = { ok: true } | { ok: false; error: string };
```

- [ ] **Step 2: Commit**

```bash
git add lib/contact-schema.ts
git commit -m "feat: contact form zod schema"
```

---

### Task 23: Turnstile verification helper (TDD)

**Files:**
- Create: `lib/turnstile.ts`
- Create: `tests/unit/turnstile.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/run.ts`:

```ts
// tests/unit/run.ts
import "./mdx.test";
import "./turnstile.test";
console.log("All unit tests passed.");
```

Create `tests/unit/turnstile.test.ts`:

```ts
// tests/unit/turnstile.test.ts
import assert from "node:assert/strict";
import { verifyTurnstile } from "../../lib/turnstile";

const originalFetch = global.fetch;

(async () => {
  // Success case
  global.fetch = (async () => new Response(JSON.stringify({ success: true }))) as typeof fetch;
  const okResult = await verifyTurnstile("token-x", "secret-y");
  assert.equal(okResult, true);

  // Failure case
  global.fetch = (async () => new Response(JSON.stringify({ success: false }))) as typeof fetch;
  const failResult = await verifyTurnstile("token-x", "secret-y");
  assert.equal(failResult, false);

  global.fetch = originalFetch;
})().catch((err) => { console.error(err); process.exit(1); });
```

- [ ] **Step 2: Run, confirm failure**

```bash
npm run test:unit
```

Expected: "Cannot find module '../../lib/turnstile'".

- [ ] **Step 3: Implement**

```ts
// lib/turnstile.ts
const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstile(token: string, secret: string): Promise<boolean> {
  const body = new URLSearchParams({ secret, response: token });
  const res = await fetch(VERIFY_URL, { method: "POST", body });
  if (!res.ok) return false;
  const data = (await res.json()) as { success?: boolean };
  return data.success === true;
}
```

- [ ] **Step 4: Re-run, confirm pass**

```bash
npm run test:unit
```

Expected: "All unit tests passed."

- [ ] **Step 5: Commit**

```bash
git add lib/turnstile.ts tests/unit/turnstile.test.ts tests/unit/run.ts
git commit -m "feat: Cloudflare Turnstile verification helper (TDD)"
```

---

### Task 24: Contact Server Action

**Files:**
- Create: `actions/contact.ts`

- [ ] **Step 1: Implement**

```ts
// actions/contact.ts
"use server";

import { Resend } from "resend";
import { env } from "@/lib/env";
import { ContactInputSchema, type ContactResult } from "@/lib/contact-schema";
import { verifyTurnstile } from "@/lib/turnstile";

export async function submitContact(formData: FormData): Promise<ContactResult> {
  const parsed = ContactInputSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    company: formData.get("company") ?? "",
    message: formData.get("message"),
    turnstileToken: formData.get("turnstileToken"),
    honeypot: formData.get("honeypot") ?? "",
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const input = parsed.data;

  const turnstileOk = await verifyTurnstile(input.turnstileToken, env.TURNSTILE_SECRET_KEY);
  if (!turnstileOk) return { ok: false, error: "Bot challenge failed" };

  const resend = new Resend(env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: env.CONTACT_FROM_EMAIL,
    to: env.CONTACT_TO_EMAIL,
    subject: `[h3 contact] ${input.name}`,
    text:
      `From: ${input.name} <${input.email}>\n` +
      `Company: ${input.company || "(none)"}\n\n` +
      `${input.message}`,
  });

  if (error) return { ok: false, error: "Send failed" };
  return { ok: true };
}
```

- [ ] **Step 2: Commit**

```bash
git add actions/contact.ts
git commit -m "feat: contact Server Action (zod + Turnstile + Resend)"
```

---

### Task 25: Contact form UI

**Files:**
- Create: `components/ui/ContactForm.tsx`
- Create: `app/[locale]/contact/page.tsx`

- [ ] **Step 1: ContactForm component**

```tsx
// components/ui/ContactForm.tsx
"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { submitContact } from "@/actions/contact";
import { Button } from "@/components/ui/Button";

type ActionState = { ok: true } | { ok: false; error: string } | null;

async function action(_: ActionState, formData: FormData): Promise<ActionState> {
  return await submitContact(formData);
}

export function ContactForm({ turnstileSiteKey }: { turnstileSiteKey: string }) {
  const t = useTranslations("contact.form");
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(action, null);

  if (state?.ok) {
    return (
      <div className="bg-success-pale text-success-deep rounded-md p-xl">
        <p className="text-body-md">{t("success")}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-md">
      {state && !state.ok && (
        <div className="bg-error-deep text-on-primary rounded-md p-md text-body-sm">
          {t("error")}
        </div>
      )}

      {/* Honeypot — hidden from real users; bots fill it */}
      <input
        type="text"
        name="honeypot"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden
      />

      <label className="block">
        <span className="block text-body-sm text-ink mb-xxs">{t("name")}</span>
        <input
          name="name"
          required
          maxLength={120}
          className="w-full h-11 px-md bg-canvas border border-ash rounded-md text-body-md text-ink"
        />
      </label>

      <label className="block">
        <span className="block text-body-sm text-ink mb-xxs">{t("email")}</span>
        <input
          name="email"
          type="email"
          required
          maxLength={200}
          className="w-full h-11 px-md bg-canvas border border-ash rounded-md text-body-md text-ink"
        />
      </label>

      <label className="block">
        <span className="block text-body-sm text-ink mb-xxs">{t("company")}</span>
        <input
          name="company"
          maxLength={120}
          className="w-full h-11 px-md bg-canvas border border-ash rounded-md text-body-md text-ink"
        />
      </label>

      <label className="block">
        <span className="block text-body-sm text-ink mb-xxs">{t("message")}</span>
        <textarea
          name="message"
          required
          maxLength={2000}
          rows={6}
          className="w-full px-md py-md bg-canvas border border-ash rounded-md text-body-md text-ink"
        />
      </label>

      {/* Turnstile widget renders this token into the hidden field */}
      <div
        className="cf-turnstile"
        data-sitekey={turnstileSiteKey}
        data-callback="onTurnstileSuccess"
      />
      <input type="hidden" name="turnstileToken" id="turnstileToken" />
      <script
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: `function onTurnstileSuccess(t){document.getElementById('turnstileToken').value=t;}`,
        }}
      />
      <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />

      <Button variant="primary" size="md" disabled={isPending}>
        {isPending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Contact page**

```tsx
// app/[locale]/contact/page.tsx
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { DisplayHeading } from "@/components/primitives/DisplayHeading";
import { ContactForm } from "@/components/ui/ContactForm";
import { env } from "@/lib/env";

export default async function Contact({
  params,
}: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");

  return (
    <main className="min-h-screen bg-canvas pt-section pb-section">
      <div className="max-w-[640px] mx-auto px-xl space-y-xxl">
        <div>
          <p className="text-caption-md uppercase tracking-wider text-mute mb-md">{t("subtitle")}</p>
          <DisplayHeading level="lg">{t("title")}</DisplayHeading>
        </div>
        <ContactForm turnstileSiteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Smoke test**

```bash
npm run dev
```

Visit `/contact`. Expect the form to render. Submission with placeholder Turnstile keys will fail with "Bot challenge failed" — that's correct behavior until real keys are provided.

Stop server.

- [ ] **Step 4: Commit**

```bash
git add components/ui/ContactForm.tsx app/[locale]/contact
git commit -m "feat: contact form with Turnstile widget wired to Server Action"
```

---

## Phase 7 — SEO

### Task 26: lib/seo.ts metadata helpers

**Files:**
- Create: `lib/seo.ts`

- [ ] **Step 1: Implement helpers**

```ts
// lib/seo.ts
import type { Metadata } from "next";
import { env } from "@/lib/env";

const SITE = env.NEXT_PUBLIC_SITE_URL;

export function pageMetadata(args: {
  locale: "ko" | "en";
  path: string;           // locale-agnostic path, e.g. "/products/sample"
  title: string;
  description: string;
  image?: string;
}): Metadata {
  // Korean has no prefix (root locale); English uses /en.
  const koUrl = `${SITE}${args.path}`;
  const enUrl = `${SITE}/en${args.path}`;
  const ownUrl = args.locale === "ko" ? koUrl : enUrl;

  return {
    metadataBase: new URL(SITE),
    title: args.title,
    description: args.description,
    openGraph: {
      title: args.title,
      description: args.description,
      url: ownUrl,
      locale: args.locale === "ko" ? "ko_KR" : "en_US",
      type: "website",
      images: args.image ? [{ url: args.image }] : undefined,
    },
    twitter: { card: "summary_large_image", title: args.title, description: args.description },
    alternates: {
      canonical: ownUrl,
      languages: {
        "ko-KR": koUrl,
        "en-US": enUrl,
      },
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "h3",
    url: SITE,
  };
}

export function productJsonLd(p: { title: string; tagline: string; slug: string; locale: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.title,
    description: p.tagline,
    url: `${SITE}${p.locale === "en" ? "/en" : ""}/products/${p.slug}`,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/seo.ts
git commit -m "feat: SEO metadata + JSON-LD helpers"
```

---

### Task 27: generateMetadata on all pages

**Files:**
- Modify: `app/[locale]/page.tsx`
- Modify: `app/[locale]/about/page.tsx`
- Modify: `app/[locale]/products/page.tsx`
- Modify: `app/[locale]/products/[slug]/page.tsx`
- Modify: `app/[locale]/contact/page.tsx`

- [ ] **Step 1a: Home page metadata**

Edit `app/[locale]/page.tsx`. Add near the top (alongside existing imports):

```ts
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home.hero" });
  return pageMetadata({
    locale: locale as "ko" | "en",
    path: "/",
    title: `h3 — ${t("headline")}`,
    description: t("eyebrow"),
  });
}
```

- [ ] **Step 1b: About page metadata**

Edit `app/[locale]/about/page.tsx`. Add near the top:

```ts
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return pageMetadata({
    locale: locale as "ko" | "en",
    path: "/about",
    title: `${t("title")} — h3`,
    description: t("title"),
  });
}
```

- [ ] **Step 1c: Products list metadata**

Edit `app/[locale]/products/page.tsx`. Add near the top:

```ts
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "products" });
  return pageMetadata({
    locale: locale as "ko" | "en",
    path: "/products",
    title: `${t("title")} — h3`,
    description: t("subtitle"),
  });
}
```

- [ ] **Step 1d: Product detail metadata**

Edit `app/[locale]/products/[slug]/page.tsx`. Add near the top:

```ts
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  try {
    const product = await getProduct(slug, locale as "ko" | "en");
    return pageMetadata({
      locale: locale as "ko" | "en",
      path: `/products/${slug}`,
      title: `${product.title} — h3`,
      description: product.tagline,
    });
  } catch {
    return pageMetadata({
      locale: locale as "ko" | "en",
      path: `/products/${slug}`,
      title: "h3",
      description: "h3",
    });
  }
}
```

- [ ] **Step 1e: Contact page metadata**

Edit `app/[locale]/contact/page.tsx`. Add near the top:

```ts
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return pageMetadata({
    locale: locale as "ko" | "en",
    path: "/contact",
    title: `${t("title")} — h3`,
    description: t("subtitle"),
  });
}
```

- [ ] **Step 2: Inject Organization JSON-LD globally**

Edit `app/[locale]/layout.tsx`. Inside the `<body>` near the top, add:

```tsx
import Script from "next/script";
import { organizationJsonLd } from "@/lib/seo";
// ...
<body>
  <Script
    id="org-jsonld"
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
  />
  <LenisProvider> ... </LenisProvider>
</body>
```

- [ ] **Step 3: Inject Product JSON-LD on detail page**

Edit `app/[locale]/products/[slug]/page.tsx`. Inside the `<article>`, add:

```tsx
import Script from "next/script";
import { productJsonLd } from "@/lib/seo";
// ...
<Script
  id={`product-jsonld-${slug}`}
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(productJsonLd({ title: product.title, tagline: product.tagline, slug, locale })),
  }}
/>
```

- [ ] **Step 4: Commit**

```bash
git add app/[locale]
git commit -m "feat: generateMetadata + JSON-LD on every route"
```

---

### Task 28: sitemap.ts and robots.ts

**Files:**
- Create: `app/sitemap.ts`
- Create: `app/robots.ts`

- [ ] **Step 1: sitemap**

```ts
// app/sitemap.ts
import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { getAllProductSlugs } from "@/lib/mdx";

const SITE = env.NEXT_PUBLIC_SITE_URL;
const STATIC = ["", "/about", "/products", "/contact"] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getAllProductSlugs();
  const productPaths = slugs.map((s) => `/products/${s}`);
  const allPaths = [...STATIC, ...productPaths];

  return allPaths.flatMap((path) => [
    { url: `${SITE}${path}`, lastModified: new Date() },
    { url: `${SITE}/en${path}`, lastModified: new Date() },
  ]);
}
```

- [ ] **Step 2: robots**

```ts
// app/robots.ts
import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const isProduction = process.env.VERCEL_ENV === "production";
  return {
    rules: isProduction
      ? [{ userAgent: "*", allow: "/" }]
      : [{ userAgent: "*", disallow: "/" }],
    sitemap: `${env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
  };
}
```

- [ ] **Step 3: Verify**

```bash
npm run dev
```

Visit `/sitemap.xml` and `/robots.txt`. Expect listings and robots rules. Stop server.

- [ ] **Step 4: Commit**

```bash
git add app/sitemap.ts app/robots.ts
git commit -m "feat: sitemap.ts and robots.ts"
```

---

### Task 29: Dynamic OG images

**Files:**
- Create: `app/[locale]/opengraph-image.tsx`
- Create: `app/[locale]/products/[slug]/opengraph-image.tsx`

- [ ] **Step 1: Default OG image**

```tsx
// app/[locale]/opengraph-image.tsx
import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "home.hero" });
  return new ImageResponse(
    (
      <div style={{
        background: "#ffffff", width: "100%", height: "100%",
        display: "flex", flexDirection: "column", justifyContent: "center", padding: 64,
      }}>
        <div style={{ color: "#e60023", fontSize: 36, fontWeight: 700 }}>h3</div>
        <div style={{ color: "#000000", fontSize: 72, fontWeight: 700, marginTop: 16, letterSpacing: -1.2 }}>
          {t("headline")}
        </div>
      </div>
    ),
    size
  );
}
```

- [ ] **Step 2: Product OG image**

```tsx
// app/[locale]/products/[slug]/opengraph-image.tsx
import { ImageResponse } from "next/og";
import { getProduct } from "@/lib/mdx";

export const runtime = "nodejs"; // mdx loader uses fs
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({ params }: { params: { locale: string; slug: string } }) {
  const product = await getProduct(params.slug, params.locale as "ko" | "en");
  return new ImageResponse(
    (
      <div style={{
        background: "#ffffff", width: "100%", height: "100%",
        display: "flex", flexDirection: "column", justifyContent: "center", padding: 64,
      }}>
        <div style={{ color: "#62625b", fontSize: 24 }}>{product.tagline}</div>
        <div style={{ color: "#000000", fontSize: 72, fontWeight: 700, marginTop: 16, letterSpacing: -1.2 }}>
          {product.title}
        </div>
      </div>
    ),
    size
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/[locale]/opengraph-image.tsx app/[locale]/products/[slug]/opengraph-image.tsx
git commit -m "feat: dynamic OG images for home and product pages"
```

---

## Phase 8 — Error Pages

### Task 30: not-found and error boundary

**Files:**
- Create: `app/[locale]/not-found.tsx`
- Create: `app/error.tsx`

- [ ] **Step 1: not-found.tsx**

```tsx
// app/[locale]/not-found.tsx
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { DisplayHeading } from "@/components/primitives/DisplayHeading";
import { Button } from "@/components/ui/Button";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <main className="min-h-screen bg-canvas flex items-center justify-center px-xl">
      <div className="text-center space-y-xl">
        <DisplayHeading level="lg">{t("title")}</DisplayHeading>
        <Button href="/" variant="primary" size="md">{t("back")}</Button>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: error.tsx**

```tsx
// app/error.tsx
"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <html>
      <body className="bg-canvas min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-display-lg text-ink mb-md">Something went wrong</h1>
          <button onClick={reset} className="bg-primary text-on-primary rounded-md px-4 h-10 inline-flex items-center">
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/[locale]/not-found.tsx app/error.tsx
git commit -m "feat: localized 404 and global error boundary"
```

---

## Phase 9 — Testing

### Task 31: i18n key parity script

**Files:**
- Create: `scripts/check-i18n-parity.ts`
- Modify: `package.json` to add script

- [ ] **Step 1: Script**

```ts
// scripts/check-i18n-parity.ts
import ko from "../messages/ko.json";
import en from "../messages/en.json";

function flatten(obj: unknown, prefix = ""): string[] {
  if (typeof obj !== "object" || obj === null) return [prefix];
  return Object.entries(obj).flatMap(([k, v]) => flatten(v, prefix ? `${prefix}.${k}` : k));
}

const koKeys = new Set(flatten(ko));
const enKeys = new Set(flatten(en));

const missingInEn = [...koKeys].filter((k) => !enKeys.has(k));
const missingInKo = [...enKeys].filter((k) => !koKeys.has(k));

if (missingInEn.length || missingInKo.length) {
  console.error("i18n key mismatch:");
  if (missingInEn.length) console.error("  missing in en:", missingInEn);
  if (missingInKo.length) console.error("  missing in ko:", missingInKo);
  process.exit(1);
}
console.log("i18n parity OK");
```

- [ ] **Step 2: Add script to package.json**

```json
"scripts": {
  "check:i18n": "tsx scripts/check-i18n-parity.ts"
}
```

(Also add to `tsconfig.json`'s `include` if needed, ensuring `*.json` resolves with `resolveJsonModule: true`. The default Next.js tsconfig already enables it.)

- [ ] **Step 3: Run**

```bash
npm run check:i18n
```

Expected: "i18n parity OK".

- [ ] **Step 4: Commit**

```bash
git add scripts/check-i18n-parity.ts package.json
git commit -m "feat: i18n key parity check script"
```

---

### Task 32: Playwright setup

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/home.spec.ts`
- Create: `tests/e2e/locale-switch.spec.ts`
- Create: `tests/e2e/contact.spec.ts`

- [ ] **Step 1: playwright.config.ts**

```ts
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: { baseURL: "http://localhost:3000", trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- [ ] **Step 2: home.spec.ts**

```ts
// tests/e2e/home.spec.ts
import { test, expect } from "@playwright/test";

test("home page loads with hero", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("기술이");
  await expect(page.locator("a", { hasText: "제품 보기" })).toBeVisible();
});

test("home page scroll reveals sections", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);
  await expect(page.locator("footer")).toBeVisible();
});
```

- [ ] **Step 3: locale-switch.spec.ts**

```ts
// tests/e2e/locale-switch.spec.ts
import { test, expect } from "@playwright/test";

test("locale switch preserves path", async ({ page }) => {
  await page.goto("/about");
  await page.click("text=EN");
  await expect(page).toHaveURL(/\/en\/about/);
  await expect(page.locator("h1")).toContainText("About");

  await page.click("text=KO");
  await expect(page).toHaveURL(/^http:\/\/localhost:3000\/about/);
});
```

- [ ] **Step 4: contact.spec.ts**

```ts
// tests/e2e/contact.spec.ts
import { test, expect } from "@playwright/test";

test("contact form renders fields", async ({ page }) => {
  await page.goto("/contact");
  await expect(page.locator('input[name="name"]')).toBeVisible();
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.locator('textarea[name="message"]')).toBeVisible();
});

// Submission test deliberately omitted — requires real or mocked Turnstile + Resend.
// Add this when test-mode keys are wired up.
```

- [ ] **Step 5: Add scripts**

```json
"scripts": {
  "test:e2e": "playwright test"
}
```

- [ ] **Step 6: Run tests**

```bash
npm run test:e2e
```

Expected: 4 passing tests. If failures occur, fix per error message before committing.

- [ ] **Step 7: Commit**

```bash
git add playwright.config.ts tests/e2e package.json
git commit -m "test: Playwright E2E for home, locale switch, and contact UI"
```

---

### Task 33: Lighthouse CI

**Files:**
- Create: `.lighthouserc.json`
- Create: `.github/workflows/lighthouse.yml`

- [ ] **Step 1: Lighthouse config**

```json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000", "http://localhost:3000/en", "http://localhost:3000/products"],
      "startServerCommand": "npm run start",
      "numberOfRuns": 1
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["error", { "minScore": 0.95 }],
        "categories:seo": ["error", { "minScore": 0.95 }]
      }
    }
  }
}
```

- [ ] **Step 2: GitHub Action**

```yaml
# .github/workflows/lighthouse.yml
name: lighthouse
on:
  pull_request:
    branches: [main]
jobs:
  lhci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run build
        env:
          RESEND_API_KEY: placeholder
          CONTACT_TO_EMAIL: a@b.test
          CONTACT_FROM_EMAIL: a@b.test
          TURNSTILE_SECRET_KEY: placeholder
          NEXT_PUBLIC_TURNSTILE_SITE_KEY: placeholder
          NEXT_PUBLIC_SITE_URL: http://localhost:3000
      - run: npx @lhci/cli autorun --upload.target=temporary-public-storage
```

- [ ] **Step 3: Commit**

```bash
git add .lighthouserc.json .github/workflows/lighthouse.yml
git commit -m "ci: Lighthouse CI thresholds (perf 90, a11y/best/seo 95)"
```

---

## Phase 10 — Build Verification & Deploy Prep

### Task 34: Production build smoke test

- [ ] **Step 1: Build**

```bash
npm run build
```

Expected: clean build, no type errors, no missing env vars (all placeholder env values in `.env.local` are valid).

- [ ] **Step 2: Start production server**

```bash
npm run start
```

Visit `/`, `/en`, `/products`, `/products/sample`, `/en/products/sample`, `/about`, `/contact`, `/sitemap.xml`, `/robots.txt`. Verify each renders without error.

Stop server.

- [ ] **Step 3: Run all checks**

```bash
npm run test:unit
npm run check:i18n
npm run test:e2e
```

Expected: all green.

- [ ] **Step 4: Commit any final fixes**

```bash
git add -A
git status
# only commit if there are changes
```

---

### Task 35: Add Vercel Analytics + Speed Insights

**Files:**
- Modify: `app/[locale]/layout.tsx`
- Modify: `package.json` (via install)

- [ ] **Step 1: Install**

```bash
npm install @vercel/analytics @vercel/speed-insights
```

- [ ] **Step 2: Wire them in**

```tsx
// app/[locale]/layout.tsx — inside <body>, near closing tag
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
// ...
<Footer />
<Analytics />
<SpeedInsights />
```

- [ ] **Step 3: Commit**

```bash
git add app/[locale]/layout.tsx package.json package-lock.json
git commit -m "feat: Vercel Analytics + Speed Insights"
```

---

### Task 36: Document deployment in README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Write deployment notes**

Replace `README.md` with:

```markdown
# h3 Company Intro Site

Bilingual (KR/EN) marketing site. Next.js 16, Tailwind v4, next-intl, GSAP + Lenis, MDX product pages, Resend-backed contact form, Cloudflare Turnstile, deployed to Vercel.

## Local development

```bash
npm install
cp .env.example .env.local
# Fill in placeholder values (any non-empty strings work for local dev unless you're testing Resend/Turnstile end-to-end)
npm run dev
```

Visit http://localhost:3000 (Korean) or http://localhost:3000/en.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build locally |
| `npm run test:unit` | tsx-based unit tests (MDX loader, Turnstile helper) |
| `npm run test:e2e` | Playwright E2E |
| `npm run check:i18n` | Verify ko.json and en.json have identical key trees |

## Adding a product

Create two MDX files:
- `content/products/<slug>.ko.mdx`
- `content/products/<slug>.en.mdx`

Each requires frontmatter validated by `lib/mdx.ts` (title, tagline, hero_image, order, draft). Commit and redeploy — the new product appears in `/products`, `/products/<slug>`, `sitemap.xml`, and gets a dynamic OG image automatically.

## Deploy

Vercel auto-detects Next.js. Set these env vars in the project's Vercel dashboard (Production + Preview):

| Name | Notes |
|---|---|
| `RESEND_API_KEY` | From Resend dashboard |
| `CONTACT_TO_EMAIL` | Where form submissions arrive |
| `CONTACT_FROM_EMAIL` | Must be on a Resend-verified domain |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile (server) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile (client) |
| `NEXT_PUBLIC_SITE_URL` | e.g. `https://h3.example.com` |

Production = `main` branch. Every PR gets a preview URL automatically.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: README with local dev, scripts, MDX content workflow, deploy notes"
```

---

## Done

Production deployment beyond this point:
1. Push to a GitHub repo (`gh repo create` + `git push -u origin main`).
2. Import to Vercel.
3. Add env vars in Vercel project settings.
4. Verify the deployment URL.
5. Connect a custom domain.
6. Replace `/public/hero-placeholder.jpg` and sample product MDX with real content.

---

## Spec Coverage Check

| Spec requirement | Implemented in task |
|---|---|
| Next.js 16 App Router | Task 1 |
| TypeScript strict | Task 1 |
| Tailwind v4 with DESIGN.md tokens | Task 3 |
| Self-hosted typography (Inter as Pin Sans substitute) | Task 4 |
| Env validation | Task 5 |
| next-intl, ko root, en /en | Tasks 6-8 |
| Locale-scoped layout, Header, Footer | Tasks 7, 9, 10 |
| Locale switcher | Task 8 |
| GSAP + Lenis with reduced-motion guard | Task 11 |
| ScrollReveal, DisplayHeading, GhostPill, Button | Tasks 9, 12, 13 |
| Hero, FeatureCardRow, CtaStrip, ProductShowcase | Tasks 14-16, 20 |
| Home page assembled | Task 20 |
| About page | Task 21 |
| Contact form schema + Turnstile (TDD) | Tasks 22, 23 |
| Contact Server Action + Resend | Task 24 |
| Contact UI | Task 25 |
| MDX loader (TDD) + sample products | Task 17 |
| Products list and detail | Tasks 18, 19 |
| SEO metadata helpers | Task 26 |
| generateMetadata per route, JSON-LD | Task 27 |
| sitemap.ts, robots.ts | Task 28 |
| Dynamic OG images | Task 29 |
| 404 + error boundary | Task 30 |
| i18n key parity | Task 31 |
| Playwright E2E (home, locale, contact UI) | Task 32 |
| Lighthouse CI gate | Task 33 |
| Vercel Analytics + Speed Insights | Task 35 |
| README with deploy notes | Task 36 |
