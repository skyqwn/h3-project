"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP, gsap } from "@/lib/gsap";

type Props = {
  children: ReactNode;
  /** translateY distance in px to animate from (default 24) */
  y?: number;
  /** duration in seconds (default 0.6) */
  duration?: number;
  /** delay in seconds (default 0) */
  delay?: number;
  className?: string;
  /** Play once and stay revealed (default), or reverse back out when you
   *  scroll back up past the trigger point and replay on the way back down. */
  once?: boolean;
};

export function ScrollReveal({
  children,
  y = 24,
  duration = 0.6,
  delay = 0,
  className = "",
  once = true,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      if (!ref.current) return;
      const reduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        gsap.set(ref.current, { opacity: 1, y: 0 });
        return;
      }
      gsap.fromTo(
        ref.current,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration,
          delay,
          ease: "power2.out",
          scrollTrigger: once
            ? { trigger: ref.current, start: "top 85%", once: true }
            : {
                trigger: ref.current,
                start: "top 85%",
                end: "bottom top",
                toggleActions: "play none none reverse",
              },
        }
      );
    },
    { scope: ref, dependencies: [once] }
  );

  return (
    <div ref={ref} className={className} style={{ opacity: 0 }}>
      {children}
    </div>
  );
}
