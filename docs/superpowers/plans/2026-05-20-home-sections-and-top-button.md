# Home Sections + TOP Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a site-wide scroll-to-top button and three new home sections (service card grid, build-process timeline, FAQ accordion) on H3's light cream/red brand, using shadcn-shaped Card + Radix Accordion primitives.

**Architecture:** Three self-contained client section components under `components/sections/`, each calling `useTranslations` for its own i18n subtree. Reusable themed primitives (`components/ui/card.tsx`, `components/ui/accordion.tsx`). A `TopButton` mounted site-wide in the layout, scrolling via the Lenis instance exposed by `LenisProvider`.

**Tech Stack:** Next 16, React 19, TS strict (`noUncheckedIndexedAccess`), Tailwind v4 `@theme`, next-intl, @radix-ui/react-accordion, lucide-react, Lenis.

**Spec:** `docs/superpowers/specs/2026-05-20-home-sections-and-top-button-design.md`

**Verification note:** These are presentational components; the repo unit-tests pure logic only (tsx assertion suite), not React UI. So each task's gate is `pnpm exec tsc --noEmit` + `pnpm run lint` (+ `pnpm run check:i18n` for the i18n task), with a final browser pass. No fake unit tests are written for UI.

---

### Task 1: Deps + Lenis exposure + accordion keyframes

**Files:**
- Modify: `package.json` (pnpm)
- Modify: `components/layout/LenisProvider.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Install the accordion primitive dep**

Run: `pnpm add @radix-ui/react-accordion`
Expected: added to `dependencies`, lockfile updated, no React 19 peer errors.

- [ ] **Step 2: Expose the Lenis instance from LenisProvider**

In `components/layout/LenisProvider.tsx`, add a module-level accessor above the component and set/clear it in the existing create effect.

Add after the imports (line 6 area), before `export function LenisProvider`:
```tsx
// Module-level handle so sibling client components (e.g. TopButton) can
// drive the single Lenis instance without prop-drilling or window globals.
let lenisInstance: Lenis | null = null;
export function getLenis(): Lenis | null {
  return lenisInstance;
}
```

In the create effect, right after `lenisRef.current = lenis;`:
```tsx
    lenisRef.current = lenis;
    lenisInstance = lenis;
```

In that effect's cleanup, alongside `lenisRef.current = null;`:
```tsx
      lenis.destroy();
      lenisRef.current = null;
      lenisInstance = null;
```

- [ ] **Step 3: Add accordion keyframes/animation tokens to the theme**

In `app/globals.css`, inside the existing `@theme { ... }` block (e.g. just before its closing `}`), add:
```css
  /* Radix Accordion height animation (consumed by components/ui/accordion.tsx) */
  --animate-accordion-down: accordion-down 0.2s ease-out;
  --animate-accordion-up: accordion-up 0.2s ease-out;
  @keyframes accordion-down {
    from { height: 0; }
    to { height: var(--radix-accordion-content-height); }
  }
  @keyframes accordion-up {
    from { height: var(--radix-accordion-content-height); }
    to { height: 0; }
  }
```
Do NOT add any `--spacing-{xs,sm,md,lg,xl}` tokens or dark variants.

- [ ] **Step 4: Verify**

Run: `pnpm exec tsc --noEmit && pnpm run lint`
Expected: both clean (no errors).

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml components/layout/LenisProvider.tsx app/globals.css
git commit -m "chore: add radix-accordion, expose Lenis, accordion keyframes"
```
(End the commit body with a blank line then:
`Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`)

---

### Task 2: Card primitive

**Files:**
- Create: `components/ui/card.tsx`

- [ ] **Step 1: Create the component**

`components/ui/card.tsx`:
```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-md border border-hairline bg-surface-card p-6",
        className
      )}
      {...props}
    />
  );
}
```

- [ ] **Step 2: Verify**

Run: `pnpm exec tsc --noEmit && pnpm run lint`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add components/ui/card.tsx
git commit -m "feat: themed Card primitive"
```
(+ Co-Authored-By trailer)

---

### Task 3: Accordion primitive

**Files:**
- Create: `components/ui/accordion.tsx`

- [ ] **Step 1: Create the component**

`components/ui/accordion.tsx`:
```tsx
"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Accordion = AccordionPrimitive.Root;

export const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-b border-hairline", className)}
    {...props}
  />
));
AccordionItem.displayName = "AccordionItem";

export const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between gap-3 py-4 text-left text-body-strong text-ink transition-colors hover:text-primary cursor-pointer [&[data-state=open]>svg]:rotate-180",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown
        aria-hidden
        className="size-5 shrink-0 text-mute transition-transform duration-200"
      />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = "AccordionTrigger";

export const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-body-md text-body data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn("pb-4 pr-8 leading-relaxed", className)}>
      {children}
    </div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = "AccordionContent";
```

- [ ] **Step 2: Verify**

Run: `pnpm exec tsc --noEmit && pnpm run lint`
Expected: clean (Radix v1 + React 19 generics compile).

- [ ] **Step 3: Commit**

```bash
git add components/ui/accordion.tsx
git commit -m "feat: themed Radix Accordion primitive"
```
(+ Co-Authored-By trailer)

---

### Task 4: i18n content (ko + en)

**Files:**
- Modify: `messages/ko.json`
- Modify: `messages/en.json`

- [ ] **Step 1: Add a `common` top-level block to BOTH files**

If `messages/ko.json` has no top-level `"common"` key, add one (sibling of `home`, `contact`, etc.):
```json
"common": {
  "toTop": "맨 위로"
}
```
And in `messages/en.json`:
```json
"common": {
  "toTop": "Back to top"
}
```

- [ ] **Step 2: Add the three home subtrees to `messages/ko.json` `home`**

Inside the existing `"home": { ... }` object (sibling of `hero`/`feature`/`products`/`closing`), add:
```json
"services": {
  "eyebrow": "서비스",
  "title": "H3의 핵심 역량",
  "items": {
    "design": { "title": "설계·도면", "desc": "현장 실측을 바탕으로 레이아웃과 도면을 설계합니다." },
    "cnc": { "title": "CNC 정밀가공", "desc": "CNC 라우터로 PVC·PP를 정밀하게 가공합니다." },
    "welding": { "title": "PVC·PP 용접", "desc": "내화학 구조를 위한 전문 열풍 용접." },
    "fabrication": { "title": "흄후드·부스 제작", "desc": "용도에 맞춘 흄후드와 정련 부스를 제작합니다." },
    "scrubber": { "title": "스크러버·배기배관", "desc": "유해가스 처리 스크러버와 배기 배관 시공." },
    "field": { "title": "현장시공·유지보수", "desc": "현장 설치부터 정기 점검·A/S까지." }
  }
},
"process": {
  "eyebrow": "프로세스",
  "title": "제작 진행 과정",
  "cta": "견적 문의",
  "s1": { "title": "상담·문의", "desc": "요구사항과 현장 조건을 함께 파악합니다." },
  "s2": { "title": "현장실측·설계", "desc": "실측 후 레이아웃과 도면을 설계합니다." },
  "s3": { "title": "CNC 가공", "desc": "승인 도면대로 정밀 가공합니다." },
  "s4": { "title": "제작·용접", "desc": "PVC·PP를 용접해 구조물을 제작합니다." },
  "s5": { "title": "현장 시공", "desc": "현장에 설치하고 배기 배관을 연결합니다." },
  "s6": { "title": "유지보수", "desc": "정기 점검과 신속한 A/S를 제공합니다." }
},
"faq": {
  "eyebrow": "FAQ",
  "title": "자주 묻는 질문",
  "q1": { "q": "견적은 어떻게 받나요?", "a": "문의 양식이나 전화로 요구사항을 보내주시면 현장 조건을 검토해 맞춤 견적을 안내드립니다." },
  "q2": { "q": "제작 기간은 얼마나 걸리나요?", "a": "규모와 사양에 따라 다르지만, 설계 확정 후 보통 2~6주가 소요됩니다." },
  "q3": { "q": "어떤 소재를 사용하나요?", "a": "내화학성과 내구성이 뛰어난 PVC·PP를 주로 사용하며, 용도에 맞게 선택합니다." },
  "q4": { "q": "현장 시공도 해주나요?", "a": "네, 제작부터 현장 설치와 배기 배관 연결까지 일괄로 진행합니다." },
  "q5": { "q": "A/S·유지보수는 어떻게 되나요?", "a": "설치 후 정기 점검과 신속한 사후 서비스를 제공합니다." },
  "q6": { "q": "상담은 어떻게 시작하나요?", "a": "상단 ‘문의’ 페이지의 양식을 작성하시거나 대표번호로 연락 주시면 됩니다." }
}
```

- [ ] **Step 3: Add the SAME subtrees to `messages/en.json` `home`** (identical key tree):
```json
"services": {
  "eyebrow": "Services",
  "title": "What H3 does",
  "items": {
    "design": { "title": "Design & drawings", "desc": "Layouts and drawings based on on-site measurement." },
    "cnc": { "title": "CNC machining", "desc": "Precision PVC/PP cutting on CNC routers." },
    "welding": { "title": "PVC/PP welding", "desc": "Expert hot-air welding for chemical-resistant structures." },
    "fabrication": { "title": "Fume hoods & booths", "desc": "Custom fume hoods and refining booths." },
    "scrubber": { "title": "Scrubbers & ducting", "desc": "Gas-treatment scrubbers and exhaust ducting." },
    "field": { "title": "Install & maintenance", "desc": "On-site install plus inspection and service." }
  }
},
"process": {
  "eyebrow": "Process",
  "title": "How we work",
  "cta": "Request a quote",
  "s1": { "title": "Consultation", "desc": "We capture your requirements and site conditions." },
  "s2": { "title": "Survey & design", "desc": "We measure on site and design the layout and drawings." },
  "s3": { "title": "CNC machining", "desc": "We machine precisely to the approved drawings." },
  "s4": { "title": "Fabrication & welding", "desc": "We weld PVC/PP into the finished structures." },
  "s5": { "title": "Installation", "desc": "We install on site and connect the exhaust ducting." },
  "s6": { "title": "Maintenance", "desc": "We provide regular inspection and fast service." }
},
"faq": {
  "eyebrow": "FAQ",
  "title": "Frequently asked questions",
  "q1": { "q": "How do I get a quote?", "a": "Send your requirements via the contact form or by phone; we review your site conditions and provide a tailored quote." },
  "q2": { "q": "How long does fabrication take?", "a": "It depends on scale and spec, but usually 2–6 weeks after the design is finalized." },
  "q3": { "q": "What materials do you use?", "a": "Mainly PVC and PP for their chemical resistance and durability, chosen to fit the application." },
  "q4": { "q": "Do you handle on-site installation?", "a": "Yes — from fabrication to on-site install and exhaust ducting, all in one." },
  "q5": { "q": "What about service and maintenance?", "a": "We provide regular inspections and fast after-sales support after installation." },
  "q6": { "q": "How do I start?", "a": "Fill out the form on the Contact page or call our main line." }
}
```

- [ ] **Step 4: Verify parity + JSON validity**

Run: `node -e "JSON.parse(require('fs').readFileSync('messages/ko.json','utf8'));JSON.parse(require('fs').readFileSync('messages/en.json','utf8'));console.log('JSON OK')"`
Run: `pnpm run check:i18n`
Expected: `JSON OK` then `i18n parity OK`.

- [ ] **Step 5: Commit**

```bash
git add messages/ko.json messages/en.json
git commit -m "i18n: home services/process/faq + common.toTop (ko + en)"
```
(+ Co-Authored-By trailer)

---

### Task 5: TopButton + mount in layout

**Files:**
- Create: `components/layout/TopButton.tsx`
- Modify: `app/[locale]/layout.tsx`

- [ ] **Step 1: Create the component**

`components/layout/TopButton.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { getLenis } from "./LenisProvider";

export function TopButton() {
  const t = useTranslations("common");
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toTop = () => {
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(0, { duration: 1 });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      onClick={toTop}
      aria-label={t("toTop")}
      className={cn(
        "fixed bottom-6 right-6 z-40 flex size-11 items-center justify-center rounded-full border border-hairline bg-surface-elevated text-ink shadow-md transition-all hover:border-primary hover:text-primary cursor-pointer",
        show
          ? "opacity-100 translate-y-0"
          : "pointer-events-none translate-y-2 opacity-0"
      )}
    >
      <ChevronUp aria-hidden className="size-5" />
    </button>
  );
}
```

- [ ] **Step 2: Mount it in the layout**

In `app/[locale]/layout.tsx`, import near the other layout imports:
```tsx
import { TopButton } from "@/components/layout/TopButton";
```
And add `<TopButton />` after `<Footer />`, still inside `<LenisProvider>`:
```tsx
          <LenisProvider>
            <Header />
            <main className="pt-16">{children}</main>
            <Footer />
            <TopButton />
          </LenisProvider>
```

- [ ] **Step 3: Verify**

Run: `pnpm exec tsc --noEmit && pnpm run lint`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add components/layout/TopButton.tsx app/[locale]/layout.tsx
git commit -m "feat: site-wide scroll-to-top button"
```
(+ Co-Authored-By trailer)

---

### Task 6: ServiceGrid section + home insert

**Files:**
- Create: `components/sections/ServiceGrid.tsx`
- Modify: `app/[locale]/page.tsx`

- [ ] **Step 1: Create the component**

`components/sections/ServiceGrid.tsx`:
```tsx
"use client";

import { useTranslations } from "next-intl";
import {
  PencilRuler,
  Cpu,
  Flame,
  Box,
  Wind,
  HardHat,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";

const SERVICES: { key: string; Icon: LucideIcon }[] = [
  { key: "design", Icon: PencilRuler },
  { key: "cnc", Icon: Cpu },
  { key: "welding", Icon: Flame },
  { key: "fabrication", Icon: Box },
  { key: "scrubber", Icon: Wind },
  { key: "field", Icon: HardHat },
];

export function ServiceGrid() {
  const t = useTranslations("home.services");
  return (
    <section className="bg-canvas py-section">
      <div className="max-w-reading mx-auto px-6">
        <p className="text-caption-md uppercase tracking-wider text-mute mb-3">
          {t("eyebrow")}
        </p>
        <h2 className="text-heading-xl text-ink mb-10">{t("title")}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map(({ key, Icon }) => (
            <Card
              key={key}
              className="group transition-colors hover:border-primary"
            >
              <span className="mb-4 inline-flex size-10 items-center justify-center rounded-md bg-surface-elevated text-mute transition-colors group-hover:text-primary">
                <Icon aria-hidden className="size-5" />
              </span>
              <h3 className="text-heading-md text-ink mb-1">
                {t(`items.${key}.title`)}
              </h3>
              <p className="text-body-sm text-body leading-relaxed">
                {t(`items.${key}.desc`)}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Insert into the home page**

In `app/[locale]/page.tsx`, add the import:
```tsx
import { ServiceGrid } from "@/components/sections/ServiceGrid";
```
And render it after `<FeatureCardRow .../>`:
```tsx
      <FeatureCardRow items={features} />
      <ServiceGrid />
```

- [ ] **Step 3: Verify**

Run: `pnpm exec tsc --noEmit && pnpm run lint`
Expected: clean. (If `max-w-reading` is not a valid utility, use `max-w-narrow` — verify which container utilities exist in `app/globals.css` `--container-*`: `page`, `reading`, `narrow`, `form`; `max-w-reading` is valid.)

- [ ] **Step 4: Commit**

```bash
git add components/sections/ServiceGrid.tsx app/[locale]/page.tsx
git commit -m "feat: home service/capability card grid"
```
(+ Co-Authored-By trailer)

---

### Task 7: ProcessSection + home insert

**Files:**
- Create: `components/sections/ProcessSection.tsx`
- Modify: `app/[locale]/page.tsx`

- [ ] **Step 1: Create the component**

`components/sections/ProcessSection.tsx`:
```tsx
"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";

const STEPS = ["s1", "s2", "s3", "s4", "s5", "s6"];

export function ProcessSection() {
  const t = useTranslations("home.process");
  return (
    <section className="bg-surface-soft py-section">
      <div className="max-w-reading mx-auto px-6">
        <p className="text-caption-md uppercase tracking-wider text-mute mb-3">
          {t("eyebrow")}
        </p>
        <h2 className="text-heading-xl text-ink mb-10">{t("title")}</h2>
        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s} className="flex gap-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary text-body-strong">
                {i + 1}
              </span>
              <div>
                <h3 className="text-heading-md text-ink mb-1">
                  {t(`${s}.title`)}
                </h3>
                <p className="text-body-sm text-body leading-relaxed">
                  {t(`${s}.desc`)}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-10">
          <Button href="/contact" variant="primary" size="md">
            {t("cta")}
          </Button>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Insert into the home page**

In `app/[locale]/page.tsx`, add the import:
```tsx
import { ProcessSection } from "@/components/sections/ProcessSection";
```
And render it after `<ServiceGrid />`:
```tsx
      <ServiceGrid />
      <ProcessSection />
```

- [ ] **Step 3: Verify**

Run: `pnpm exec tsc --noEmit && pnpm run lint`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add components/sections/ProcessSection.tsx app/[locale]/page.tsx
git commit -m "feat: home build-process timeline section"
```
(+ Co-Authored-By trailer)

---

### Task 8: FaqSection + home insert

**Files:**
- Create: `components/sections/FaqSection.tsx`
- Modify: `app/[locale]/page.tsx`

- [ ] **Step 1: Create the component**

`components/sections/FaqSection.tsx`:
```tsx
"use client";

import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const QUESTIONS = ["q1", "q2", "q3", "q4", "q5", "q6"];

export function FaqSection() {
  const t = useTranslations("home.faq");
  return (
    <section className="bg-canvas py-section">
      <div className="max-w-narrow mx-auto px-6">
        <p className="text-caption-md uppercase tracking-wider text-mute mb-3">
          {t("eyebrow")}
        </p>
        <h2 className="text-heading-xl text-ink mb-8">{t("title")}</h2>
        <Accordion type="single" collapsible className="border-t border-hairline">
          {QUESTIONS.map((q) => (
            <AccordionItem key={q} value={q}>
              <AccordionTrigger>{t(`${q}.q`)}</AccordionTrigger>
              <AccordionContent>{t(`${q}.a`)}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Insert into the home page (after ProductShowcase)**

In `app/[locale]/page.tsx`, add the import:
```tsx
import { FaqSection } from "@/components/sections/FaqSection";
```
And render it between `<ProductShowcase .../>` and `<CtaStrip .../>`:
```tsx
      <ProductShowcase
        title={home("products.title")}
        products={products.slice(0, 6)}
      />
      <FaqSection />
      <CtaStrip
```

- [ ] **Step 3: Verify**

Run: `pnpm exec tsc --noEmit && pnpm run lint`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add components/sections/FaqSection.tsx app/[locale]/page.tsx
git commit -m "feat: home FAQ accordion section"
```
(+ Co-Authored-By trailer)

---

### Task 9: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Static gates**

Run: `pnpm exec tsc --noEmit && pnpm run lint && pnpm run check:i18n && pnpm run test:unit`
Expected: tsc clean; lint clean; `i18n parity OK`; `All unit tests passed.` (existing suites unaffected).

- [ ] **Step 2: Production build (clean machine / no dev server)**

Per AGENTS.md (OOM): ensure no dev server running first.
Run: `pnpm build`
Expected: success; home compiles with the new sections; no errors. (If a dev server is running and the machine is OOM-prone, defer to Vercel's build instead and note it.)

- [ ] **Step 3: Browser pass (browse skill, dev server)**

On `http://localhost:3000/ko`:
- Home renders order: Hero → Feature → ServiceGrid → Process → Products → FAQ → CTA.
- Service cards: 6 cards, icon + title + desc; hover lifts border/icon to red.
- Process: 6 numbered steps; "견적 문의" button → `/contact`.
- FAQ: clicking a question expands its answer with a smooth height animation and rotates the chevron; opening another closes the first (type=single).
- TOP button: hidden at top, appears after scrolling > 400px, returns to top smoothly.
- `http://localhost:3000/en` shows the English copy; no console errors.

- [ ] **Step 4: Final commit (only if verification fixups were needed)**

```bash
git add -A
git commit -m "chore: home sections verification fixups"
```
(+ Co-Authored-By trailer)

- [ ] **Step 5: Hand back**

Report DONE / DONE_WITH_CONCERNS, summarize, and ask whether to push to `main` (Vercel auto-deploys). Do not push without explicit user confirmation.

---

## Self-Review

**1. Spec coverage:**
- TOP button (site-wide, Lenis scroll, appears after scroll, reduced-motion fallback) → Tasks 1 (Lenis expose), 5. Service card grid → Tasks 2 (Card), 6. Build-process timeline (replaces pricing, ends in 견적 CTA) → Task 7. FAQ accordion on home → Tasks 1 (keyframes), 3 (Accordion), 8. shadcn-shaped themed primitives, no CLI, no dark → Tasks 2, 3. @radix-ui/react-accordion dep → Task 1. Bilingual content drafted, parity-checked → Task 4. Home integration order (Hero→Feature→Service→Process→Products→FAQ→CTA) → Tasks 6/7/8. Semantics (`<section>`, single `<h2>`, `<ol>` for steps, icons aria-hidden, accordion ARIA via Radix, TopButton aria-label) → Tasks 5/6/7/8. Lenis exposure (module accessor, no window global) → Task 1. Out-of-scope items (rail, PDF, real prices, dark, /faq route) correctly excluded. All spec sections covered.

**2. Placeholder scan:** No TBD/TODO. Every code step has complete code; commands have expected output. Content is fully written in Task 4 (not "fill in").

**3. Type consistency:** `getLenis()` defined in Task 1, consumed in Task 5. `Card` (Task 2) consumed in Task 6. `Accordion`/`AccordionItem`/`AccordionTrigger`/`AccordionContent` defined in Task 3, consumed in Task 8. i18n keys defined in Task 4 (`home.services.items.<key>.title/desc`, `home.process.s1..s6.title/desc` + `cta`/`eyebrow`/`title`, `home.faq.q1..q6.q/a`, `common.toTop`) exactly match the keys read in Tasks 5/6/7/8 (`t("toTop")`, `t("items.${key}.title")`, `t("${s}.title")`, `t("${q}.q")`). `SERVICES` keys (design/cnc/welding/fabrication/scrubber/field) match the i18n `items.*` keys. `STEPS` (s1..s6) and `QUESTIONS` (q1..q6) match. Button API (`href`/`variant`/`size`) matches existing `components/ui/Button.tsx`. Consistent.
