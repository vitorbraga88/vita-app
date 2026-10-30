import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-[var(--r-md)] border border-border bg-bg-1 px-[var(--s-4)] text-[16px] text-fg-0 outline-none transition-colors placeholder:text-fg-2 hover:border-border-strong focus-visible:border-accent focus-visible:shadow-[0_0_0_3px_var(--accent-soft)] disabled:cursor-not-allowed disabled:bg-bg-0 disabled:text-fg-2 disabled:opacity-100 aria-invalid:border-err",
        className
      )}
      {...props}
    />
  )
}

export { Input }
