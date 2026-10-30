"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cn } from "cn";

function Tabs({ className, ...props }: TabsPrimitive.Root.Props) {
  return <TabsPrimitive.Root data-slot="tabs" className={cn("flex flex-col gap-[var(--s-4)]", className)} {...props} />;
}

function TabsList({ className, ...props }: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn("inline-flex w-fit items-center gap-[var(--s-5)] border-b border-border", className)}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-11 items-center justify-center whitespace-nowrap px-[var(--s-1)] text-[var(--t-fn)] font-medium text-fg-1 outline-none transition-colors",
        "hover:text-fg-0 disabled:pointer-events-none disabled:opacity-40",
        "data-active:text-fg-0",
        "after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:scale-x-0 after:bg-accent after:transition-transform after:content-['']",
        "data-active:after:scale-x-100",
        className
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return <TabsPrimitive.Panel data-slot="tabs-content" className={cn("outline-none", className)} {...props} />;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
