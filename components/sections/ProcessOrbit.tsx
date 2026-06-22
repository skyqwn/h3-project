"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useGSAP, gsap, ScrollTrigger } from "@/lib/gsap";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { Section } from "@/components/layout/Section";
import {
  Phone,
  Ruler,
  Cpu,
  Flame,
  HardHat,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS: { key: string; Icon: LucideIcon }[] = [
  { key: "s1", Icon: Phone },
  { key: "s2", Icon: Ruler },
  { key: "s3", Icon: Cpu },
  { key: "s4", Icon: Flame },
  { key: "s5", Icon: HardHat },
  { key: "s6", Icon: Wrench },
];

const N = STEPS.length;
// Ellipse radii, as a % of the stage box (horizontal wider than vertical).
const RX = 42;
const RY = 38;

// Nodes sit on a 300° open arc starting at top (12 o'clock) sweeping clockwise,
// so the last node lands at 300° and a 60° gap is left at the top — the orbiting
// marker travels exactly this arc as the section scrubs.
function angleFor(i: number) {
  return (i / (N - 1)) * 300;
}
function pointFor(angleDeg: number) {
  const a = (angleDeg * Math.PI) / 180;
  // Round to 4 decimals: Math.sin/cos can differ in the last ULP between the
  // Node (SSR) and browser engines, which otherwise produces a hydration
  // mismatch on these inline-style percentages.
  const round = (n: number) => Math.round(n * 1e4) / 1e4;
  return { left: round(50 + RX * Math.sin(a)), top: round(50 - RY * Math.cos(a)) };
}

const NODES = STEPS.map((s, i) => ({ ...s, i, ...pointFor(angleFor(i)) }));

export function ProcessOrbit() {
  const t = useTranslations("home.process");
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [motionless, setMotionless] = useState(false);

  useGSAP(
    () => {
      const track = trackRef.current;
      const marker = markerRef.current;
      if (!track || !marker) return;

      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      // Only reduced-motion falls back to the static list. The orbit itself is
      // responsive (circle on mobile, wide ellipse on desktop) and runs on all
      // screen sizes — matching the reference.
      if (reduced) {
        setMotionless(true);
        return;
      }

      const setMarker = (angle: number) => {
        const p = pointFor(angle);
        gsap.set(marker, { left: `${p.left}%`, top: `${p.top}%` });
      };
      setMarker(0);

      // No ScrollTrigger pin: the stage holds via CSS `position: sticky`, which
      // (unlike position: fixed) is not broken by the transformed page-enter
      // wrapper. We only scrub progress to drive the marker + active step.
      let last = -1;
      const st = ScrollTrigger.create({
        trigger: track,
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
        snap: { snapTo: 1 / (N - 1), duration: 0.3, ease: "power2.inOut" },
        onUpdate: (self) => {
          const p = self.progress;
          setMarker(p * 300);
          const idx = Math.round(p * (N - 1));
          if (idx !== last) {
            last = idx;
            setActive(idx);
          }
        },
      });

      return () => st.kill();
    },
    { scope: rootRef }
  );

  return (
    <Section tone="canvas">
      <div ref={rootRef}>
        <SectionHeader index="02" eyebrow={t("eyebrow")} title={t("title")} />

        {/* Desktop orbit: a tall scroll track with a sticky stage. The stage
            stays centered while the track scrolls; progress drives the marker
            and active step. Hidden on small screens / reduced-motion. */}
        <div className={cn(motionless ? "hidden" : "block")}>
          <div ref={trackRef} className="relative h-[320vh]">
            <div className="sticky top-0 flex h-[100svh] items-center justify-center">
              <div className="relative mx-auto aspect-square w-full max-w-md lg:aspect-[16/10] lg:max-w-5xl">
                {/* Orbit outline */}
                <svg
                  className="absolute inset-0 h-full w-full"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <ellipse
                    cx="50"
                    cy="50"
                    rx={RX}
                    ry={RY}
                    fill="none"
                    stroke="var(--color-hairline)"
                    strokeWidth="0.15"
                  />
                </svg>

                {/* Orbiting marker */}
                <div
                  ref={markerRef}
                  className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_0_5px_rgba(230,0,35,0.12)] lg:size-4 lg:shadow-[0_0_0_6px_rgba(230,0,35,0.12)]"
                  style={{ left: "50%", top: "12%" }}
                  aria-hidden
                />

                {/* Step nodes */}
                {NODES.map(({ key, Icon, i, left, top }) => {
                  const isActive = i === active;
                  return (
                    <div
                      key={key}
                      className="absolute -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${left}%`, top: `${top}%` }}
                      aria-hidden
                    >
                      <div
                        className={cn(
                          "flex size-11 items-center justify-center rounded-full border transition-all duration-500 lg:size-14",
                          isActive
                            ? "scale-110 border-primary bg-primary text-on-primary"
                            : "border-hairline bg-surface-elevated text-mute"
                        )}
                      >
                        <Icon className="size-4 lg:size-5" />
                      </div>
                    </div>
                  );
                })}

                {/* Center caption — crossfades through the steps */}
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center lg:px-8">
                  <div className="relative h-44 w-full max-w-xl">
                    {STEPS.map(({ key }, i) => (
                      <div
                        key={key}
                        className={cn(
                          "absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-500",
                          i === active ? "opacity-100" : "opacity-0"
                        )}
                      >
                        <span className="text-caption-md tabular-nums text-primary mb-3">
                          {String(i + 1).padStart(2, "0")} /{" "}
                          {String(N).padStart(2, "0")}
                        </span>
                        <h3 className="text-heading-xl text-ink mb-3 lg:text-display-lg">
                          {t(`${key}.title`)}
                        </h3>
                        <p className="text-body-sm text-body leading-relaxed lg:text-body-md">
                          {t(`${key}.desc`)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile / reduced-motion fallback: vertical numbered timeline. */}
        <ol
          className={cn(
            "space-y-8 border-l border-hairline pl-6",
            motionless ? "block" : "hidden"
          )}
        >
          {STEPS.map(({ key, Icon }, i) => (
            <li key={key} className="relative">
              <span className="absolute -left-[2.1rem] flex size-9 items-center justify-center rounded-full border border-hairline bg-surface-elevated text-mute">
                <Icon className="size-4" />
              </span>
              <div className="flex items-baseline gap-3">
                <span className="text-caption-md tabular-nums text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-heading-md text-ink">{t(`${key}.title`)}</h3>
              </div>
              <p className="text-body-sm text-body leading-relaxed mt-1">
                {t(`${key}.desc`)}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-12">
          <Button href="/contact" variant="primary" size="md" arrow>
            {t("cta")}
          </Button>
        </div>
      </div>
    </Section>
  );
}
