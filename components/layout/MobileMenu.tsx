"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useGSAP, gsap } from "@/lib/gsap";

export function MobileMenu() {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  // Lock background scroll + Esc-to-close while open.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
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
            { autoAlpha: 1, duration: 0.35, ease: "power2.out" }
          )
          .fromTo(
            items,
            { y: 28, autoAlpha: 0 },
            {
              y: 0,
              autoAlpha: 1,
              duration: 0.5,
              stagger: 0.07,
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
          duration: 0.25,
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

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative z-[60] flex h-11 w-11 cursor-pointer flex-col items-center justify-center gap-1.5"
      >
        <span
          className={`block h-0.5 w-6 bg-ink transition-transform duration-300 ${
            open ? "translate-y-2 rotate-45" : ""
          }`}
        />
        <span
          className={`block h-0.5 w-6 bg-ink transition-opacity duration-300 ${
            open ? "opacity-0" : ""
          }`}
        />
        <span
          className={`block h-0.5 w-6 bg-ink transition-transform duration-300 ${
            open ? "-translate-y-2 -rotate-45" : ""
          }`}
        />
      </button>

      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 hidden flex-col items-center justify-center gap-8 bg-canvas px-6"
        style={{ opacity: 0, pointerEvents: "none" }}
      >
        <nav className="flex flex-col items-center gap-6 text-display-lg text-ink">
          <Link
            data-mm-item
            href="/about"
            onClick={() => setOpen(false)}
            className="hover:text-primary transition-colors"
          >
            {t("about")}
          </Link>
          <Link
            data-mm-item
            href="/products"
            onClick={() => setOpen(false)}
            className="hover:text-primary transition-colors"
          >
            {t("products")}
          </Link>
          <Link
            data-mm-item
            href="/blog"
            onClick={() => setOpen(false)}
            className="hover:text-primary transition-colors"
          >
            {t("blog")}
          </Link>
          <Link
            data-mm-item
            href="/contact"
            onClick={() => setOpen(false)}
            className="hover:text-primary transition-colors"
          >
            {t("contact")}
          </Link>
        </nav>
      </div>
    </div>
  );
}
