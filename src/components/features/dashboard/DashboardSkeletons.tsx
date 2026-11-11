import { Skeleton } from "@/components/ui/skeleton";

/** Each matches the shape of the section it stands in for (design §3.1's "silhouette, not a blank area" rule). */

function KpiGridSkeleton() {
  return (
    <div aria-busy="true" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-24 w-full" />
      ))}
    </div>
  );
}

function TwoPanelSkeleton() {
  return (
    <div aria-busy="true" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export { KpiGridSkeleton, TwoPanelSkeleton };
