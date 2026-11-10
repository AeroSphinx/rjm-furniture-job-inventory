"use client";

import { useState } from "react";

import { SkipLink } from "@/components/layout/SkipLink";
import { Sidebar, type Role } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { TopBar } from "@/components/layout/TopBar";

export type ShellProfile = {
  fullName: string;
  role: Role;
};

/**
 * The frame every authenticated screen renders inside (design §6.2):
 * skip link, sidebar (desktop) / drawer (mobile), top bar, and the `<main>`
 * landmark the skip link jumps to. `alertCount` is passed in rather than
 * queried here, so this component has no database dependency of its own —
 * the page that renders it is the one place that knows how to compute it.
 */
function AppShell({
  profile,
  alertCount,
  onAddObservation,
  onLogout,
  children,
}: {
  profile: ShellProfile;
  alertCount: number;
  onAddObservation?: () => void;
  onLogout?: () => void;
  children: React.ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <SkipLink />
      <Sidebar
        role={profile.role}
        alertCount={alertCount}
        onAddObservation={onAddObservation}
        onLogout={onLogout}
      />
      <MobileNav
        role={profile.role}
        alertCount={alertCount}
        open={mobileNavOpen}
        onOpenChange={setMobileNavOpen}
        onAddObservation={onAddObservation}
        onLogout={onLogout}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          fullName={profile.fullName}
          role={profile.role}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onLogout={onLogout}
        />
        <main id="main" className="flex-1 bg-background p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export { AppShell };
