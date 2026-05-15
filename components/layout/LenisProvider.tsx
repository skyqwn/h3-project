"use client";

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";

export function LenisProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });

    const onScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onScroll);

    const tickerFn = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tickerFn);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.off("scroll", onScroll);
      gsap.ticker.remove(tickerFn);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
