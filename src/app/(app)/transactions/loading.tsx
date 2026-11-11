import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/patterns/TableSkeleton";
import { PAGE_SIZE } from "@/lib/constants";

export default function TransactionsLoading() {
  return (
    <div>
      <div className="mb-6 flex flex-col gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <TableSkeleton rows={PAGE_SIZE} />
      </div>
    </div>
  );
}
