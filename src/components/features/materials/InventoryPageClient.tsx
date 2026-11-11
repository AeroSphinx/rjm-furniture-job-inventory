"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AlertTriangle, Boxes, Pencil, Trash2 } from "lucide-react";

import { SectionCard } from "@/components/patterns/SectionCard";
import { Toolbar } from "@/components/patterns/Toolbar";
import { DataTable, type DataTableColumn } from "@/components/patterns/DataTable";
import { EmptyState } from "@/components/patterns/EmptyState";
import { StatusBadge } from "@/components/patterns/StatusBadge";
import { ConfirmDialog } from "@/components/patterns/ConfirmDialog";
import { showUndoToast } from "@/components/patterns/UndoToast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MaterialForm } from "@/components/features/materials/MaterialForm";
import { softDeleteMaterial, restoreMaterial } from "@/actions/materials";
import { PAGE_SIZE } from "@/lib/constants";
import { errorCodeToKey, type ErrorCode } from "@/lib/errors";
import { MATERIAL_CATEGORIES } from "@/schemas/material";
import type { MaterialListRow, StockStatus } from "@/lib/queries/materials";
import type { Role } from "@/components/layout/Sidebar";

const STOCK_STATUS_KEYS: Record<StockStatus, "stockInStock" | "stockLowStock" | "stockOutOfStock"> = {
  in_stock: "stockInStock",
  low_stock: "stockLowStock",
  out_of_stock: "stockOutOfStock",
};

function InventoryPageClient({
  rows,
  page,
  pageCount,
  totalCount,
  attentionCount,
  q,
  role,
  costMap,
}: {
  rows: MaterialListRow[];
  page: number;
  pageCount: number;
  totalCount: number;
  attentionCount: number;
  q: string;
  role: Role;
  costMap: Record<string, number>;
}) {
  const t = useTranslations("Materials");
  const tCommon = useTranslations("Common");
  const tStatus = useTranslations("Status");
  const tErrors = useTranslations("Errors");
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [formOpen, setFormOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<MaterialListRow | null>(null);
  const [dirty, setDirty] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState<MaterialListRow | null>(null);

  const canWrite = role !== "worker";

  function showError(code: ErrorCode) {
    toast.error(tErrors(errorCodeToKey(code) as never));
  }

  function openCreate() {
    setEditingRow(null);
    setFormOpen(true);
  }

  function openEdit(row: MaterialListRow) {
    setEditingRow(row);
    setFormOpen(true);
  }

  function requestClose() {
    if (dirty && !window.confirm(`${tCommon("unsavedChangesTitle")}\n${tCommon("unsavedChangesBody")}`)) {
      return;
    }
    setDirty(false);
    setFormOpen(false);
  }

  function handleSaved(result: { material_code: string; current_stock: number }) {
    setFormOpen(false);
    setDirty(false);
    toast.success(
      editingRow
        ? t("updateSuccessToast", { code: result.material_code })
        : t("createSuccessToast", { code: result.material_code }),
    );
    router.refresh();
  }

  function handleDelete() {
    const row = confirmingDelete;
    if (!row) return;
    setConfirmingDelete(null);
    startTransition(async () => {
      const result = await softDeleteMaterial(row.id);
      if (!result.ok) {
        showError(result.code);
        return;
      }
      router.refresh();
      showUndoToast({
        message: t("deleteSuccessToast", { code: row.material_code }),
        onUndo: () => {
          startTransition(async () => {
            const restoreResult = await restoreMaterial(row.id);
            if (restoreResult.ok) {
              toast.success(t("restoreSuccessToast", { code: row.material_code }));
              router.refresh();
            } else {
              showError(restoreResult.code);
            }
          });
        },
      });
    });
  }

  const columns: DataTableColumn<MaterialListRow>[] = [
    { key: "material_code", header: t("colMaterialId"), priority: "primary", scopeRow: true, cell: (row) => row.material_code },
    { key: "name", header: t("colMaterialName"), priority: "primary", cell: (row) => row.name },
    { key: "category", header: t("colCategory"), priority: "secondary", cell: (row) => row.category },
    { key: "current_stock", header: t("colCurrentStock"), priority: "secondary", cell: (row) => row.current_stock },
    { key: "unit", header: t("colUnit"), priority: "detail", cell: (row) => row.unit },
    { key: "minimum_level", header: t("colMinimumLevel"), priority: "detail", cell: (row) => row.minimum_level },
    {
      key: "stock_status",
      header: t("colStockStatus"),
      priority: "primary",
      cell: (row) => <StatusBadge kind="stock" value={row.stock_status} label={tStatus(STOCK_STATUS_KEYS[row.stock_status])} />,
    },
    {
      key: "actions",
      header: t("colActions"),
      cell: (row) =>
        canWrite ? (
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("editAction", { code: row.material_code })}
              onClick={() => openEdit(row)}
            >
              <Pencil className="size-4" aria-hidden />
              <span className="icon-btn-label">{tCommon("edit")}</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("deleteAction", { code: row.material_code })}
              onClick={() => setConfirmingDelete(row)}
            >
              <Trash2 className="size-4" aria-hidden />
              <span className="icon-btn-label">{tCommon("delete")}</span>
            </Button>
          </div>
        ) : null,
    },
  ];

  const emptyState = (
    <EmptyState
      icon={Boxes}
      title={t("emptyTitle")}
      body={q ? t("emptyBodyQuery", { query: q }) : t("emptyBodyNoQuery")}
      action={
        q ? (
          <Button type="button" variant="outline" onClick={() => router.push("/inventory")}>
            {tCommon("clearFilters")}
          </Button>
        ) : canWrite ? (
          <Button type="button" onClick={openCreate}>
            {t("addButton")}
          </Button>
        ) : undefined
      }
    />
  );

  return (
    <>
      {attentionCount > 0 && (
        <div role="status" className="mb-4 flex items-start gap-3 rounded-md border border-warning bg-warning-surface p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning-text" aria-hidden />
          <p className="text-sm text-warning-text">
            {t("attentionBanner", { count: attentionCount })}{" "}
            <Link href="/alerts" className="font-medium underline-offset-4 hover:underline">
              {t("viewAlertsLink")}
            </Link>
          </p>
        </div>
      )}

      <SectionCard
        title={t("cardTitle")}
        subtitle={t("cardSubtitle", { count: totalCount, attention: attentionCount })}
      >
        <div className="flex flex-col gap-4">
          <Toolbar
            searchPlaceholder={t("searchPlaceholder")}
            filters={[
              {
                key: "category",
                label: t("categoryFilterLabel"),
                options: MATERIAL_CATEGORIES.map((category) => ({ value: category, label: category })),
              },
            ]}
            primaryAction={
              canWrite ? (
                <Button type="button" onClick={openCreate}>
                  {t("addButton")}
                </Button>
              ) : undefined
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

      <Dialog open={formOpen} onOpenChange={(open) => (open ? setFormOpen(true) : requestClose())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRow ? t("formTitleEdit", { code: editingRow.material_code }) : t("formTitleCreate")}
            </DialogTitle>
          </DialogHeader>

          {!editingRow && <MaterialForm mode="create" onSaved={handleSaved} onDirtyChange={setDirty} onErrorCode={showError} />}

          {editingRow && (
            <MaterialForm
              mode="edit"
              materialId={editingRow.id}
              initial={{
                name: editingRow.name,
                category: editingRow.category as never,
                unit: editingRow.unit as never,
                minimum_level: String(editingRow.minimum_level),
                unit_cost: String(costMap[editingRow.id] ?? 0),
              }}
              currentStock={editingRow.current_stock}
              onSaved={handleSaved}
              onDirtyChange={setDirty}
              onErrorCode={showError}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmingDelete !== null}
        onOpenChange={(open) => !open && setConfirmingDelete(null)}
        title={t("deleteConfirmTitle", { code: confirmingDelete?.material_code ?? "" })}
        body={
          confirmingDelete && confirmingDelete.current_stock > 0
            ? t("deleteConfirmBodyWithStock", { stock: confirmingDelete.current_stock, unit: confirmingDelete.unit })
            : t("deleteConfirmBody")
        }
        confirmLabel={t("deleteConfirmButton")}
        onConfirm={handleDelete}
      />
    </>
  );
}

export { InventoryPageClient };
