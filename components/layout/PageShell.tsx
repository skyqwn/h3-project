import type { ReactNode } from "react";
import { DisplayHeading } from "@/components/primitives/DisplayHeading";

type Props = {
  /** Uppercase kicker above the title (e.g. "What we do"). */
  eyebrow: string;
  title: string;
  children: ReactNode;
  /**
   * Whether this shell is the whole page (min-height fills the viewport so the
   * footer sits at the bottom). Set false when full-bleed sections follow the
   * shell as siblings (e.g. the about page's map band), otherwise a short
   * intro stretches and leaves a big empty gap.
   */
  fill?: boolean;
};

/**
 * Shared page shell for the standard content pages (products, blog, about,
 * contact). One source of truth for background, container width, and the
 * eyebrow + title header so the pages can't drift apart.
 *
 * Full-bleed sections (e.g. a map band) render as siblings AFTER this shell,
 * not inside `children`.
 */
export function PageShell({ eyebrow, title, children, fill = true }: Props) {
  return (
    <div className={`${fill ? "min-h-screen " : ""}bg-canvas py-section`}>
      <div className="max-w-page mx-auto px-6">
        <p className="text-caption-md uppercase tracking-wider text-mute mb-3">
          {eyebrow}
        </p>
        <DisplayHeading level="lg" className="mb-12">
          {title}
        </DisplayHeading>
        {children}
      </div>
    </div>
  );
}
