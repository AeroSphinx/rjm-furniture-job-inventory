"use client";

import Link from "next/link";
import { ChevronDown, LogOut, Menu, Settings as SettingsIcon, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ROLE_LABELS = {
  owner: "Shop Owner",
  admin_staff: "Admin Staff",
  worker: "Carpenter / Worker",
} as const;

/**
 * "RJM FURNITURE" over its subtitle on the left; the user menu on the
 * right (Requirement 6.5). The menu's arrow-key roving focus and its
 * `Escape`-to-close-and-return-focus come from Radix (Requirement 6.6).
 */
function TopBar({
  fullName,
  role,
  onOpenMobileNav,
  onLogout,
}: {
  fullName: string;
  role: keyof typeof ROLE_LABELS;
  onOpenMobileNav?: () => void;
  onLogout?: () => void;
}) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Open navigation menu"
          onClick={onOpenMobileNav}
          className={cn(
            "flex size-11 items-center justify-center rounded-md text-foreground outline-none",
            "hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring md:hidden",
          )}
        >
          <Menu className="size-5" aria-hidden />
        </button>
        <div className="leading-tight">
          <p className="text-sm font-bold tracking-wide text-foreground">RJM FURNITURE</p>
          <p className="hidden text-xs text-muted-foreground sm:block">
            Carpentry Job & Inventory Management System
          </p>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex min-h-11 items-center gap-2 rounded-md px-2 text-sm outline-none",
              "hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-dusk-200 text-navy-900">
              <UserRound className="size-4" aria-hidden />
            </span>
            <span className="hidden text-left sm:block">
              <span className="block font-medium text-foreground">{fullName}</span>
              <span className="block text-xs text-muted-foreground">{ROLE_LABELS[role]}</span>
            </span>
            <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href="/settings" className="flex items-center gap-2">
              <SettingsIcon className="size-4" aria-hidden />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onLogout} className="flex items-center gap-2">
            <LogOut className="size-4" aria-hidden />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

export { TopBar };
