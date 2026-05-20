import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-md border border-hairline bg-surface-card p-6",
        className
      )}
      {...props}
    />
  );
}
