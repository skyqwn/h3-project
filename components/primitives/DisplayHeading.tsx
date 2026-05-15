import type { ReactNode, ElementType } from "react";

type Level = "xl" | "lg" | "heading-xl" | "heading-lg";

const levelClass: Record<Level, string> = {
  xl: "text-display-xl",
  lg: "text-display-lg",
  "heading-xl": "text-heading-xl",
  "heading-lg": "text-heading-lg",
};

type Props = {
  as?: ElementType;
  level?: Level;
  className?: string;
  children: ReactNode;
};

export function DisplayHeading({
  as: As = "h2",
  level = "lg",
  className = "",
  children,
}: Props) {
  const Tag = As;
  return <Tag className={`${levelClass[level]} text-ink ${className}`}>{children}</Tag>;
}
