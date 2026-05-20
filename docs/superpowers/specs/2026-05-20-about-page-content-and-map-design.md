# About Page Content + Location Map — Design Spec

**Date:** 2026-05-20
**Status:** Approved (brainstorming) → ready for implementation plan
**Topic:** Flesh out the sparse About page with real intro copy and an
"오시는 길" location section using a keyless Google Maps embed.

## Goal

Replace the About page's single placeholder paragraph with real company
intro copy and add a location section (Google Maps iframe + address /
contact), on H3's light cream/red brand. No API key, no new dependency.

## Background / current state

- `app/[locale]/about/page.tsx`: server component, narrow column, renders
  `subtitle` + `DisplayHeading(title)` + one `about.body` placeholder
  paragraph wrapped in `ScrollReveal`.
- `messages` `about`: `title` ("회사 소개" / "About"), `subtitle`
  ("우리가 하는 일" / "What we do"), `body` (placeholder, says "replace
  with real copy").
- Footer i18n already holds the address/contact: `footer.address`
  ("인천광역시 서구 이든1로 15 (22667)" / English), plus 대표(홍승찬),
  phone (010-6777-6730), email (contact@h3.co.kr) — reuse these (DRY).
- Brand: light fixed theme, cream/white + `#e60023`, DESIGN.md tokens.
  i18n ko/en parity enforced.

## Decisions (locked during brainstorming)

1. Map = **keyless Google Maps embed** built from the address
   (`https://www.google.com/maps?q=<address>&output=embed`). No API key,
   no user action, no new dependency.
2. Content added: **real intro copy** (drafted here, user proofreads) +
   the location section. NOT adding strengths/value cards or an info
   table (YAGNI).
3. Reuse footer i18n for address/contact rather than duplicating values.

## New / changed files

- Create `components/sections/LocationSection.tsx` — server component:
  heading + Google Maps iframe + address/contact + "view larger" link.
- Modify `app/[locale]/about/page.tsx` — expand the intro (lead + body
  paragraphs) and render `<LocationSection />`.
- Modify `messages/ko.json` + `messages/en.json` — expand `about` with
  `lead`, `body` (real copy), and `about.location` (`title`,
  `viewLarger`).

## Component / page design

### Intro (about page)
- Keep `subtitle` + `DisplayHeading(title)`.
- Replace the single `about.body` with:
  - `about.lead` — one strong lead sentence.
  - `about.body` — 1–2 supporting paragraphs (rendered as separate `<p>`;
    if multiple paragraphs are needed, split on `\n\n` or use distinct
    keys `body1`/`body2`). Use distinct keys `body1`, `body2` to stay
    typed and parity-checkable.
- Drafted copy (ko):
  - lead: "H3는 PVC·PP 소재로 화학공정용 흄후드·정련 부스·스크러버와 배기
    배관을 설계부터 제작·시공·유지보수까지 책임지는 전문 제작 업체입니다."
  - body1: "현장 실측을 바탕으로 설계하고, CNC 정밀가공과 전문 열풍
    용접으로 내화학성과 내구성을 갖춘 맞춤 설비를 제작합니다."
  - body2: "작은 부품부터 현장 일괄 시공까지, 고객의 공정과 현장 조건에
    맞춰 완성도 높은 결과물을 제공합니다."
- Drafted copy (en):
  - lead: "H3 is a specialist fabricator of PVC/PP fume hoods, refining
    booths, scrubbers, and exhaust ducting for chemical processes —
    from design through fabrication, installation, and maintenance."
  - body1: "We design from on-site surveys and build chemical-resistant,
    durable custom equipment with precision CNC machining and expert
    hot-air welding."
  - body2: "From small components to full turnkey installation, we deliver
    to each client's process and site conditions."

### LocationSection (`components/sections/LocationSection.tsx`)
- `<section>` with `<h2>` from `about.location.title` ("오시는 길" /
  "Visit us").
- Responsive map: a wrapper with a fixed aspect (e.g.
  `aspect-[16/9]` or a min-height) containing
  `<iframe src="https://www.google.com/maps?q=인천광역시 서구 이든1로 15&z=16&output=embed" loading="lazy" title=... className="w-full h-full border-0">`,
  inside a `rounded-md border border-hairline overflow-hidden` box.
  The `q` value is URL-encoded.
- Address / contact block beside or below the map: address
  (`footer.address`), 대표 / phone / email reused from footer keys, plus
  an external link "지도에서 크게 보기" (`about.location.viewLarger`) to
  `https://www.google.com/maps?q=<encoded address>` (`target="_blank"
  rel="noopener noreferrer"`).
- Server component (a plain iframe needs no client JS). i18n via
  `getTranslations`.

## i18n

New/changed keys (both locales, identical tree):
- `about.lead`, `about.body1`, `about.body2` (replace old `about.body`).
- `about.location.title`, `about.location.viewLarger`.
- Address/contact: reuse existing `footer.*` keys (no new keys).

`pnpm run check:i18n` must pass. The old `about.body` key is removed in
both locales (no orphan).

## Accessibility / semantics

- About uses `<h1>`? No — page heading is `DisplayHeading(title)` (the
  site h1 is the header logo per the SEO pattern); About sections use
  `<h2>`. LocationSection is a `<section>` with an `<h2>`.
- iframe has a descriptive `title` attribute. External map link uses
  `rel="noopener noreferrer"`.

## Testing / verification

- `pnpm exec tsc --noEmit`, `pnpm run lint`, `pnpm run check:i18n` green.
- Browser pass: `/ko/about` shows expanded intro + map (loads, centered
  on the address) + address/contact + working "view larger" link;
  `/en/about` shows English; no console errors; mobile layout stacks.

## Out of scope (YAGNI)

Kakao map / API keys, strengths/value cards, company info table, history
/ stats, any new dependency, changes to other pages.
