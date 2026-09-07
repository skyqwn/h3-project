"use client";

import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { gsap, useGSAP } from "@/lib/gsap";
import { EngineeringVisual } from "@/components/three/EngineeringVisual";

const SOLUTION_LINKS = [
  { key: "equipment", href: "/products" },
  { key: "automation", href: "/contact" },
] as const;

export function HomeSolutionReveal() {
  const t = useTranslations("home.solutionReveal");
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const media = root.querySelector<HTMLElement>("[data-solution-media]");
      const copyItems = root.querySelectorAll<HTMLElement>("[data-solution-copy]");
      const actions = root.querySelectorAll<HTMLElement>("[data-solution-action]");
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduced || window.matchMedia("(max-width: 767px)").matches) {
        gsap.set([copyItems, actions], { clearProps: "all" });
        gsap.set(media, { left: "50%", top: "14%", width: "48%", height: "72%", borderRadius: 16 });
        return;
      }

      gsap.set(copyItems, { opacity: 0, y: 34 });
      gsap.set(actions, { opacity: 0, y: 56 });
      gsap.set(media, {
        left: "0%",
        top: "0%",
        width: "100%",
        height: "100%",
        borderRadius: 0,
      });

      gsap
        .timeline({
          scrollTrigger: {
            trigger: root,
            start: "top bottom",
            end: "top top",
            scrub: 1,
          },
        })
        .to(media, {
          left: "50%",
          top: "14%",
          width: "48%",
          height: "72%",
          borderRadius: 16,
          ease: "none",
          duration: 1,
        })
        .to(
          copyItems,
          {
            opacity: 1,
            y: 0,
            duration: 0.35,
            stagger: 0.06,
            ease: "power3.out",
          },
          0.45
        )
        .to(actions, { opacity: 1, y: 0, duration: 0.3, stagger: 0.05 }, 0.7);


    },
    { scope: rootRef }
  );

  return (
    <>
      <section className="isolate bg-transparent py-section md:hidden">
        <div className="w-full px-6 lg:px-[120px]">
          <span className="mb-7 inline-flex h-11 items-center rounded-sm border border-ink px-4 text-body-sm-strong text-ink">
            {t("eyebrow")}
          </span>
          <h2 className="text-ink">
            <span className="block text-[32px] font-semibold leading-[1.18]">
              {t("titlePrefix")}
            </span>
            <span className="mt-2 block text-[42px] font-bold leading-[1.12]">
              {t("titleBrand")}
            </span>
            <span className="block text-[34px] font-bold leading-[1.16]">
              {t("titleAction")}
            </span>
          </h2>
          <p className="mt-6 text-body-md font-semibold leading-relaxed text-body">
            {t("body")}
          </p>

          <div className="relative mt-10 overflow-hidden rounded-md bg-surface-card">
            <div className="relative aspect-[5/6] sm:aspect-[4/3]">
              <EngineeringVisual />
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {SOLUTION_LINKS.map(({ key, href }) => (
              <Link
                key={key}
                href={href}
                className="group flex min-h-16 items-center justify-between rounded-sm border border-hairline bg-surface-card px-5 text-ink transition-colors duration-200 hover:bg-secondary-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-outer"
              >
                <span className="text-heading-md font-bold">
                  {t(`links.${key}`)}
                </span>
                <ArrowRight
                  aria-hidden
                  className="size-6 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section ref={rootRef} id="engineering" className="relative isolate hidden bg-transparent md:block md:h-[180svh]">
      <div className="md:sticky md:top-0 md:h-svh md:overflow-hidden">
        <div className="relative min-h-svh overflow-hidden bg-transparent md:h-full">
          <div className="pointer-events-none relative z-10 grid min-h-svh w-full items-center gap-10 px-6 py-section md:grid-cols-[0.42fr_0.58fr] md:py-0 lg:px-[120px]">
            <div className="max-w-[620px] md:pr-10">
              <span
                data-solution-copy
                className="mb-8 inline-flex h-12 items-center rounded-sm border border-ink px-5 text-body-sm-strong text-ink"
              >
                {t("eyebrow")}
              </span>
              <h2 data-solution-copy className="text-ink">
                <span className="block text-[40px] font-semibold leading-[1.18] sm:text-[46px] lg:text-[52px]">
                  {t("titlePrefix")}
                </span>
                <span className="mt-3 block text-[46px] font-bold leading-[1.18] sm:text-[54px] lg:text-[58px] xl:text-[62px]">
                  {t("titleBrand")}
                </span>
                <span className="block whitespace-nowrap text-[40px] font-bold leading-[1.18] sm:text-[48px] lg:text-[52px] xl:text-[56px]">
                  {t("titleAction")}
                </span>
              </h2>
              <p
                data-solution-copy
                className="mt-8 max-w-md break-keep text-[18px] font-medium leading-relaxed text-body"
              >
                {t("body")}
              </p>
            </div>

            <div className="relative z-10 min-h-[460px] md:min-h-0" aria-hidden />
          </div>

          <div
            data-solution-media
            className="relative mx-6 mb-section aspect-[4/3] overflow-hidden rounded-md border border-[#dce6ed] bg-surface-card md:absolute md:inset-0 md:m-0 md:aspect-auto md:rounded-none"
          >
            <div className="absolute inset-x-0 bottom-20 top-0">
              <EngineeringVisual />
            </div>
            <div className="absolute inset-x-0 bottom-0 grid h-20 grid-cols-2 border-t border-hairline-soft bg-white">
              {SOLUTION_LINKS.map(({ key, href }) => (
                <Link
                  key={key}
                  href={href}
                  data-solution-action
                  className="group flex items-center justify-between gap-3 border-r border-hairline-soft px-5 text-ink transition-colors duration-200 last:border-r-0 hover:bg-surface-card focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-focus-outer lg:px-7"
                >
                  <span className="text-body-sm font-semibold lg:text-body-md">
                    {t(`links.${key}`)}
                  </span>
                  <ArrowRight
                    aria-hidden
                    className="size-5 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      </section>
    </>
  );
}
