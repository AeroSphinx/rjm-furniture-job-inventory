"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export type DataTableColumn<Row> = {
  key: string;
  header: string;
  /** `detail` columns hide below the `sm` breakpoint and under Simple mode. */
  priority?: "primary" | "secondary" | "detail";
  cell: (row: Row) => ReactNode;
  /** The identifier column renders `<th scope="row">` instead of `<td>`. */
  scopeRow?: boolean;
};

/**
 * One real `<table>` reused by every list screen (design §6.2). `priority`
 * drives the responsive column strategy (Requirement 18.12): `detail`
 * columns hide on narrow viewports and under Simple mode rather than the
 * table switching to stacked cards, so no information is lost — it is one
 * tap away at a wider viewport or with Simple mode off.
 */
function DataTable<Row extends { id: string | number }>({
  columns,
  rows,
  caption,
  emptyState,
  page,
  pageCount,
  totalCount,
  pageSize,
}: {
  columns: DataTableColumn<Row>[];
  rows: Row[];
  caption: string;
  emptyState?: ReactNode;
  page?: number;
  pageCount?: number;
  totalCount?: number;
  pageSize?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function hrefForPage(target: number) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("page", String(target));
    return `${pathname}?${next.toString()}`;
  }

  function goToPage(target: number) {
    router.push(hrefForPage(target));
  }

  if (rows.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className="flex flex-col gap-4">
      <Table>
        <TableCaption className="sr-only">{caption}</TableCaption>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.key}
                data-col-priority={column.priority ?? "primary"}
                className={column.priority === "detail" ? "hidden sm:table-cell" : undefined}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              {columns.map((column) =>
                column.scopeRow ? (
                  <TableHead
                    key={column.key}
                    scope="row"
                    data-col-priority={column.priority ?? "primary"}
                    className="font-normal"
                  >
                    {column.cell(row)}
                  </TableHead>
                ) : (
                  <TableCell
                    key={column.key}
                    data-col-priority={column.priority ?? "primary"}
                    className={column.priority === "detail" ? "hidden sm:table-cell" : undefined}
                  >
                    {column.cell(row)}
                  </TableCell>
                ),
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {page !== undefined && pageCount !== undefined && pageCount > 1 && (
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          {totalCount !== undefined && pageSize !== undefined && (
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount} records
            </p>
          )}
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                />
              </PaginationItem>
              {Array.from({ length: pageCount }, (_, index) => index + 1)
                .filter((n) => n === 1 || n === pageCount || Math.abs(n - page) <= 1)
                .map((n, index, arr) => (
                  <PaginationItem key={n}>
                    {index > 0 && arr[index - 1] !== n - 1 ? (
                      <PaginationEllipsis />
                    ) : null}
                    <PaginationLink
                      ariaLabel={`Go to page ${n}`}
                      isActive={n === page}
                      onClick={() => goToPage(n)}
                    >
                      {n}
                    </PaginationLink>
                  </PaginationItem>
                ))}
              <PaginationItem>
                <PaginationNext disabled={page >= pageCount} onClick={() => goToPage(page + 1)} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}

export { DataTable };
