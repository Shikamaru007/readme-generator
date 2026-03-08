import * as React from "react";
import { cn } from "@/utils/cn";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-12 w-full rounded-2xl border border-border bg-[#fcfaf6] px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted focus-visible:border-accent focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-[rgba(109,40,217,0.12)]",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
