import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Allowed variants and sizes are defined once, here, and reused everywhere
 * (design §6.1) — a screen may not invent a variant.
 *
 * Every size bakes in `min-h-11 min-w-11` (44 × 44 px) so Requirement 17.2
 * cannot be missed. The `outline` and `secondary` edges are pinned to
 * `border-input` rather than shadcn's default `border-border`, because
 * `--border` measures 1.24:1 on white (design §5.4 row 50) — far below the
 * 3:1 a control's only affordance needs. `size="icon"` has no visible text,
 * so every usage MUST also pass `aria-label`.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium " +
    "transition-colors disabled:pointer-events-none disabled:opacity-50 " +
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 " +
    "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
    "min-h-11 min-w-11",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border border-primary-border shadow-sm hover:bg-orange-600",
        secondary: "bg-secondary text-secondary-foreground border border-input hover:bg-dusk-300",
        outline: "border border-input bg-card text-foreground hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:opacity-90",
        link: "text-orange-700 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-4 py-2",
        lg: "h-12 px-6 text-base",
        icon: "h-11 w-11 p-0",
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
