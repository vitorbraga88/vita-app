import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "cn";

const buttonVariants = cva(
  "press-scale inline-flex shrink-0 items-center justify-center gap-2 rounded-[var(--r-md)] text-[var(--t-fn)] font-semibold whitespace-nowrap outline-none disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-ink hover:bg-accent-dim",
        ghost: "border border-border bg-transparent text-fg-0 hover:bg-bg-2 hover:border-border-strong",
        danger: "border border-err/40 bg-transparent text-err hover:bg-bg-2",
      },
      size: {
        default: "h-12 px-[var(--s-5)]",
        icon: "size-12",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

interface ButtonProps extends ButtonPrimitive.Props, VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

function Button({ className, variant, size, loading, disabled, children, render, nativeButton, ...props }: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      render={render}
      nativeButton={nativeButton ?? !render}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin" aria-hidden="true" /> : children}
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants };
