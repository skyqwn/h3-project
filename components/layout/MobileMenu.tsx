"use client";

import { useState, useRef, useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ChevronDown, X } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useGSAP, gsap } from "@/lib/gsap";
import { MOBILE_NAV, type MobileNavKey } from "./nav-items";
import { cn } from "@/lib/utils";

const noopSubscribe = () => () => {};

/** True only once mounted in the browser. Unlike `typeof document !==
 *  "undefined"` (evaluated during render), this reports `false` for the
 *  hydration pass itself, so the server- and client-rendered trees match —
 *  the portal only appears in a post-hydration update, per React's docs. */
function useIsMounted() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

export function MobileMenu() {
  const t = useTranslations("nav");
  const mounted = useIsMounted();

  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<MobileNavKey | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const closeMenu = () => {
    setOpen(false);
    setExpanded(null);
  };

  // Lock background scroll + Esc-to-close while open.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useGSAP(
    () => {
      const el = overlayRef.current;
      if (!el) return;
      const reduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const items = el.querySelectorAll<HTMLElement>("[data-mm-item]");

      if (open) {
        el.style.pointerEvents = "auto";
        if (reduced) {
          gsap.set(el, { display: "flex", autoAlpha: 1 });
          gsap.set(items, { y: 0, autoAlpha: 1 });
          return;
        }
        gsap
          .timeline()
          .set(el, { display: "flex" })
          .fromTo(
            el,
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.3, ease: "power2.out" }
          )
          .fromTo(
            items,
            { y: 16, autoAlpha: 0 },
            {
              y: 0,
              autoAlpha: 1,
              duration: 0.4,
              stagger: 0.05,
              ease: "power3.out",
            },
            "-=0.1"
          );
      } else {
        if (reduced) {
          gsap.set(el, { autoAlpha: 0, display: "none" });
          return;
        }
        gsap.to(el, {
          autoAlpha: 0,
          duration: 0.2,
          ease: "power2.in",
          onComplete: () => {
            if (overlayRef.current) {
              overlayRef.current.style.pointerEvents = "none";
              gsap.set(overlayRef.current, { display: "none" });
            }
          },
        });
      }
    },
    { dependencies: [open], scope: overlayRef }
  );

  const overlay = (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] hidden h-dvh flex-col overflow-y-auto bg-canvas"
      style={{ opacity: 0, pointerEvents: "none" }}
    >
      {/* Mirrors the header's own logo bar so the overlay reads as a
          full-screen continuation of the site chrome, not a different UI.
          Sticky so it stays put while the accordion list below scrolls. */}
      <div className="sticky top-0 z-10 flex h-20 shrink-0 items-center justify-between border-b border-hairline-soft bg-canvas px-6">
        <Link
          href="/"
          aria-label={t("home")}
          onClick={closeMenu}
          className="flex h-14 w-32 items-center justify-start"
        >
          <Image
            src="/logo-full.png"
            alt=""
            width={152}
            height={92}
            className="h-14 w-32 object-contain object-left"
          />
        </Link>

        <button
          type="button"
          aria-label={t("closeMenu")}
          onClick={closeMenu}
          className="flex h-10 w-10 cursor-pointer items-center justify-center text-ink"
        >
          <X size={26} strokeWidth={1.75} />
        </button>
      </div>

      <nav className="flex flex-col px-6 pb-10">
        {MOBILE_NAV.map((item) => {
          const hasChildren = item.children.length > 0;
          const isExpanded = expanded === item.key;

          return (
            <div
              key={item.href + item.key}
              data-mm-item
              className="border-b border-hairline"
            >
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() =>
                    setExpanded((k) => (k === item.key ? null : item.key))
                  }
                  aria-expanded={isExpanded}
                  className={cn(
                    "flex w-full cursor-pointer appearance-none items-center justify-between bg-transparent py-6 text-left font-body text-heading-xl font-extrabold transition-colors",
                    isExpanded ? "text-primary" : "text-ink hover:text-primary"
                  )}
                >
                  {t(item.key)}
                  <ChevronDown
                    size={24}
                    strokeWidth={2.25}
                    className={cn(
                      "shrink-0 transition-transform duration-200",
                      isExpanded ? "rotate-180 text-primary" : "text-mute"
                    )}
                  />
                </button>
              ) : (
                <Link
                  href={item.href}
                  onClick={closeMenu}
                  className="flex w-full items-center justify-between py-6 text-heading-xl font-extrabold text-ink transition-colors hover:text-primary"
                >
                  {t(item.key)}
                </Link>
              )}

              {hasChildren && (
                <div
                  className={cn(
                    "grid overflow-hidden bg-primary/8 transition-[grid-template-rows] duration-300 ease-out",
                    isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="flex flex-col gap-6 px-1 py-6">
                      {item.children.map((child) => (
                        <Link
                          key={`${item.key}-${child.key}`}
                          href={child.href}
                          onClick={closeMenu}
                          className="text-heading-md font-medium text-body transition-colors hover:text-primary"
                        >
                          {t(`mega.${item.key}.${child.key}`)}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );

  return (
    <div className="lg:hidden">
      {/* Only the closed-state hamburger renders here — once open, the
          overlay's own sticky bar (logo + X) is the single close control,
          so there's never a second icon competing for the same spot. */}
      {!open && (
        <button
          type="button"
          aria-label={t("openMenu")}
          aria-expanded={false}
          onClick={() => setOpen(true)}
          className="flex h-11 w-11 cursor-pointer flex-col items-center justify-center gap-1.5"
        >
          <span className="block h-0.5 w-6 bg-ink" />
          <span className="block h-0.5 w-6 bg-ink" />
          <span className="block h-0.5 w-6 bg-ink" />
        </button>
      )}

      {/* Portaled to <body> so the fixed full-screen overlay can never be
          clipped or re-stacked by the header's own box/z-index context. */}
      {mounted && createPortal(overlay, document.body)}
    </div>
  );
}
