import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The 44 × 44 px hit area (Requirement 17.2) sits on the Root; the visible
 * box stays a normal checkbox size on a `span` inside it, so the control
 * reads as a checkbox rather than a giant square while still meeting the
 * touch-target minimum.
 */
function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "group flex size-11 shrink-0 items-center justify-center rounded-md outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "flex size-5 items-center justify-center rounded-[0.25rem] border border-input bg-card shadow-sm",
          "group-data-[state=checked]:bg-primary group-data-[state=checked]:border-primary-border",
          "group-data-[state=checked]:text-primary-foreground",
        )}
      >
        <CheckboxPrimitive.Indicator className="flex items-center justify-center">
          <CheckIcon className="size-3.5" aria-hidden="true" />
        </CheckboxPrimitive.Indicator>
      </span>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
