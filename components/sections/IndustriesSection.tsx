"use client";

import { useRef, Fragment } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useGSAP, gsap } from "@/lib/gsap";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { Section } from "@/components/layout/Section";

// AI-generated industry backgrounds (text-to-image, 1024x576). Swap for real
// H3 site/delivery photography later by replacing these files; no code change.
const INDUSTRIES = [
  { key: "semiconductor", image: "/industries/semiconductor.jpg" },
  { key: "chemistry", image: "/industries/chemistry.jpg" },
  { key: "battery", image: "/industries/battery.jpg" },
];

const SCRIM =
  "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.2) 100%)";

export function IndustriesSection() {
  const t = useTranslations("home.industries");
  const rootRef = useRef<HTMLDivElement>(null);

  const [first, ...rest] = INDUSTRIES;
  const total = INDUSTRIES.length;

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      // --- First panel: photo scales from a contained card to full-bleed ---
      const expandPanel = root.querySelector<HTMLElement>("[data-panel-expand]");
      if (expandPanel) {
        const card = expandPanel.querySelector<HTMLElement>("[data-expand]");
        const scrim = expandPanel.querySelector<HTMLElement>("[data-expand-scrim]");
        const label = expandPanel.querySelector<HTMLElement>("[data-expand-label]");
        if (reduced) {
          gsap.set(card, { scale: 1, borderRadius: 0 });
          gsap.set(scrim, { opacity: 1 });
          gsap.set(label, { opacity: 1, y: 0 });
        } else {
          gsap
            .timeline({
              scrollTrigger: {
                trigger: expandPanel,
                start: "top top",
                end: "+=60%",
                scrub: 1,
              },
            })
            .fromTo(
              card,
              { scale: 0.66, borderRadius: 24 },
              { scale: 1, borderRadius: 0, ease: "none", duration: 1 }
            )
            .fromTo(scrim, { opacity: 0 }, { opacity: 1, ease: "none", duration: 1 }, 0)
            .fromTo(
              label,
              { opacity: 0, y: 24 },
              { opacity: 1, y: 0, ease: "none", duration: 0.4 },
              0.6
            );
        }
      }

      // --- Covering panels: reveal their copy as they slide up over the stack ---
      if (reduced) return;
      root.querySelectorAll<HTMLElement>("[data-copy]").forEach((copy) => {
        gsap.fromTo(
          copy,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: { trigger: copy, start: "top 70%", once: true },
          }
        );
      });
    },
    { scope: rootRef }
  );

  if (!first) return null;

  return (
    <div ref={rootRef}>
      <Section tone="canvas">
        <SectionHeader index="04" eyebrow={t("eyebrow")} title={t("title")} />
      </Section>

      {/* Sticky stack: every panel pins at the top, so each later panel slides
          up and covers the previous one (which stays pinned underneath). The
          first panel additionally scales from a contained card to full-bleed. */}
      <div className="relative">
        <section
          data-panel-expand
          className="sticky top-0 flex h-[100svh] items-center justify-center overflow-hidden bg-canvas"
        >
          <div
            data-expand
            className="relative h-full w-full overflow-hidden will-change-transform"
            style={{ transform: "scale(0.66)", borderRadius: 24 }}
          >
            <Image
              src={first.image}
              alt={t(`items.${first.key}.alt`)}
              fill
              sizes="100vw"
              className="object-cover object-center"
            />
            <div
              data-expand-scrim
              className="absolute inset-0"
              style={{ background: SCRIM, opacity: 0 }}
              aria-hidden
            />
          </div>

          <div className="pointer-events-none absolute inset-0 flex flex-col justify-end pb-16">
            <div className="max-w-page mx-auto w-full px-6">
              <div data-expand-label className="max-w-xl" style={{ opacity: 0 }}>
                <span className="text-caption-md tabular-nums text-on-dark-mute">
                  {String(1).padStart(2, "0")} / {String(total).padStart(2, "0")}
                </span>
                <h3 className="text-display-xl text-on-dark mt-2 mb-3">
                  {t(`items.${first.key}.name`)}
                </h3>
                <p className="text-body-md text-on-dark-mute leading-relaxed">
                  {t(`items.${first.key}.desc`)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {rest.map(({ key, image }, i) => (
          <Fragment key={key}>
            {/* Hold spacer: the panel below stays solo (and the first panel
                finishes its expand) before this one slides up to cover it. */}
            <div aria-hidden className="h-[60svh]" />
            <section className="sticky top-0 h-[100svh] w-full overflow-hidden bg-surface-dark">
            <Image
              src={image}
              alt={t(`items.${key}.alt`)}
              fill
              sizes="100vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0" style={{ background: SCRIM }} aria-hidden />
            <div className="absolute inset-0 flex flex-col justify-end pb-16">
              <div className="max-w-page mx-auto w-full px-6">
                <div data-copy className="max-w-xl">
                  <span className="text-caption-md tabular-nums text-on-dark-mute">
                    {String(i + 2).padStart(2, "0")} / {String(total).padStart(2, "0")}
                  </span>
                  <h3 className="text-display-xl text-on-dark mt-2 mb-3">
                    {t(`items.${key}.name`)}
                  </h3>
                  <p className="text-body-md text-on-dark-mute leading-relaxed">
                    {t(`items.${key}.desc`)}
                  </p>
                </div>
              </div>
            </div>
            </section>
          </Fragment>
        ))}
        {/* Trailing room so the last panel stays pinned for its own beat
            before the stack releases to the next section. */}
        <div aria-hidden className="h-[60svh]" />
      </div>
    </div>
  );
}
