"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeftRight,
  BarChart3,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  UserRound,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { FeedbackBox } from "@/components/layout/FeedbackBox";

export type Role = "owner" | "admin_staff" | "worker";

type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  roles: Role[];
  indent?: boolean;
};

/**
 * The exact nav array, in order (design §20, Requirement 6.1). Nothing on a
 * screen decides this list on its own — `Sidebar` is built from this table
 * alone, so a role's navigation and its route-level authorisation cannot
 * disagree (design §14.3).
 */
const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["owner", "admin_staff", "worker"] },
  { id: "jobs", label: "Job Orders", href: "/jobs", icon: ClipboardList, roles: ["owner", "admin_staff", "worker"] },
  { id: "customers", label: "Customers", href: "/customers", icon: UserRound, roles: ["owner", "admin_staff"], indent: true },
  { id: "inventory", label: "Inventory", href: "/inventory", icon: Boxes, roles: ["owner", "admin_staff", "worker"] },
  { id: "transactions", label: "Inventory Transactions", href: "/transactions", icon: ArrowLeftRight, roles: ["owner", "admin_staff", "worker"] },
  { id: "alerts", label: "Low-Stock Alerts", href: "/alerts", icon: AlertTriangle, roles: ["owner", "admin_staff", "worker"] },
  { id: "reports", label: "Reports", href: "/reports", icon: BarChart3, roles: ["owner", "admin_staff"] },
  { id: "settings", label: "Settings", href: "/settings", icon: Settings, roles: ["owner", "admin_staff", "worker"] },
  { id: "users", label: "Users", href: "/users", icon: Users, roles: ["owner"] },
  { id: "feedback", label: "Feedback", href: "/feedback", icon: MessageSquare, roles: ["owner", "admin_staff"] },
];

function SidebarNav({
  role,
  alertCount,
  onNavigate,
}: {
  role: Role;
  alertCount: number;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-2 py-4">
      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-white",
                  "outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                  item.indent && "ml-4",
                  isActive ? "bg-navy-700" : "hover:bg-navy-700",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                <span className="flex-1">{item.label}</span>
                {item.id === "alerts" && alertCount > 0 && (
                  <span
                    className="flex min-w-6 items-center justify-center rounded-full bg-orange-500 px-1.5 py-0.5 text-xs font-semibold text-navy-900"
                    aria-label={`Low-Stock Alerts, ${alertCount} item${alertCount === 1 ? "" : "s"} need attention`}
                  >
                    {alertCount}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** The dark sidebar's static chrome: logo, wordmark, nav, feedback box, logout. */
function SidebarChrome({
  role,
  alertCount,
  onAddObservation,
  onLogout,
  onNavigate,
}: {
  role: Role;
  alertCount: number;
  onAddObservation?: () => void;
  onLogout?: () => void;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-4 py-4">
        <BrandLogo size="sm" />
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">RJM Furniture</p>
          <p className="text-xs text-dusk-200">Job & Inventory System</p>
        </div>
      </div>

      <SidebarNav role={role} alertCount={alertCount} onNavigate={onNavigate} />

      <FeedbackBox onAddObservation={onAddObservation} />

      <div className="border-t border-navy-700 p-2">
        <button
          type="button"
          onClick={onLogout}
          className={cn(
            "flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-white",
            "outline-none transition-colors hover:bg-navy-700 focus-visible:ring-2 focus-visible:ring-sidebar-ring",
          )}
        >
          <LogOut className="size-4" aria-hidden />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

/** The fixed desktop sidebar — hidden below the tablet breakpoint (design §6.7). */
function Sidebar(props: {
  role: Role;
  alertCount: number;
  onAddObservation?: () => void;
  onLogout?: () => void;
}) {
  return (
    <aside className="hidden md:flex md:w-64 md:shrink-0 md:flex-col">
      <SidebarChrome {...props} />
    </aside>
  );
}

export { Sidebar, SidebarChrome, NAV_ITEMS };
