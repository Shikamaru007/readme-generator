import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-accent text-white hover:bg-[#5b21b6]",
        secondary:
          "border border-[rgba(214,209,199,0.8)] bg-[rgba(255,255,255,0.78)] text-foreground hover:bg-white hover:text-accent",
        ghost:
          "border border-[rgba(214,209,199,0.72)] bg-[rgba(255,255,255,0.56)] text-muted hover:bg-[rgba(255,255,255,0.82)] hover:text-foreground",
        icon:
          "border border-[rgba(214,209,199,0.72)] bg-[rgba(255,255,255,0.78)] text-accent hover:bg-white",
        iconPrimary: "bg-accent text-white hover:bg-[#5b21b6]",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 px-4",
        lg: "h-12 px-6",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
