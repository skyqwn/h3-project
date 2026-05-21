"use client";

import { useRef, type ReactNode, type ElementType } from "react";
import { useGSAP, gsap } from "@/lib/gsap";

type Props = {
  children: ReactNode;
  /** element to render (default "div"); use "ol"/"ul" for lists */
  as?: ElementType;
  /** translateY start distance in px (default 20) */
  y?: number;
  /** delay between siblings in seconds (default 0.08) */
  stagger?: number;
  className?: string;
};

/**
 * Reveals its direct children with a scroll-triggered staggered fade-up.
 * Children start hidden (via the container's opacity) to avoid a flash, then
 * each rises in sequence. Honors prefers-reduced-motion.
 */
export function Stagger({
  children,
  as: As = "div",
  y = 20,
  stagger = 0.08,
  className = "",
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const targets = Array.from(el.children);
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (reduced) {
        gsap.set(el, { opacity: 1 });
        gsap.set(targets, { opacity: 1, y: 0 });
        return;
      }

      gsap.set(el, { opacity: 1 });
      gsap.fromTo(
        targets,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 82%", once: true },
        }
      );
    },
    { scope: ref }
  );

  return (
    <As
      ref={ref}
      className={className}
      style={{ opacity: 0 }}
    >
      {children}
    </As>
  );
}
