import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.ComponentProps<"input">;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "w-full h-11 px-3 rounded-md bg-canvas text-body-md text-ink",
        "border border-ash placeholder:text-ash",
        "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30",
        "disabled:bg-surface-card disabled:text-mute disabled:cursor-not-allowed",
        "aria-[invalid=true]:border-error aria-[invalid=true]:ring-error/30",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
