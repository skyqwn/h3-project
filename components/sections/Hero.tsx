"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { useGSAP, gsap } from "@/lib/gsap";
import { Button } from "@/components/ui/Button";

export function Hero() {
  const t = useTranslations("home.hero");
  const imgRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      if (!imgRef.current) return;
      const reduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return;
      gsap.to(imgRef.current, {
        scale: 1.05,
        duration: 8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    },
    { scope: imgRef }
  );

  return (
    <section className="relative h-[calc(100vh-4rem)] w-full overflow-hidden bg-surface-dark">
      {/* Photo/video plate. When a real asset lands at /hero-placeholder.jpg
          it shows; until then the dark gradient fallback below carries the
          full-bleed look. */}
      <div
        ref={imgRef}
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(135deg, #0a0a0a 0%, #262622 60%, #3a3a3f 100%), url(/hero-placeholder.jpg)",
        }}
        aria-hidden
      />

      <div className="absolute inset-0 flex flex-col justify-end p-16 text-on-dark">
        <div className="max-w-page mx-auto w-full">
          <p className="text-caption-md uppercase tracking-wider text-on-dark-mute mb-3">
            {t("eyebrow")}
          </p>
          <h2 className="text-display-xl max-w-4xl mb-6">{t("headline")}</h2>
          <Button href="/products" variant="primary" size="md">
            {t("cta")}
          </Button>
        </div>
      </div>
    </section>
  );
}
