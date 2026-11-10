"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { SidebarChrome } from "@/components/layout/Sidebar";
import type { Role } from "@/components/layout/Sidebar";

/**
 * The sidebar collapses into this drawer below the tablet breakpoint
 * (Requirement 6.7). Built directly on Radix Dialog rather than the
 * centred `ui/dialog`, because a drawer needs its own positioning — focus
 * trap, `Escape`-to-close and focus-restore-to-trigger all still come from
 * Radix for free. Closes on navigation because `SidebarChrome`'s links
 * call `onNavigate`, which this component wires to `setOpen(false)`.
 */
function MobileNav({
  role,
  alertCount,
  open,
  onOpenChange,
  onAddObservation,
  onLogout,
}: {
  role: Role;
  alertCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddObservation?: () => void;
  onLogout?: () => void;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label="Open navigation menu"
          className={cn(
            "flex size-11 items-center justify-center rounded-md text-foreground outline-none",
            "hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring md:hidden",
          )}
        >
          <Menu className="size-5" aria-hidden />
        </button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 md:hidden" />
        <DialogPrimitive.Content
          aria-label="Navigation"
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 outline-none md:hidden",
            "data-[state=open]:animate-in data-[state=open]:slide-in-from-left",
            "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left",
          )}
        >
          <div className="relative h-full">
            <DialogPrimitive.Close
              aria-label="Close navigation menu"
              className="absolute top-3 right-3 z-10 flex size-11 items-center justify-center rounded-md text-white outline-none hover:bg-navy-700 focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            >
              <X className="size-5" aria-hidden />
            </DialogPrimitive.Close>
            <SidebarChrome
              role={role}
              alertCount={alertCount}
              onAddObservation={onAddObservation}
              onLogout={onLogout}
              onNavigate={() => onOpenChange(false)}
            />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export { MobileNav };
