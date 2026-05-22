import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Small uppercase, letter-tracked kicker/label (caption tier, muted) used
 * above headings, on meta lines, and as sidebar section labels. One source
 * for the kicker style so it can't drift across the site.
 */
export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-caption-md uppercase tracking-wider text-mute",
        className
      )}
    >
      {children}
    </p>
  );
}
