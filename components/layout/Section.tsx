import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const tones = {
  canvas: "bg-canvas",
  soft: "bg-surface-soft",
  dark: "bg-surface-dark",
} as const;

type Props = {
  /** Background band. */
  tone?: keyof typeof tones;
  /** Extra classes for the inner max-width container. */
  className?: string;
  children: ReactNode;
};

/**
 * Standard content section band: one background, the section vertical rhythm,
 * and a single max-width container — so every home/content section shares the
 * same width and left/right edges instead of drifting (page vs reading vs
 * narrow).
 */
export function Section({ tone = "canvas", className, children }: Props) {
  return (
    <section className={cn(tones[tone], "py-section")}>
      <div className={cn("max-w-page mx-auto px-6", className)}>{children}</div>
    </section>
  );
}
