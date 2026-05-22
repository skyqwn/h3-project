"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { useGSAP, gsap } from "@/lib/gsap";
import { Button } from "@/components/ui/Button";

export function Hero() {
  const t = useTranslations("home.hero");
  const rootRef = useRef<HTMLElement | null>(null);
  const imgRef = useRef<HTMLDivElement | null>(null);

  const headline = t("headline");
  const words = headline.split(" ");

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const reduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const wordEls = root.querySelectorAll<HTMLElement>("[data-hero-word]");
      const eyebrow = root.querySelector<HTMLElement>("[data-hero-eyebrow]");
      const cta = root.querySelector<HTMLElement>("[data-hero-cta]");

      if (reduced) {
        gsap.set([eyebrow, ...wordEls, cta], { opacity: 1, yPercent: 0 });
        return;
      }

      // Ambient background zoom (subtle, infinite).
      if (imgRef.current) {
        gsap.to(imgRef.current, {
          scale: 1.05,
          duration: 8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }

      // Choreographed entrance: eyebrow → headline words rise from behind
      // their mask → CTA.
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(
        eyebrow,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.6 }
      )
        .fromTo(
          wordEls,
          { yPercent: 110 },
          { yPercent: 0, duration: 0.9, stagger: 0.08 },
          "-=0.2"
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
      className="relative h-[calc(100vh-4rem)] w-full overflow-hidden bg-surface-dark"
    >
      {/* Hero photo with a bottom-heavy translucent scrim so the image
          shows through while the bottom-left headline stays legible.
          (The scrim MUST use rgba/alpha — a solid gradient would hide
          the photo entirely.) */}
      <div
        ref={imgRef}
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.45) 35%, rgba(0,0,0,0.15) 70%, rgba(0,0,0,0.05) 100%), url(/hero.webp)",
        }}
        aria-hidden
      />

      <div className="absolute inset-0 flex flex-col justify-end p-16 text-on-dark">
        <div className="max-w-page mx-auto w-full">
          <p
            data-hero-eyebrow
            className="text-caption-md uppercase tracking-wider text-on-dark-mute mb-3 opacity-0"
          >
            {t("eyebrow")}
          </p>

          {/* Accessible full headline for SR/SEO; the animated copy is
              aria-hidden so screen readers don't read it word-by-word. */}
          <h2 className="text-display-xl max-w-4xl mb-6">
            <span className="sr-only">{headline}</span>
            <span aria-hidden className="block">
              {words.map((word, i) => (
                <span
                  key={i}
                  className="inline-block overflow-hidden align-bottom"
                >
                  <span data-hero-word className="inline-block will-change-transform">
                    {word}
                  </span>
                  {i < words.length - 1 ? " " : ""}
                </span>
              ))}
            </span>
          </h2>

          <span data-hero-cta className="inline-block opacity-0">
            <Button href="/products" variant="primary" size="md" arrow>
              {t("cta")}
            </Button>
          </span>
        </div>
      </div>
    </section>
  );
}
