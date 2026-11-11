import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/patterns/PageHeader";
import { GreetingCard } from "@/components/features/dashboard/GreetingCard";
import { KpiSection } from "@/components/features/dashboard/KpiSection";
import { JobsOverviewSection } from "@/components/features/dashboard/JobsOverviewSection";
import { InventoryActivitySection } from "@/components/features/dashboard/InventoryActivitySection";
import { KpiGridSkeleton, TwoPanelSkeleton } from "@/components/features/dashboard/DashboardSkeletons";
import { requireUser } from "@/lib/auth";
import { APP_VERSION } from "@/lib/constants";

/**
 * `/dashboard` (Requirement 7.1-7.13, design §3.1). The header and the
 * greeting card render instantly (no query); the three KPI/panel
 * sections each stream independently inside their own `<Suspense>`, so a
 * slow or failing section never blanks the rest of the page.
 */
export default async function DashboardPage() {
  const profile = await requireUser();
  const t = await getTranslations("Dashboard");

  return (
    <div>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        purpose={t("purpose")}
        versionChip={
          <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {APP_VERSION}
          </span>
        }
      />

      <GreetingCard fullName={profile.fullName} role={profile.role} t={t} />

      <div className="flex flex-col gap-6">
        <Suspense fallback={<KpiGridSkeleton />}>
          <KpiSection />
        </Suspense>
        <Suspense fallback={<TwoPanelSkeleton />}>
          <JobsOverviewSection />
        </Suspense>
        <Suspense fallback={<TwoPanelSkeleton />}>
          <InventoryActivitySection />
        </Suspense>
      </div>
    </div>
  );
}
