"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { useGSAP, gsap } from "@/lib/gsap";
import { Button } from "@/components/ui/Button";

export function Hero() {
  const t = useTranslations("home.hero");
  const rootRef = useRef<HTMLElement | null>(null);

  // Headline is composed of three translated parts (see about.hero's old
  // headlineMain/Accent/Suffix pattern) so the accent word can be colored
  // regardless of locale — Korean attaches the suffix directly to the accent
  // word with no space (e.g. "자동화까지"), so a single string + word-split
  // can't isolate it the way English can.
  const headlineMain = t("headlineMain");
  const headlineAccent = t("headlineAccent");
  const headlineSuffix = t("headlineSuffix");
  const fullHeadline = `${headlineMain}${headlineAccent}${headlineSuffix}`;

  const mainWords = headlineMain.trim().split(" ").filter(Boolean);
  const words = [...mainWords, `${headlineAccent}${headlineSuffix}`];
  const accentIndex = words.length - 1;

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const reduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const eyebrow = root.querySelector<HTMLElement>("[data-hero-eyebrow]");
      const wordEls = root.querySelectorAll<HTMLElement>("[data-hero-word]");
      const body = root.querySelector<HTMLElement>("[data-hero-body]");
      const cta = root.querySelector<HTMLElement>("[data-hero-cta]");

      if (reduced) {
        gsap.set([eyebrow, ...wordEls, body, cta], {
          opacity: 1,
          yPercent: 0,
          y: 0,
        });
        return;
      }

      // Choreographed entrance: eyebrow leads, then headline words rise from
      // behind their mask.
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(
          eyebrow,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.5 },
        )
        .fromTo(
          wordEls,
          { yPercent: 110 },
          { yPercent: 0, duration: 0.9, stagger: 0.08 },
          "-=0.2",
        )
        .fromTo(
          body,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.55 },
          "-=0.35"
        )
        .fromTo(
          cta,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.6 },
          "-=0.3"
        );
    },
    { scope: rootRef }
  );

  return (
    <section
      ref={rootRef}
      className="relative h-[calc(100vh-5rem)] min-h-[620px] w-full overflow-hidden bg-transparent"
    >
      <div className="relative z-10 flex h-full flex-col justify-end px-6 py-12 text-ink md:py-16 lg:px-[120px]">
        <div className="w-full">
          <p
            data-hero-eyebrow
            className="mb-4 text-caption-md uppercase tracking-wider text-mute opacity-0"
          >
            {t("eyebrow")}
          </p>

          {/* Accessible full headline for SR/SEO; the animated copy is
              aria-hidden so screen readers don't read it word-by-word. */}
          <h2 className="mb-5 max-w-2xl text-display-xl">
            <span className="sr-only">{fullHeadline}</span>
            <span aria-hidden className="flex flex-wrap items-baseline gap-x-[0.28em]">
              {words.map((word, i) => (
                <span
                  key={i}
                  className="inline-block overflow-hidden align-bottom"
                >
                  <span
                    data-hero-word
                    className="inline-block will-change-transform"
                  >
                    {i === accentIndex ? (
                      <>
                        <span className="text-primary">{headlineAccent}</span>
                        <span>{headlineSuffix}</span>
                      </>
                    ) : (
                      word
                    )}
                  </span>
                </span>
              ))}
            </span>
          </h2>

          <p
            data-hero-body
            className="mb-6 max-w-2xl text-body-md text-body opacity-0 md:text-[18px] md:leading-8"
          >
            {t("body")}
          </p>

          <span data-hero-cta className="inline-block opacity-0">
            <Button
              href="/products"
              variant="primary"
              size="md"
              className="!bg-[#5f6f82] !text-white hover:!bg-[#4f5f73]"
              arrow
            >
              {t("cta")}
            </Button>
          </span>
        </div>
      </div>
    </section>
  );
}
