"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Info, ArrowLeftRight } from "lucide-react";

import { SectionCard } from "@/components/patterns/SectionCard";
import { Toolbar } from "@/components/patterns/Toolbar";
import { DataTable, type DataTableColumn } from "@/components/patterns/DataTable";
import { EmptyState } from "@/components/patterns/EmptyState";
import { StatusBadge } from "@/components/patterns/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StockMovementForm } from "@/components/features/transactions/StockMovementForm";
import { formatDate } from "@/lib/format";
import { PAGE_SIZE } from "@/lib/constants";
import { errorCodeToKey, type ErrorCode } from "@/lib/errors";
import { TRANSACTION_TYPES, TXN_TYPE_KEYS } from "@/schemas/transaction";
import type { TransactionListRow } from "@/lib/queries/transactions";
import type { MaterialOption } from "@/lib/queries/materials";
import type { JobOption } from "@/lib/queries/transactions";
import type { Role } from "@/components/layout/Sidebar";

function TransactionsPageClient({
  rows,
  page,
  pageCount,
  totalCount,
  q,
  role,
  materials,
  jobs,
}: {
  rows: TransactionListRow[];
  page: number;
  pageCount: number;
  totalCount: number;
  q: string;
  role: Role;
  materials: MaterialOption[];
  jobs: JobOption[];
}) {
  const t = useTranslations("Transactions");
  const tCommon = useTranslations("Common");
  const tStatus = useTranslations("Status");
  const tErrors = useTranslations("Errors");
  const router = useRouter();

  const [formMode, setFormMode] = useState<"stock_in" | "stock_out" | null>(null);
  const [dirty, setDirty] = useState(false);

  const canStockIn = role !== "worker";
  const jobRequired = role === "worker";

  function showError(code: ErrorCode, detail?: Record<string, string | number>) {
    if (code === "INSUFFICIENT_STOCK" && detail) {
      toast.error(
        tErrors("insufficientStock", {
          available: detail.available as number,
          unit: detail.unit as string,
          material: detail.material as string,
        }),
      );
      return;
    }
    toast.error(tErrors(errorCodeToKey(code) as never));
  }

  function requestClose() {
    if (dirty && !window.confirm(`${tCommon("unsavedChangesTitle")}\n${tCommon("unsavedChangesBody")}`)) {
      return;
    }
    setDirty(false);
    setFormMode(null);
  }

  function handleSaved(toastMessage: string) {
    setFormMode(null);
    setDirty(false);
    toast.success(toastMessage);
    router.refresh();
  }

  const columns: DataTableColumn<TransactionListRow>[] = [
    { key: "txn_code", header: t("colTransactionId"), priority: "primary", scopeRow: true, cell: (row) => row.txn_code },
    { key: "material_name", header: t("colMaterialName"), priority: "primary", cell: (row) => row.material_name },
    {
      key: "type",
      header: t("colTransactionType"),
      priority: "primary",
      cell: (row) => <StatusBadge kind="txn" value={row.type} label={tStatus(TXN_TYPE_KEYS[row.type])} />,
    },
    { key: "quantity", header: t("colQuantity"), priority: "secondary", cell: (row) => `${row.quantity} ${row.unit}` },
    { key: "created_at", header: t("colDate"), priority: "detail", cell: (row) => formatDate(row.created_at) },
    { key: "reason", header: t("colReason"), priority: "detail", cell: (row) => row.reason ?? "—" },
    {
      key: "job_code",
      header: t("colRelatedJobOrder"),
      priority: "secondary",
      cell: (row) =>
        row.job_id && row.job_code ? (
          <Link href={`/jobs/${row.job_id}`} className="font-medium text-orange-700 underline-offset-4 hover:underline">
            {row.job_code}
          </Link>
        ) : (
          "—"
        ),
    },
  ];

  const emptyState = (
    <EmptyState
      icon={ArrowLeftRight}
      title={t("emptyTitle")}
      body={q ? t("emptyBodyQuery", { query: q }) : t("emptyBodyNoQuery")}
      action={
        q ? (
          <Button type="button" variant="outline" onClick={() => router.push("/transactions")}>
            {tCommon("clearFilters")}
          </Button>
        ) : undefined
      }
    />
  );

  return (
    <>
      <div role="status" className="mb-4 flex items-start gap-3 rounded-md border border-info bg-info-surface p-4">
        <Info className="mt-0.5 size-5 shrink-0 text-info-text" aria-hidden />
        <div className="text-sm text-info-text">
          <p>{t("traceabilityBanner")}</p>
          <p className="mt-1">{t("correctionHint")}</p>
        </div>
      </div>

      <SectionCard title={t("cardTitle")} subtitle={t("cardSubtitle")}>
        <div className="flex flex-col gap-4">
          <Toolbar
            searchPlaceholder={t("searchPlaceholder")}
            filters={[
              {
                key: "type",
                label: t("typeFilterLabel"),
                options: TRANSACTION_TYPES.map((type) => ({ value: type, label: tStatus(TXN_TYPE_KEYS[type]) })),
              },
            ]}
            primaryAction={
              <div className="flex flex-wrap gap-2">
                {canStockIn && (
                  <Button type="button" onClick={() => setFormMode("stock_in")}>
                    {t("recordStockInButton")}
                  </Button>
                )}
                <Button type="button" variant={canStockIn ? "outline" : "default"} onClick={() => setFormMode("stock_out")}>
                  {t("recordStockOutButton")}
                </Button>
              </div>
            }
            resultCount={totalCount}
            resultCountLabel={(count) => tCommon("recordCount", { count })}
          />
          <DataTable
            columns={columns}
            rows={rows}
            caption={t("cardTitle")}
            emptyState={emptyState}
            page={page}
            pageCount={pageCount}
            totalCount={totalCount}
            pageSize={PAGE_SIZE}
          />
        </div>
      </SectionCard>

      <Dialog open={formMode !== null} onOpenChange={(open) => (open ? undefined : requestClose())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{formMode === "stock_in" ? t("formTitleStockIn") : t("formTitleStockOut")}</DialogTitle>
          </DialogHeader>
          {formMode && (
            <StockMovementForm
              mode={formMode}
              materials={materials}
              jobs={jobs}
              jobRequired={jobRequired}
              onSaved={(_result, toastMessage) => handleSaved(toastMessage)}
              onDirtyChange={setDirty}
              onErrorCode={showError}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export { TransactionsPageClient };
