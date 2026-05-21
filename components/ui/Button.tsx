import { Link } from "@/i18n/routing";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "tertiary";
type Size = "lg" | "md" | "sm";

const base =
  "inline-flex items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed";

const sizeClass: Record<Size, string> = {
  lg: "h-12 px-7 text-button-md",
  md: "h-10 px-4 text-button-md",
  sm: "h-8 px-3 text-button-sm",
};

const variantClass: Record<Variant, string> = {
  primary:
    "bg-primary text-on-primary hover:bg-primary-pressed disabled:bg-surface-card disabled:text-ash",
  secondary:
    "bg-secondary-bg text-on-secondary hover:bg-secondary-pressed disabled:bg-surface-card disabled:text-ash",
  tertiary: "bg-transparent text-ink hover:bg-surface-card",
};

type BaseProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

type AsLink = BaseProps & {
  href: string;
} & Omit<ComponentProps<typeof Link>, "href" | "className" | "children">;

type AsButton = BaseProps & {
  href?: undefined;
} & Omit<ComponentProps<"button">, "className" | "children">;

export function Button(props: AsLink | AsButton) {
  const { variant = "primary", size = "md", className = "", children } = props;
  const cls = `${base} ${sizeClass[size]} ${variantClass[variant]} ${className}`;

  if ("href" in props && props.href) {
    const { variant: _, size: __, className: ___, children: ____, href, ...rest } =
      props;
    return (
      <Link href={href} className={cls} {...rest}>
        {children}
      </Link>
    );
  }

  const {
    variant: _,
    size: __,
    className: ___,
    children: ____,
    ...rest
  } = props as AsButton;
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}
