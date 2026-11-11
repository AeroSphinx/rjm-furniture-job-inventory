"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateJobStatusAction, type UpdateStatusResult } from "@/actions/jobs";
import { JOB_STATUSES, JOB_STATUS_KEYS, type JobStatus } from "@/schemas/job";
import type { ErrorCode } from "@/lib/errors";

/**
 * The carpenter's one editable control (Requirement 9.8, 3.4, 3.6, 3.7):
 * no other field is rendered, and the form states the restriction in
 * plain words rather than only disabling the rest of a full form. Used
 * both from the Job Orders list's Edit action and from the job detail
 * page's "Update status" button, so a worker sees the identical control
 * in both places.
 */
function JobStatusForm({
  jobId,
  currentStatus,
  disabledReason,
  onSaved,
  onErrorCode,
}: {
  jobId: string;
  currentStatus: JobStatus;
  /** Set when the job is not assigned to this worker, or is already completed (Requirement 3.7, 20.4). */
  disabledReason?: string;
  onSaved: (result: UpdateStatusResult) => void;
  onErrorCode?: (code: ErrorCode) => void;
}) {
  const t = useTranslations("Jobs");
  const tStatus = useTranslations("Status");
  const [status, setStatus] = useState<JobStatus>(currentStatus);
  const [pending, setPending] = useState(false);
  const disabled = Boolean(disabledReason);

  async function handleSave() {
    setPending(true);
    const result = await updateJobStatusAction(jobId, { status });
    setPending(false);
    if (result.ok) {
      onSaved(result.data);
    } else {
      onErrorCode?.(result.code);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">{t("workerStatusOnlyNote")}</p>

      {disabledReason && (
        <p role="alert" className="rounded-md border border-warning bg-warning-surface p-3 text-sm text-warning-text">
          {disabledReason}
        </p>
      )}

      <Select value={status} onValueChange={(v) => setStatus(v as JobStatus)} disabled={disabled}>
        <SelectTrigger aria-label={t("statusLabel")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {JOB_STATUSES.map((value) => (
            <SelectItem key={value} value={value}>
              {tStatus(JOB_STATUS_KEYS[value])}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex justify-end">
        <Button type="button" onClick={handleSave} disabled={disabled || pending}>
          {t("saveButton")}
        </Button>
      </div>
    </div>
  );
}

export { JobStatusForm };
