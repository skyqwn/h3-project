"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export function IndustryVisual({ kind, label }: { kind: "semiconductor" | "battery"; label: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    let dispose: (() => void) | undefined;
    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        try {
          const { mountIndustryScene } = await import("@/lib/three/industry-scene");
          if (cancelled) return;
          dispose = mountIndustryScene(host, kind, () => setReady(false));
          setReady(true);
        } catch {
          // The rendered poster remains visible if WebGL or the chunk fails.
          if (!cancelled) setReady(false);
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(host);

    return () => {
      cancelled = true;
      observer.disconnect();
      dispose?.();
    };
  }, [kind]);

  return (
    <div role="img" aria-label={label} className="relative h-full w-full" data-industry-visual={kind}>
      <Image
        src={`/industries/${kind}-concept.webp`}
        alt=""
        fill
        sizes="(max-width: 767px) 112vw, 56vw"
        className={`object-contain ${ready ? "invisible" : "visible"}`}
      />
      <div ref={hostRef} aria-hidden="true" className={`absolute inset-0 ${ready ? "visible" : "invisible"}`} />
    </div>
  );
}
