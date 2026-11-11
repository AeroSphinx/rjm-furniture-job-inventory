"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/patterns/ConfirmDialog";
import { showUndoToast } from "@/components/patterns/UndoToast";
import { JobForm } from "@/components/features/jobs/JobForm";
import { JobStatusForm } from "@/components/features/jobs/JobStatusForm";
import { softDeleteJob, restoreJob } from "@/actions/jobs";
import { errorCodeToKey, type ErrorCode } from "@/lib/errors";
import { JOB_STATUS_KEYS, type JobStatus } from "@/schemas/job";
import type { JobDetailRow } from "@/lib/queries/jobs";
import type { AssignableProfile } from "@/lib/queries/profiles";
import type { Role } from "@/components/layout/Sidebar";

/**
 * The job detail page's one primary action, "Update status" (design §20),
 * plus the staff-only delete control. A worker gets the same
 * `JobStatusForm` the list's Edit action opens — same component, same
 * restriction copy, so there is exactly one place that renders a
 * worker's status control.
 */
function JobDetailClient({
  job,
  role,
  currentUserId,
  customers,
  workers,
  quotedPrice,
}: {
  job: JobDetailRow;
  role: Role;
  currentUserId: string;
  customers: { id: string; name: string }[];
  workers: AssignableProfile[];
  quotedPrice?: number;
}) {
  const t = useTranslations("Jobs");
  const tDetail = useTranslations("JobDetail");
  const tStatus = useTranslations("Status");
  const tErrors = useTranslations("Errors");
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function showError(code: ErrorCode) {
    toast.error(tErrors(errorCodeToKey(code) as never));
  }

  function workerDisabledReason(): string | undefined {
    if (job.assigned_to !== currentUserId) return tErrors("jobNotAssigned");
    if (job.status === "completed") return tErrors("jobCompleted");
    return undefined;
  }

  function handleStatusChanged(oldStatus: string, newStatus: string) {
    setFormOpen(false);
    toast.success(
      t("statusChangeToast", {
        code: job.job_code,
        oldStatus: tStatus(JOB_STATUS_KEYS[oldStatus as JobStatus] ?? "jobPending"),
        newStatus: tStatus(JOB_STATUS_KEYS[newStatus as JobStatus] ?? "jobPending"),
      }),
    );
    router.refresh();
  }

  function handleUpdated(result: { job_code: string; old_status?: string; new_status?: string }) {
    setFormOpen(false);
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

  function handleDelete() {
    setConfirmingDelete(false);
    startTransition(async () => {
      const result = await softDeleteJob(job.id);
      if (!result.ok) {
        showError(result.code);
        return;
      }
      showUndoToast({
        message: t("deleteSuccessToast", { code: job.job_code }),
        onUndo: () => {
          startTransition(async () => {
            const restoreResult = await restoreJob(job.id);
            if (restoreResult.ok) {
              toast.success(t("restoreSuccessToast", { code: job.job_code }));
              router.refresh();
            } else {
              showError(restoreResult.code);
            }
          });
        },
      });
      router.push("/jobs");
    });
  }

  return (
    <>
      <div className="flex gap-2">
        <Button type="button" onClick={() => setFormOpen(true)}>
          {tDetail("updateStatusButton")}
        </Button>
        {role !== "worker" && (
          <Button type="button" variant="outline" onClick={() => setConfirmingDelete(true)}>
            <Trash2 className="size-4" aria-hidden />
            {t("deleteConfirmButton")}
          </Button>
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {role === "worker" ? tDetail("updateStatusButton") : t("formTitleEdit", { code: job.job_code })}
            </DialogTitle>
          </DialogHeader>

          {role === "worker" ? (
            <JobStatusForm
              jobId={job.id}
              currentStatus={job.status}
              disabledReason={workerDisabledReason()}
              onSaved={(result) => handleStatusChanged(result.old_status, result.new_status)}
              onErrorCode={showError}
            />
          ) : (
            <JobForm
              mode="edit"
              jobId={job.id}
              initial={{
                customer_id: job.customer_id,
                project_name: job.project_name,
                description: job.description ?? "",
                order_date: job.order_date,
                expected_completion: job.expected_completion ?? "",
                assigned_to: job.assigned_to ?? "",
                status: job.status,
                quoted_price: quotedPrice !== undefined ? String(quotedPrice) : "",
              }}
              customers={customers}
              workers={workers}
              onSaved={(result) => handleUpdated(result as { job_code: string; old_status?: string; new_status?: string })}
              onErrorCode={showError}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        title={t("deleteConfirmTitle", { code: job.job_code })}
        body={t("deleteConfirmBody")}
        confirmLabel={t("deleteConfirmButton")}
        onConfirm={handleDelete}
      />
    </>
  );
}

export { JobDetailClient };
