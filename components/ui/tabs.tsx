import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/utils/cn";

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
        data-slot="tabs-list"
        className={cn(
          "inline-flex h-12 items-center gap-1 overflow-hidden rounded-full bg-surface-muted p-1",
          className,
        )}
        {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
        data-slot="tabs-trigger"
        className={cn(
          "inline-flex h-10 cursor-pointer items-center justify-center rounded-full px-4 text-sm font-medium text-muted outline-none transition-[background-color,color,transform,box-shadow] duration-200 ease-[cubic-bezier(0.2,0.9,0.2,1)] hover:bg-button-subtle-hover hover:text-foreground active:scale-[0.98] data-[state=active]:translate-y-0 data-[state=active]:scale-100 data-[state=active]:bg-accent data-[state=active]:text-white data-[state=active]:shadow-[0_10px_24px_rgba(109,40,217,0.22)]",
          className,
        )}
        {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
