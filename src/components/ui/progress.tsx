import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

/**
 * Used for the dashboard's status bars (design §6.1): `role="img"` with an
 * `aria-label` that carries the same text already shown beside the bar
 * (Requirement 19.5), because these bars are a static picture of a count
 * that is also printed as text, not a live task-progress indicator.
 */
function Progress({
  className,
  value,
  indicatorClassName,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & { indicatorClassName?: string }) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      role="img"
      className={cn("relative h-3 w-full overflow-hidden rounded-full bg-dusk-200", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn("h-full flex-1 bg-orange-700 transition-all", indicatorClassName)}
        style={{ width: `${value ?? 0}%` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
