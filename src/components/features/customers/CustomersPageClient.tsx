"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Pencil, Trash2, UsersRound } from "lucide-react";

import { SectionCard } from "@/components/patterns/SectionCard";
import { Toolbar } from "@/components/patterns/Toolbar";
import { DataTable, type DataTableColumn } from "@/components/patterns/DataTable";
import { EmptyState } from "@/components/patterns/EmptyState";
import { ConfirmDialog } from "@/components/patterns/ConfirmDialog";
import { showUndoToast } from "@/components/patterns/UndoToast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CustomerForm } from "@/components/features/customers/CustomerForm";
import { softDeleteCustomer, restoreCustomer } from "@/actions/customers";
import { PAGE_SIZE } from "@/lib/constants";
import { errorCodeToKey, type ErrorCode } from "@/lib/errors";
import type { CustomerRow } from "@/lib/queries/customers";

function CustomersPageClient({
  rows,
  page,
  pageCount,
  totalCount,
  q,
}: {
  rows: CustomerRow[];
  page: number;
  pageCount: number;
  totalCount: number;
  q: string;
}) {
  const t = useTranslations("Customers");
  const tCommon = useTranslations("Common");
  const tErrors = useTranslations("Errors");
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerRow | undefined>(undefined);
  const [dirty, setDirty] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState<CustomerRow | null>(null);

  function showError(code: ErrorCode) {
    toast.error(tErrors(errorCodeToKey(code) as never));
  }

  function openCreate() {
    setEditing(undefined);
    setFormOpen(true);
  }

  function openEdit(row: CustomerRow) {
    setEditing(row);
    setFormOpen(true);
  }

  function requestClose() {
    if (dirty && !window.confirm(`${tCommon("unsavedChangesTitle")}\n${tCommon("unsavedChangesBody")}`)) {
      return;
    }
    setDirty(false);
    setFormOpen(false);
  }

  function handleSaved(row: CustomerRow) {
    setFormOpen(false);
    setDirty(false);
    toast.success(editing ? t("updateSuccessToast", { name: row.name }) : t("createSuccessToast", { name: row.name }));
    router.refresh();
  }

  function handleDelete() {
    const row = confirmingDelete;
    if (!row) return;
    setConfirmingDelete(null);
    startTransition(async () => {
      const result = await softDeleteCustomer(row.id);
      if (!result.ok) {
        showError(result.code);
        return;
      }
      router.refresh();
      showUndoToast({
        message: t("deleteSuccessToast", { name: row.name }),
        onUndo: () => {
          startTransition(async () => {
            const restoreResult = await restoreCustomer(row.id);
            if (restoreResult.ok) {
              toast.success(t("restoreSuccessToast", { name: row.name }));
              router.refresh();
            } else {
              showError(restoreResult.code);
            }
          });
        },
      });
    });
  }

  const columns: DataTableColumn<CustomerRow>[] = [
    { key: "name", header: t("colName"), priority: "primary", scopeRow: true, cell: (row) => row.name },
    { key: "phone", header: t("colPhone"), priority: "secondary", cell: (row) => row.phone ?? "—" },
    { key: "address", header: t("colAddress"), priority: "detail", cell: (row) => row.address ?? "—" },
    {
      key: "actions",
      header: t("colActions"),
      cell: (row) => (
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("viewAction", { name: row.name })}
            onClick={() => openEdit(row)}
          >
            <Pencil className="size-4" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("deleteAction", { name: row.name })}
            onClick={() => setConfirmingDelete(row)}
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        </div>
      ),
    },
  ];

  const emptyState = (
    <EmptyState
      icon={UsersRound}
      title={t("emptyTitle")}
      body={q ? t("emptyBodyQuery", { query: q }) : t("emptyBodyNoQuery")}
      action={
        q ? (
          <Button type="button" variant="outline" onClick={() => router.push("/customers")}>
            {tCommon("clearFilters")}
          </Button>
        ) : (
          <Button type="button" onClick={openCreate}>
            {t("addButton")}
          </Button>
        )
      }
    />
  );

  return (
    <>
      <SectionCard
        title={t("cardTitle")}
        subtitle={`${tCommon("recordCount", { count: totalCount })} · ${tCommon("updatedRelative", { when: tCommon("justNow") })}`}
      >
        <div className="flex flex-col gap-4">
          <Toolbar
            searchPlaceholder={t("searchPlaceholder")}
            primaryAction={
              <Button type="button" onClick={openCreate}>
                {t("addButton")}
              </Button>
            }
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
            <DialogTitle>{editing ? t("formTitleEdit") : t("formTitleCreate")}</DialogTitle>
          </DialogHeader>
          <CustomerForm customer={editing} onSaved={handleSaved} onDirtyChange={setDirty} onErrorCode={showError} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmingDelete !== null}
        onOpenChange={(open) => !open && setConfirmingDelete(null)}
        title={t("deleteConfirmTitle", { name: confirmingDelete?.name ?? "" })}
        body={t("deleteConfirmBody")}
        confirmLabel={t("deleteConfirmButton")}
        onConfirm={handleDelete}
      />
    </>
  );
}

export { CustomersPageClient };
