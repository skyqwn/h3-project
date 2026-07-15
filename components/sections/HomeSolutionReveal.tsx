"use client";

import Image from "next/image";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { gsap, useGSAP } from "@/lib/gsap";

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
        gsap.set([media, copyItems, actions], { clearProps: "all" });
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
          left: "43%",
          top: "14%",
          width: "57%",
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
        );

      gsap
        .timeline({
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
          },
        })
        .to(
          actions,
          {
            opacity: 1,
            y: 0,
            duration: 0.28,
            ease: "power3.out",
          },
          0.28
        );
    },
    { scope: rootRef }
  );

  return (
    <>
      <section className="bg-canvas py-section md:hidden">
        <div className="mx-auto max-w-page px-6">
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
            <div className="relative aspect-[4/3]">
              <Image
                src="/feature-fabrication.jpg"
                alt={t("imageAlt")}
                fill
                sizes="(max-width: 767px) calc(100vw - 48px)"
                className="object-cover"
              />
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

      <section ref={rootRef} className="relative hidden bg-canvas md:block md:h-[180svh]">
      <div className="md:sticky md:top-0 md:h-svh md:overflow-hidden">
        <div className="relative min-h-svh overflow-hidden bg-canvas md:h-full">
          <div className="pointer-events-none relative z-10 grid min-h-svh w-full items-center gap-10 px-6 py-section md:grid-cols-[0.46fr_0.54fr] md:py-0 md:pl-[7vw] md:pr-0 xl:pl-[11vw]">
            <div className="max-w-[680px] md:pr-6">
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
                className="mt-8 max-w-md text-body-md font-semibold leading-relaxed text-body"
              >
                {t("body")}
              </p>
            </div>

            <div className="relative z-10 min-h-[460px] md:min-h-0" aria-hidden />
          </div>

          <div
            data-solution-media
            className="relative mx-6 mb-section aspect-[4/3] overflow-hidden rounded-md bg-surface-card md:absolute md:inset-0 md:m-0 md:aspect-auto md:rounded-none"
          >
            <Image
              src="/feature-fabrication.jpg"
              alt={t("imageAlt")}
              fill
              sizes="(max-width: 767px) calc(100vw - 48px), 100vw"
              className="object-cover"
              priority={false}
            />
            <div
              className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-black/15 md:from-black/60 md:via-black/25 md:to-transparent"
              aria-hidden
            />
            <div className="absolute inset-x-0 bottom-0 grid gap-3 md:inset-y-[34%] md:left-[7%] md:right-[12%] md:bottom-auto md:grid-cols-2 md:gap-6">
              {SOLUTION_LINKS.map(({ key, href }) => (
                <Link
                  key={key}
                  href={href}
                  data-solution-action
                  className="group flex min-h-28 items-center justify-between border border-white/25 bg-black/30 px-8 text-on-dark backdrop-blur-sm transition-colors duration-200 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-inner md:min-h-36 lg:min-h-40"
                >
                  <span className="text-heading-lg font-bold">
                    {t(`links.${key}`)}
                  </span>
                  <ArrowRight
                    aria-hidden
                    className="size-9 shrink-0 transition-transform duration-200 group-hover:translate-x-2"
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
