import { Skeleton } from "@/components/ui/skeleton";

/** Matches `/reports`'s final shape: header, range toolbar, then four stacked cards (design §20). */
export default function ReportsLoading() {
  return (
    <div aria-busy="true">
      <div className="mb-6 flex flex-col gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="mb-4 h-16 w-full" />
      <div className="flex flex-col gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-40 w-full" />
        ))}
      </div>
    </div>
  );
}
