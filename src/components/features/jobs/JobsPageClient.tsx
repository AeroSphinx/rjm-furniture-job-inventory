"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ClipboardList, Eye, Pencil, Trash2 } from "lucide-react";

import { SectionCard } from "@/components/patterns/SectionCard";
import { Toolbar } from "@/components/patterns/Toolbar";
import { DataTable, type DataTableColumn } from "@/components/patterns/DataTable";
import { EmptyState } from "@/components/patterns/EmptyState";
import { StatusBadge } from "@/components/patterns/StatusBadge";
import { ConfirmDialog } from "@/components/patterns/ConfirmDialog";
import { showUndoToast } from "@/components/patterns/UndoToast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { JobForm } from "@/components/features/jobs/JobForm";
import { JobStatusForm } from "@/components/features/jobs/JobStatusForm";
import { softDeleteJob, restoreJob } from "@/actions/jobs";
import { formatDate } from "@/lib/format";
import { PAGE_SIZE } from "@/lib/constants";
import { errorCodeToKey, type ErrorCode } from "@/lib/errors";
import { JOB_STATUSES, JOB_STATUS_KEYS, type JobStatus } from "@/schemas/job";
import type { JobListRow } from "@/lib/queries/jobs";
import type { AssignableProfile } from "@/lib/queries/profiles";
import type { Role } from "@/components/layout/Sidebar";

function JobsPageClient({
  rows,
  page,
  pageCount,
  totalCount,
  q,
  role,
  currentUserId,
  customers,
  workers,
}: {
  rows: JobListRow[];
  page: number;
  pageCount: number;
  totalCount: number;
  q: string;
  role: Role;
  currentUserId: string;
  customers: { id: string; name: string }[];
  workers: AssignableProfile[];
}) {
  const t = useTranslations("Jobs");
  const tCommon = useTranslations("Common");
  const tStatus = useTranslations("Status");
  const tErrors = useTranslations("Errors");
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [formOpen, setFormOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<JobListRow | null>(null);
  const [dirty, setDirty] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState<JobListRow | null>(null);

  function showError(code: ErrorCode) {
    toast.error(tErrors(errorCodeToKey(code) as never));
  }

  function openCreate() {
    setEditingRow(null);
    setFormOpen(true);
  }

  function openEdit(row: JobListRow) {
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

  function handleCreated(code: string) {
    setFormOpen(false);
    setDirty(false);
    toast.success(t("createSuccessToast", { code }));
    router.refresh();
  }

  function handleUpdated(result: { job_code: string; old_status?: string; new_status?: string }) {
    setFormOpen(false);
    setDirty(false);
    if (result.old_status && result.new_status && result.old_status !== result.new_status) {
      toast.success(
        t("statusChangeToast", {
          code: result.job_code,
          oldStatus: tStatus(JOB_STATUS_KEYS[result.old_status as JobStatus] ?? "jobPending"),
          newStatus: tStatus(JOB_STATUS_KEYS[result.new_status as JobStatus] ?? "jobPending"),
        }),
      );
    } else {
      toast.success(t("updateSuccessToast", { code: result.job_code }));
    }
    router.refresh();
  }

  function handleStatusChanged(code: string, oldStatus: string, newStatus: string) {
    setFormOpen(false);
    toast.success(
      t("statusChangeToast", {
        code,
        oldStatus: tStatus(JOB_STATUS_KEYS[oldStatus as JobStatus] ?? "jobPending"),
        newStatus: tStatus(JOB_STATUS_KEYS[newStatus as JobStatus] ?? "jobPending"),
      }),
    );
    router.refresh();
  }

  function handleDelete() {
    const row = confirmingDelete;
    if (!row) return;
    setConfirmingDelete(null);
    startTransition(async () => {
      const result = await softDeleteJob(row.id);
      if (!result.ok) {
        showError(result.code);
        return;
      }
      router.refresh();
      showUndoToast({
        message: t("deleteSuccessToast", { code: row.job_code }),
        onUndo: () => {
          startTransition(async () => {
            const restoreResult = await restoreJob(row.id);
            if (restoreResult.ok) {
              toast.success(t("restoreSuccessToast", { code: row.job_code }));
              router.refresh();
            } else {
              showError(restoreResult.code);
            }
          });
        },
      });
    });
  }

  function workerDisabledReason(row: JobListRow): string | undefined {
    if (row.assigned_to !== currentUserId) return tErrors("jobNotAssigned");
    if (row.status === "completed") return tErrors("jobCompleted");
    return undefined;
  }

  const columns: DataTableColumn<JobListRow>[] = [
    {
      key: "job_code",
      header: t("colJobOrderId"),
      priority: "primary",
      scopeRow: true,
      cell: (row) => (
        <Link href={`/jobs/${row.id}`} className="font-medium text-orange-700 underline-offset-4 hover:underline">
          {row.job_code}
        </Link>
      ),
    },
    { key: "customer_name", header: t("colCustomerName"), priority: "primary", cell: (row) => row.customer_name },
    { key: "project_name", header: t("colProjectName"), priority: "secondary", cell: (row) => row.project_name },
    { key: "order_date", header: t("colOrderDate"), priority: "detail", cell: (row) => formatDate(row.order_date) },
    {
      key: "expected_completion",
      header: t("colExpectedCompletion"),
      priority: "secondary",
      cell: (row) => (row.expected_completion ? formatDate(row.expected_completion) : t("noExpectedCompletion")),
    },
    {
      key: "assigned_name",
      header: t("colAssignedWorker"),
      priority: "detail",
      cell: (row) => row.assigned_name ?? tCommon("unassigned"),
    },
    {
      key: "status",
      header: t("colJobStatus"),
      priority: "primary",
      cell: (row) => <StatusBadge kind="job" value={row.status} label={tStatus(JOB_STATUS_KEYS[row.status])} />,
    },
    {
      key: "actions",
      header: t("colActions"),
      cell: (row) => (
        <div className="flex gap-1">
          <Button type="button" variant="ghost" size="icon" aria-label={t("viewAction", { code: row.job_code })} asChild>
            <Link href={`/jobs/${row.id}`}>
              <Eye className="size-4" aria-hidden />
              <span className="icon-btn-label">{tCommon("view")}</span>
            </Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("editAction", { code: row.job_code })}
            onClick={() => openEdit(row)}
          >
            <Pencil className="size-4" aria-hidden />
            <span className="icon-btn-label">{tCommon("edit")}</span>
          </Button>
          {role !== "worker" && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("deleteAction", { code: row.job_code })}
              onClick={() => setConfirmingDelete(row)}
            >
              <Trash2 className="size-4" aria-hidden />
              <span className="icon-btn-label">{tCommon("delete")}</span>
            </Button>
          )}
        </div>
      ),
    },
  ];

  const emptyState = (
    <EmptyState
      icon={ClipboardList}
      title={t("emptyTitle")}
      body={q ? t("emptyBodyQuery", { query: q }) : t("emptyBodyNoQuery")}
      action={
        q ? (
          <Button type="button" variant="outline" onClick={() => router.push("/jobs")}>
            {tCommon("clearFilters")}
          </Button>
        ) : role !== "worker" ? (
          <Button type="button" onClick={openCreate}>
            {t("addButton")}
          </Button>
        ) : undefined
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
            filters={[
              {
                key: "status",
                label: t("statusFilterLabel"),
                options: JOB_STATUSES.map((status) => ({ value: status, label: tStatus(JOB_STATUS_KEYS[status]) })),
              },
            ]}
            primaryAction={
              role !== "worker" ? (
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
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingRow ? t("formTitleEdit", { code: editingRow.job_code }) : t("formTitleCreate")}
            </DialogTitle>
          </DialogHeader>

          {!editingRow && (
            <JobForm
              mode="create"
              customers={customers}
              workers={workers}
              onSaved={(result) => handleCreated((result as { job_code: string }).job_code)}
              onDirtyChange={setDirty}
              onErrorCode={showError}
            />
          )}

          {editingRow && role === "worker" && (
            <JobStatusForm
              jobId={editingRow.id}
              currentStatus={editingRow.status}
              disabledReason={workerDisabledReason(editingRow)}
              onSaved={(result) => handleStatusChanged(editingRow.job_code, result.old_status, result.new_status)}
              onErrorCode={showError}
            />
          )}

          {editingRow && role !== "worker" && (
            <JobForm
              mode="edit"
              jobId={editingRow.id}
              initial={{
                customer_id: editingRow.customer_id,
                project_name: editingRow.project_name,
                description: editingRow.description ?? "",
                order_date: editingRow.order_date,
                expected_completion: editingRow.expected_completion ?? "",
                assigned_to: editingRow.assigned_to ?? "",
                status: editingRow.status,
                quoted_price: editingRow.quotedPrice !== undefined ? String(editingRow.quotedPrice) : "",
              }}
              customers={customers}
              workers={workers}
              onSaved={(result) => handleUpdated(result as { job_code: string; old_status?: string; new_status?: string })}
              onDirtyChange={setDirty}
              onErrorCode={showError}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmingDelete !== null}
        onOpenChange={(open) => !open && setConfirmingDelete(null)}
        title={t("deleteConfirmTitle", { code: confirmingDelete?.job_code ?? "" })}
        body={t("deleteConfirmBody")}
        confirmLabel={t("deleteConfirmButton")}
        onConfirm={handleDelete}
      />
    </>
  );
}

export { JobsPageClient };
