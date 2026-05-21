import { Link } from "@/i18n/routing";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "tertiary";
type Size = "lg" | "md" | "sm";

const base =
  "inline-flex select-none items-center justify-center rounded-md cursor-pointer " +
  // Motion: animate color AND transform with an ease-out-quint curve so the
  // press feels deliberate, not the default 'fade'. Honors reduced-motion via
  // the global stylesheet (durations collapse to ~0).
  "transition-[background-color,color,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] " +
  // Press feedback.
  "active:scale-[0.97] disabled:active:scale-100 " +
  // Keyboard focus ring (DESIGN focus-outer token), offset so it reads on any
  // surface; mouse clicks stay ring-free via focus-visible.
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-outer " +
  "disabled:cursor-not-allowed";

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
