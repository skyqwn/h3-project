import { Link } from "@/i18n/routing";
import type { ReactNode } from "react";

type Variant = "on-image" | "on-light";

const variantClass: Record<Variant, string> = {
  // Sits over full-bleed photography — white pill, dark text.
  "on-image": "bg-canvas text-ink",
  // Sits on light/cream chrome — transparent fill, dark hairline outline.
  "on-light": "bg-transparent text-ink border border-ink",
};

type Props = {
  href: string;
  variant?: Variant;
  children: ReactNode;
  className?: string;
};

export function GhostPill({
  href,
  variant = "on-image",
  children,
  className = "",
}: Props) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center rounded-full px-4 py-2 text-button-md ${variantClass[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
