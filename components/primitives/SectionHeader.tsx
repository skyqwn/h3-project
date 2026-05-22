"use client";

import { useRef, type ElementType } from "react";
import { useGSAP, gsap } from "@/lib/gsap";

type Tone = "light" | "dark";

type Props = {
  /** Two-digit chapter index, e.g. "01". Part of the deliberate numbered
   *  section system — turns a repeated eyebrow into intentional brand voice. */
  index: string;
  eyebrow: string;
  title: string;
  as?: ElementType;
  /** "dark" for use on surface-dark bands (e.g. the process interlude). */
  tone?: Tone;
  className?: string;
};

const toneClass: Record<
  Tone,
  { rule: string; index: string; eyebrow: string; title: string }
> = {
  light: {
    rule: "bg-hairline",
    index: "text-mute",
    eyebrow: "text-mute",
    title: "text-ink",
  },
  dark: {
    rule: "bg-white/15",
    index: "text-on-dark-mute",
    eyebrow: "text-on-dark-mute",
    title: "text-on-dark",
  },
};

export function SectionHeader({
  index,
  eyebrow,
  title,
  as: As = "h2",
  tone = "light",
  className = "",
}: Props) {
  const Heading = As;
  const c = toneClass[tone];
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const rule = root.querySelector("[data-rule]");
      const items = root.querySelectorAll("[data-reveal]");
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (reduced) {
        gsap.set(rule, { scaleX: 1 });
        gsap.set(items, { opacity: 1, y: 0 });
        return;
      }

      gsap
        .timeline({
          scrollTrigger: { trigger: root, start: "top 85%", once: true },
        })
        .to(rule, { scaleX: 1, duration: 0.6, ease: "power3.out" })
        .to(
          items,
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: "power3.out" },
          "-=0.35"
        );
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className={`mb-10 ${className}`}>
      <span
        data-rule
        className={`block h-px w-full origin-left ${c.rule}`}
        style={{ transform: "scaleX(0)" }}
        aria-hidden
      />
      <div
        data-reveal
        className="mt-5 mb-4 flex items-baseline gap-3"
        style={{ opacity: 0, transform: "translateY(14px)" }}
      >
        <span className={`text-caption-md tabular-nums ${c.index}`}>{index}</span>
        <span className={`text-caption-md uppercase tracking-wider ${c.eyebrow}`}>
          {eyebrow}
        </span>
      </div>
      <Heading
        data-reveal
        className={`text-heading-xl ${c.title}`}
        style={{ opacity: 0, transform: "translateY(14px)" }}
      >
        {title}
      </Heading>
    </div>
  );
}
