import * as React from "react";
import { cn } from "@/utils/cn";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-24 w-full rounded-2xl border border-border bg-input-surface px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted focus-visible:border-accent focus-visible:bg-surface focus-visible:ring-4 focus-visible:ring-[rgba(109,40,217,0.12)]",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
