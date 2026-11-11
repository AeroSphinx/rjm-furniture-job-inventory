import { Skeleton } from "@/components/ui/skeleton";

/**
 * The list-screen loading silhouette (design §20, "every route has a
 * `loading.tsx`"): a toolbar bar plus `rows` placeholder rows, so the
 * first paint matches the final layout's shape instead of a blank area.
 */
function TableSkeleton({ rows }: { rows: number }) {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-11 w-full sm:max-w-xs" />
        <Skeleton className="h-11 w-40" />
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}

export { TableSkeleton };
