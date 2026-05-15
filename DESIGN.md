---
version: alpha
name: h3-design-system
description: |
  A photography-first marketing system organized around the brand red (#e60023) CTA, full-bleed media-driven hero sections, and a warm-cream/white chrome that gets out of the imagery's way. Adapted from the Pinterest design language as the brand source of truth. Structure references SpaceX-style scroll-driven full-bleed storytelling for the homepage hero band, but every chrome decision — typography, color, radius, components — follows the tokens below.

colors:
  primary: "#e60023"
  on-primary: "#ffffff"
  primary-pressed: "#cc001f"
  ink: "#000000"
  ink-soft: "#211922"
  body: "#33332e"
  charcoal: "#262622"
  mute: "#62625b"
  ash: "#91918c"
  stone: "#c8c8c1"
  hairline: "#dadad3"
  hairline-soft: "#e5e5e0"
  on-secondary: "#000000"
  secondary-bg: "#e5e5e0"
  secondary-pressed: "#c8c8c1"
  canvas: "#ffffff"
  surface-soft: "#fbfbf9"
  surface-card: "#f6f6f3"
  surface-elevated: "#ffffff"
  on-dark: "#ffffff"
  on-dark-mute: "rgba(255,255,255,0.7)"
  surface-dark: "#262622"
  focus-outer: "#435ee5"
  focus-inner: "#ffffff"
  accent-pressed-blue: "#617bff"
  accent-purple: "#7e238b"
  accent-purple-deep: "#6845ab"
  success-deep: "#103c25"
  success-pale: "#c7f0da"
  error: "#9e0a0a"
  error-deep: "#cc001f"

typography:
  display-xl:
    fontFamily: "Pin Sans, Inter, -apple-system, system-ui, sans-serif"
    fontSize: 70px
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: -1.2px
  display-lg:
    fontFamily: "Pin Sans, Inter, -apple-system, system-ui, sans-serif"
    fontSize: 44px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -0.8px
  heading-xl:
    fontFamily: "Pin Sans, Inter, -apple-system, system-ui, sans-serif"
    fontSize: 28px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -1.2px
  heading-lg:
    fontFamily: "Pin Sans, Inter, -apple-system, system-ui, sans-serif"
    fontSize: 22px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: 0
  heading-md:
    fontFamily: "Pin Sans, Inter, -apple-system, system-ui, sans-serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 0
  body-md:
    fontFamily: "Pin Sans, Inter, -apple-system, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  body-strong:
    fontFamily: "Pin Sans, Inter, -apple-system, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
  body-sm:
    fontFamily: "Pin Sans, Inter, -apple-system, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  body-sm-strong:
    fontFamily: "Pin Sans, Inter, -apple-system, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: 0
  caption-md:
    fontFamily: "Pin Sans, Inter, -apple-system, system-ui, sans-serif"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: 0
  caption-sm:
    fontFamily: "Pin Sans, Inter, -apple-system, system-ui, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  link-md:
    fontFamily: "Pin Sans, Inter, -apple-system, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
  button-md:
    fontFamily: "Pin Sans, Inter, -apple-system, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: 0
  button-sm:
    fontFamily: "Pin Sans, Inter, -apple-system, system-ui, sans-serif"
    fontSize: 12px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: 0

rounded:
  none: 0px
  sm: 8px
  md: 16px
  lg: 32px
  full: 9999px

spacing:
  xxs: 4px
  xs: 6px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  xxl: 32px
  section: 64px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    padding: 6px 14px
    height: 40px
  button-primary-pressed:
    backgroundColor: "{colors.primary-pressed}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
  button-secondary:
    backgroundColor: "{colors.secondary-bg}"
    textColor: "{colors.on-secondary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    padding: 6px 14px
    height: 40px
  button-secondary-pressed:
    backgroundColor: "{colors.secondary-pressed}"
    textColor: "{colors.on-secondary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
  button-tertiary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
  button-icon-circular:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    size: 40px
  button-pill-on-image:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.button-md}"
    rounded: "{rounded.full}"
    padding: 8px 14px
  search-bar:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.full}"
    padding: 11px 15px
    height: 48px
  text-input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 11px 15px
    height: 44px
  pin-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: 0px
  pin-card-large:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 0px
  pin-overlay-pill:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.button-sm}"
    rounded: "{rounded.full}"
    padding: 6px 12px
  filter-chip:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.button-md}"
    rounded: "{rounded.full}"
    padding: 8px 16px
  filter-chip-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-dark}"
    typography: "{typography.button-md}"
    rounded: "{rounded.full}"
  category-tile:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.md}"
    padding: 16px
  feature-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.heading-xl}"
    rounded: "{rounded.md}"
    padding: 32px
  feature-card-soft:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.heading-xl}"
    rounded: "{rounded.md}"
    padding: 32px
  modal-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 32px
  hero-cta-strip:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark}"
    typography: "{typography.heading-xl}"
    rounded: "{rounded.none}"
    padding: 48px 32px
  primary-nav:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.none}"
    height: 64px
  footer-section:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.mute}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.none}"
    padding: 32px 24px
  link-inline:
    textColor: "{colors.ink-soft}"
    typography: "{typography.link-md}"
---

## Overview

This is the design system for the H3 company-intro site. The brand identity is anchored on a single saturated red (`{colors.primary}` — `#e60023`) used exclusively for primary CTAs and the brand wordmark, on a warm-cream / true-white chrome that recedes behind photography. Display tier is Pin Sans (Inter as the open-source substitute) with tight negative tracking at the largest sizes. Radius vocabulary is three values only — 16px, 32px, and pill. There is no dark mode and no shadow elevation beyond the modal layer.

Structurally, the homepage follows a SpaceX-inspired pattern of full-bleed scroll-driven sections, but the visual chrome of every section, button, card, and form follows the tokens above. The hero band is a full-viewport photograph or autoplaying video; everything beneath returns to the warm-cream magazine treatment with the red CTA always anchored in the upper right of the sticky nav.

The site is bilingual (Korean default at the root, English at `/en`) and the design tokens are identical across locales.

## Color Roles

The palette divides into four roles. **Brand** — `{colors.primary}` is reserved for the primary CTA and the wordmark; never decorative. **Surface** — `{colors.canvas}` true white is the page base, `{colors.surface-soft}` is the page-body wash, `{colors.surface-card}` carries pin tiles and quiet cards. **Text** — `{colors.ink}` for headlines and primary nav, `{colors.body}` for paragraphs, `{colors.mute}` for footers and metadata, `{colors.ash}` for placeholders and disabled. **Semantic** — `{colors.focus-outer}` 2px outer outline for accessibility, `{colors.error}` for validation messages.

Build hierarchy from weight and size, never from color tinting. The body color does not shift between sections.

## Typography Roles

`{typography.display-xl}` for the hero headline only. `{typography.heading-xl}` for section openers. `{typography.heading-lg}` and `{typography.heading-md}` for sub-sections and card titles. `{typography.body-md}` is the default body; reach for `{typography.body-strong}` for emphasis. `{typography.button-md}` for primary/secondary buttons; `{typography.button-sm}` for compact pills.

Apply `-1.2px` letter-spacing on `{typography.display-xl}` and `{typography.heading-xl}`. The negative tracking is part of the brand voice.

## Hero Band — Photography Treatment

The homepage hero is a full-viewport (100vh) photograph or autoplaying video. Type and CTA overlay the imagery at high opacity with NO scrim or gradient overlay — the image is graded darker at source so the type lands cleanly. The hero overlay carries:

- Eyebrow microtext in `{typography.caption-md}` (uppercase, on-dark variant if photography is dark)
- Headline in `{typography.display-xl}` (allowed to render in `{colors.on-dark}` over dark photography)
- One `{component.button-primary}` red CTA OR one `{component.button-pill-on-image}` white pill, depending on photography contrast

Below the hero band, the page returns to standard light chrome (`{colors.canvas}`).

## Animation & Motion

- All scroll-driven animation goes through GSAP's `ScrollTrigger` synchronized with a Lenis smooth-scroll loop.
- Animation tone is friendly fade-up + gentle parallax, not cinematic-cold. No long pin sequences; no aggressive scrub-driven choreography.
- Hero photography may use a subtle 1.05× zoom over 8s for ambient motion.
- Section entry: 24px translate-up + opacity fade over 600ms with `power2.out` easing.
- `prefers-reduced-motion: reduce` disables Lenis and disables all GSAP transitions (elements appear in final state).

## Iteration Rules

1. Pull a component's YAML entry and verify every token reference resolves before editing.
2. Reference tokens directly (`{colors.primary}`, `{rounded.md}`, `{component.button-primary}`) — do not paraphrase.
3. Add new states as separate component entries (`-pressed`, `-disabled`, `-focused`).
4. Keep `{colors.primary}` scarce — at most one Pinterest-red CTA per fold (nav, hero, and feature card combined).
5. Before adding a new component or token, ask whether the existing 16px-radius / cream-surface / red-CTA vocabulary covers it.
6. No dark mode token layer — the brand is light-fixed.
