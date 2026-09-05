import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// tailwind-merge doesn't know about our hand-rolled typography classes
// (app/globals.css — DESIGN.md's type roles: text-display-xl, text-body-md,
// etc.), so by default it guesses they're `text-color` utilities and drops
// them whenever a real color class like `text-ink` shows up in the same
// `cn()` call (e.g. `cn("text-body-strong", "text-ink")` silently loses the
// size). Registering them under `font-size` — a group that doesn't conflict
// with `text-color` — fixes that everywhere `cn()` is used.
const TYPE_ROLE_CLASSES = [
  "text-display-xl",
  "text-display-lg",
  "text-heading-xl",
  "text-heading-lg",
  "text-heading-md",
  "text-body-md",
  "text-body-strong",
  "text-body-sm",
  "text-caption-md",
  "text-button-md",
  "text-button-sm",
];

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": TYPE_ROLE_CLASSES,
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
