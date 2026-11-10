import * as React from "react";

import { cn } from "@/lib/utils";

/** Loading containers that hold one or more of these set `aria-busy="true"` themselves. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
