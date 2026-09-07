"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { HeroLogoScene } from "@/lib/three/hero-logo-scene";

export function HeroLogo({ label }: { label: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HeroLogoScene | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const abort = new AbortController();
    async function mount() {
      try {
        const [module, response] = await Promise.all([
          import("@/lib/three/hero-logo-scene"),
          fetch("/brand/h3-symbol.svg", { signal: abort.signal }),
        ]);
        if (!response.ok) throw new Error("Logo asset unavailable");
        const source = await response.text();
        if (abort.signal.aborted) return;
        sceneRef.current = module.mountHeroLogo(host!, source, () => setReady(false), false);
        setReady(true);
      } catch {
        if (!abort.signal.aborted) setReady(false);
      }
    }
    void mount();
    return () => { abort.abort(); sceneRef.current?.dispose(); sceneRef.current = null; };
  }, []);

  return (
    <div className="relative h-full w-full" data-hero-logo>
      <div role="img" aria-label={label} className="absolute inset-0">
      <Image
        src="/brand/h3-symbol.svg"
        alt=""
        fill
        priority
        sizes="(max-width: 767px) 85vw, 48vw"
        className={`object-contain p-[10%] ${ready ? "invisible" : "visible"}`}
      />
      <div ref={hostRef} aria-hidden="true" className={`absolute inset-0 ${ready ? "visible" : "invisible"}`} />
      </div>
    </div>
  );
}
