import { Skeleton } from "@/components/ui/skeleton";

/** Matches `/alerts`'s final shape: header, banner, notices, then the table (design §20). */
export default function AlertsLoading() {
  return (
    <div aria-busy="true">
      <div className="mb-6 flex flex-col gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="mb-4 h-20 w-full" />
      <Skeleton className="mb-4 h-16 w-full" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
