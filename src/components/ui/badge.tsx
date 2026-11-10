import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Five variants only, matching the status set in design §5.5 — used
 * exclusively through `<StatusBadge>` (design §6.2), never directly, so a
 * screen cannot invent a sixth colour. The icon that goes inside a badge is
 * always `aria-hidden`, because the text label is what assistive
 * technology reads (Requirement 19.1).
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-medium w-fit whitespace-nowrap",
  {
    variants: {
      variant: {
        success: "bg-success-surface text-success-text border-success",
        warning: "bg-warning-surface text-warning-text border-warning",
        danger: "bg-danger-surface text-danger-text border-danger",
        neutral: "bg-neutral-surface text-neutral-text border-neutral-accent",
        info: "bg-info-surface text-info-text border-info",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant, className }))} {...props} />
  );
}

export { Badge, badgeVariants };
