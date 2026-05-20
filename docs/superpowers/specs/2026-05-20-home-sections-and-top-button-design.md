# Home Sections + TOP Button — Design Spec

**Date:** 2026-05-20
**Status:** Approved (brainstorming) → ready for implementation plan
**Topic:** Benchmark Stella ERP's structure into H3's brand. Add a
scroll-to-top button (site-wide) and three new home sections — a
service/capability card grid, a build-process timeline, and a FAQ
accordion — using shadcn-style Card + Accordion primitives themed to
DESIGN.md (NO dark mode).

## Goal

Make the H3 home a richer single-scroll page (Stella-inspired) and add a
floating TOP button, while staying fully on H3's light cream/white + red
brand. New repeated UI (cards, accordion) is built as reusable themed
primitives.

## Background / current state

- Home (`app/[locale]/page.tsx`): `Hero → FeatureCardRow → ProductShowcase
  → CtaStrip`. Sections live in `components/sections/`.
- Brand (AGENTS.md / DESIGN.md): light fixed theme, NO dark mode, warm
  cream/white + `#e60023` red. Tailwind v4 `@theme` tokens (`bg-canvas`,
  `bg-surface-card/elevated/soft`, `text-ink/body/mute/ash`,
  `border-hairline/ash`, `text-primary`, radii `rounded-sm/md/lg`). The
  `--spacing-{xs..xl}` namespace is forbidden.
- Existing themed primitives from prior work: `components/ui/Button.tsx`,
  `input.tsx`, `select.tsx`, `lib/utils.ts` `cn()`. Lenis smooth scroll
  via `components/layout/LenisProvider.tsx` (instance currently local to
  that component). lucide-react installed.
- i18n: next-intl, ko + en parity enforced (`pnpm run check:i18n`).

## Decisions (locked during brainstorming)

1. Scope: TOP button + Service grid + Process timeline + FAQ accordion.
   All three sections on the home page; TOP button is site-wide.
2. No floating quick-action rail (dropped) — only the TOP button.
3. "Pricing" is replaced by a build-process / quote-guidance timeline
   (H3 is custom fabrication, no fixed prices); it ends in a "견적 문의"
   CTA to `/contact`.
4. Repeated UI uses shadcn-structured primitives themed to our tokens,
   hand-authored (NOT via the shadcn CLI, which would rewrite
   globals.css / the Tailwind v4 `@theme`). New deps: `@radix-ui/react-
   accordion`.
5. All copy is bilingual via next-intl; content is drafted here from
   H3's business (PVC/PP fume hoods, scrubbers, exhaust ducting, custom
   fabrication) and the user proofreads (company content).

## New / changed files

- Create `components/ui/card.tsx` — themed Card primitive (Card,
  CardHeader/Title/Description/Content optional subparts as needed).
- Create `components/ui/accordion.tsx` — themed Radix Accordion primitive
  (Accordion, AccordionItem, AccordionTrigger, AccordionContent).
- Create `components/sections/ServiceGrid.tsx` — capability card grid.
- Create `components/sections/ProcessSection.tsx` — build-process steps.
- Create `components/sections/FaqSection.tsx` — FAQ accordion.
- Create `components/layout/TopButton.tsx` — scroll-to-top button.
- Modify `app/[locale]/page.tsx` — insert ServiceGrid + ProcessSection
  (after FeatureCardRow) and FaqSection (after ProductShowcase).
- Modify `app/[locale]/layout.tsx` — mount `<TopButton />` (inside the
  LenisProvider tree, after `<Footer />`).
- Modify `components/layout/LenisProvider.tsx` — expose the Lenis
  instance so TopButton can `scrollTo(0)` smoothly (small module-level
  ref/singleton, e.g. `export function getLenis()`), instead of fighting
  Lenis with `window.scrollTo`.
- Modify `messages/ko.json` + `messages/en.json` — `home.services`,
  `home.process`, `home.faq` trees + `common.toTop`.
- Modify `package.json` / lockfile — `@radix-ui/react-accordion`.
- (Optional) `tests/unit/*` — light unit for any pure helper if added;
  these are presentational, so primary verification is build + browser.

## Component designs

### TopButton (`components/layout/TopButton.tsx`, client, site-wide)
- Fixed bottom-right (e.g. `fixed bottom-6 right-6 z-40`). Hidden until
  the user scrolls > ~400px, then fades in (`opacity`/`translate`
  transition; gated by `prefers-reduced-motion`).
- Circular, themed: `bg-surface-elevated` + `border border-hairline` +
  subtle shadow + ink `ChevronUp` (lucide); hover → `border-primary` /
  `text-primary`.
- Click → smooth scroll to top via the Lenis instance
  (`getLenis()?.scrollTo(0)`), falling back to
  `window.scrollTo({ top: 0 })` when Lenis is absent (reduced-motion).
- `type="button"`, `aria-label={t("common.toTop")}`.
- Scroll listener via Lenis `on("scroll")` or a passive `scroll` listener;
  cleaned up on unmount.

### Card primitive (`components/ui/card.tsx`)
- shadcn-shape, themed: `Card` = `rounded-md border border-hairline
  bg-surface-card` (no dark variants). Minimal subparts as ServiceGrid
  needs (icon slot, title, description). Keep it small/composable; do not
  over-build subparts that aren't used (YAGNI).

### ServiceGrid (`components/sections/ServiceGrid.tsx`, home)
- `<section>` with a heading (`home.services.title`) + optional eyebrow,
  then a responsive grid (`grid sm:grid-cols-2 lg:grid-cols-3 gap-4/6`)
  of ~6 Cards. Each card: lucide line icon (in a primary-tinted chip),
  title, one-line description. Hover lifts border to `border-primary` /
  icon to `text-primary`.
- Items (drafted, user proofreads): 설계·도면 / CNC 정밀가공 / PVC·PP
  용접 / 흄후드·부스 제작 / 스크러버·배기배관 / 현장시공·유지보수.

### ProcessSection (`components/sections/ProcessSection.tsx`, home)
- `<section>` heading (`home.process.title`) + steps. Desktop: horizontal
  row of numbered steps with a connector line; mobile: vertical stack.
- Steps (drafted): 1 상담·문의 → 2 현장실측·설계 → 3 CNC 가공 → 4
  제작·용접 → 5 현장 시공 → 6 유지보수. Each: number badge (primary),
  title, short desc.
- Ends with a "견적 문의" Button → `/contact`.

### FaqSection (`components/sections/FaqSection.tsx`, home) + Accordion
- `accordion.tsx`: Radix Accordion themed — `AccordionItem`
  (border-b hairline), `AccordionTrigger` (full-width button, question
  text + a `ChevronDown` that rotates 180° on `data-state=open`),
  `AccordionContent` (Radix height animation via
  `data-[state=open]:animate-...` or the radix CSS height var; answer in
  `text-body`). `type="single"` `collapsible` (one open at a time;
  starts all closed).
- FaqSection: `<section>` heading (`home.faq.title`) + Accordion with ~6
  items pulled from i18n. Questions (drafted): 견적은 어떻게 받나요? /
  제작 기간은 얼마나? / 어떤 소재(PVC·PP)를 쓰나요? / 현장 시공도
  해주나요? / A/S·유지보수는? / 상담은 어떻게 시작하나요?

## Home integration order

`Hero → FeatureCardRow → ServiceGrid → ProcessSection → ProductShowcase
→ FaqSection → CtaStrip`. Each new section uses consistent vertical
rhythm (`py-section`) and the `max-w-*` container conventions already in
use.

## i18n

New keys (both locales, identical tree):
- `common.toTop`
- `home.services`: `title`, `eyebrow?`, `items[]` (title + desc) — encode
  as `items.design.title/desc`, `.cnc.*`, `.welding.*`, `.fabrication.*`,
  `.scrubber.*`, `.field.*` (fixed keys, not an array, to stay typed and
  parity-checkable).
- `home.process`: `title`, `eyebrow?`, `cta`, steps `s1.title/desc` …
  `s6.title/desc`.
- `home.faq`: `title`, `eyebrow?`, `q1.q/a` … `q6.q/a`.

`pnpm run check:i18n` must pass. All copy via `t(...)`, never hardcoded.

## Accessibility / semantics

- Each section is a `<section>` with a single `<h2>` (the page `<h1>` is
  the SEO header). Service cards: heading + text, icons `aria-hidden`.
- Accordion: Radix gives correct `button`/`region`/`aria-expanded`.
- TopButton: real `<button>` with `aria-label`; reduced-motion respected.
- Process steps use an ordered structure (`<ol>`/list) for meaning.

## Lenis exposure

`LenisProvider` currently keeps `lenis` in a local ref. Add a
module-level accessor (`let current: Lenis | null` + `getLenis()`) set on
create / cleared on destroy, so `TopButton` (a sibling client component)
can call `getLenis()?.scrollTo(0, { duration: 1 })`. No global window
pollution; no behavior change to existing scroll handling.

## Testing / verification

- `pnpm exec tsc --noEmit`, `pnpm run lint`, `pnpm run check:i18n` green.
- `pnpm build` is the deploy gate (run on a clean machine / Vercel).
- Browser pass (browse skill): home renders the 3 new sections in order;
  service cards hover; process timeline desktop/mobile; FAQ items
  open/close (one at a time) with animation; TOP button appears after
  scroll and returns to top; `/en` shows English; no console errors.

## Out of scope (YAGNI)

Floating quick-action rail, catalog/PDF download, real pricing/numbers,
dark mode, shadcn CLI adoption, a separate /faq or /services route,
replacing existing Hero/Feature/Product/Cta sections.
