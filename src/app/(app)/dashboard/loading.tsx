import { Skeleton } from "@/components/ui/skeleton";
import { KpiGridSkeleton, TwoPanelSkeleton } from "@/components/features/dashboard/DashboardSkeletons";

/** Matches `/dashboard`'s final shape (design §3.1): header, greeting, then the three sections. */
export default function DashboardLoading() {
  return (
    <div aria-busy="true">
      <div className="mb-6 flex flex-col gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>
      <Skeleton className="mb-6 h-24 w-full" />
      <div className="flex flex-col gap-6">
        <KpiGridSkeleton />
        <TwoPanelSkeleton />
        <TwoPanelSkeleton />
      </div>
    </div>
  );
}
