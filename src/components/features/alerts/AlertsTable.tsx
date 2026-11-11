"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/patterns/DataTable";
import { EmptyState } from "@/components/patterns/EmptyState";
import { StatusBadge } from "@/components/patterns/StatusBadge";
import { formatDate } from "@/lib/format";
import type { LowStockAlertRow } from "@/lib/queries/materials";

/**
 * `DataTable`'s `columns` carry render functions, so whatever builds
 * them has to be a client component — a Server Component cannot hand a
 * function to a Client Component as a prop (see `RecentJobsTable` for
 * the same note). `/alerts`'s page itself stays a server component for
 * everything else (the banner and notices need no client state at all).
 */
function AlertsTable({ rows, canRecordStockIn }: { rows: LowStockAlertRow[]; canRecordStockIn: boolean }) {
  const t = useTranslations("Alerts");
  const tStatus = useTranslations("Status");

  const columns: DataTableColumn<LowStockAlertRow>[] = [
    {
      key: "name",
      header: t("colMaterialName"),
      priority: "primary",
      scopeRow: true,
      cell: (row) => (
        <div>
          <p className="font-medium text-foreground">{row.name}</p>
          <p className="text-xs text-muted-foreground">{row.material_code}</p>
        </div>
      ),
    },
    { key: "category", header: t("colCategory"), priority: "secondary", cell: (row) => row.category },
    {
      key: "current_stock",
      header: t("colCurrentQuantity"),
      priority: "primary",
      cell: (row) => `${row.current_stock} ${row.unit}`,
    },
    {
      key: "minimum_level",
      header: t("colMinimumLevel"),
      priority: "secondary",
      cell: (row) => `${row.minimum_level} ${row.unit}`,
    },
    {
      key: "stock_status",
      header: t("colStockStatus"),
      priority: "primary",
      cell: (row) => (
        <StatusBadge
          kind="stock"
          value={row.stock_status}
          label={row.stock_status === "out_of_stock" ? tStatus("stockOutOfStock") : tStatus("stockLowStock")}
        />
      ),
    },
    { key: "updated_at", header: t("colLastUpdated"), priority: "detail", cell: (row) => formatDate(row.updated_at) },
    {
      key: "action",
      header: t("colAction"),
      cell: (row) =>
        canRecordStockIn ? (
          <Link
            href={`/transactions?stockIn=${row.id}`}
            className="font-medium text-orange-700 underline-offset-4 hover:underline"
          >
            {t("recordStockInAction")}
          </Link>
        ) : null,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      caption={t("cardTitle")}
      emptyState={<EmptyState icon={CheckCircle2} title={t("emptyTitle")} body={t("emptyBody")} />}
    />
  );
}

export { AlertsTable };
