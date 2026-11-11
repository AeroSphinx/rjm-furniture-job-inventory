"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormField } from "@/components/patterns/FormField";
import { StepForm, type FormStep } from "@/components/patterns/StepForm";
import { CustomerForm } from "@/components/features/customers/CustomerForm";
import { JobSchema, JOB_STATUSES, JOB_STATUS_KEYS, type JobFormValues, type JobStatus } from "@/schemas/job";
import { createJobOrder, updateJobOrder, type CreateJobResult, type UpdateJobResult } from "@/actions/jobs";
import type { AssignableProfile } from "@/lib/queries/profiles";
import type { CustomerRow } from "@/lib/queries/customers";
import type { ErrorCode } from "@/lib/errors";

type JobFormProps = {
  mode: "create" | "edit";
  jobId?: string;
  initial?: Partial<JobFormValues>;
  customers: { id: string; name: string }[];
  workers: AssignableProfile[];
  onSaved: (result: CreateJobResult | UpdateJobResult) => void;
  onDirtyChange?: (dirty: boolean) => void;
  onErrorCode?: (code: ErrorCode) => void;
};

const EMPTY_VALUES: JobFormValues = {
  customer_id: "",
  project_name: "",
  description: "",
  order_date: "",
  expected_completion: "",
  assigned_to: "",
  status: "pending",
  quoted_price: "",
};

const STEP_FIELDS: (keyof JobFormValues)[][] = [
  ["customer_id", "project_name", "description"],
  ["order_date", "expected_completion"],
  ["status", "quoted_price"],
];

/**
 * The staff create/edit form (Requirement 9.1-9.9). Eight fields, so it
 * always renders through `StepForm` (Requirement 9.7's "more than six
 * fields" threshold) in three groups. Calls `create_job_order` /
 * `update_job_order` — never re-implements the code generation, the
 * heal-then-retry loop or the staff gate those RPCs own (design §13.1).
 */
function JobForm({ mode, jobId, initial, customers, workers, onSaved, onDirtyChange, onErrorCode }: JobFormProps) {
  const t = useTranslations("Jobs");
  const tStatus = useTranslations("Status");
  // Root-scoped: zod's issue messages are already full dotted keys
  // ("Validation.orderDateTooFar"), same reasoning as `CustomerForm`.
  const tRoot = useTranslations();
  const [pending, setPending] = useState(false);
  const [step, setStep] = useState(0);
  const [pendingFocusField, setPendingFocusField] = useState<keyof JobFormValues | null>(null);
  const [customerOptions, setCustomerOptions] = useState(customers);
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);

  const form = useForm<JobFormValues>({
    resolver: zodResolver(JobSchema),
    shouldUnregister: false,
    defaultValues: { ...EMPTY_VALUES, ...initial },
  });
  const values = form.watch();

  useEffect(() => {
    if (pendingFocusField) {
      form.setFocus(pendingFocusField);
      setPendingFocusField(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, pendingFocusField]);

  async function onValid(data: JobFormValues) {
    setPending(true);
    const result = mode === "create" ? await createJobOrder(data) : await updateJobOrder(jobId as string, data);
    setPending(false);

    if (result.ok) {
      onDirtyChange?.(false);
      onSaved(result.data);
    } else if (result.code !== "VALIDATION") {
      onErrorCode?.(result.code);
    }
  }

  function onInvalid(errors: Record<string, unknown>) {
    const firstField = Object.keys(errors)[0] as keyof JobFormValues | undefined;
    if (!firstField) return;
    const stepIndex = STEP_FIELDS.findIndex((fields) => fields.includes(firstField));
    if (stepIndex >= 0 && stepIndex !== step) {
      setStep(stepIndex);
    }
    setPendingFocusField(firstField);
  }

  function handleSubmit() {
    void form.handleSubmit(onValid, onInvalid)();
  }

  function handleCustomerAdded(row: CustomerRow) {
    setCustomerOptions((prev) => [...prev, { id: row.id, name: row.name }].sort((a, b) => a.name.localeCompare(b.name)));
    form.setValue("customer_id", row.id, { shouldDirty: true });
    setAddCustomerOpen(false);
  }

  const steps: FormStep[] = [
    {
      id: "customer",
      label: t("step1Label"),
      content: (
        <div className="flex flex-col gap-4">
          <FormField
            name="customer_id"
            label={t("customerLabel")}
            required
            error={form.formState.errors.customer_id?.message ? tRoot(form.formState.errors.customer_id.message as never) : undefined}
          >
            {(props) => (
              <Select value={values.customer_id} onValueChange={(v) => form.setValue("customer_id", v, { shouldDirty: true })}>
                <SelectTrigger {...props}>
                  <SelectValue placeholder={t("customerPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {customerOptions.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
          <button
            type="button"
            onClick={() => setAddCustomerOpen(true)}
            className="self-start text-sm font-medium text-orange-700 underline-offset-4 hover:underline"
          >
            {t("addCustomerLink")}
          </button>

          <FormField
            name="project_name"
            label={t("projectNameLabel")}
            required
            error={form.formState.errors.project_name?.message ? tRoot(form.formState.errors.project_name.message as never) : undefined}
          >
            {(props) => <Input {...props} {...form.register("project_name")} />}
          </FormField>

          <FormField name="description" label={t("descriptionLabel")} hint={t("descriptionHint")}>
            {(props) => <Textarea {...props} {...form.register("description")} rows={3} />}
          </FormField>
        </div>
      ),
    },
    {
      id: "schedule",
      label: t("step2Label"),
      content: (
        <div className="flex flex-col gap-4">
          <FormField
            name="order_date"
            label={t("orderDateLabel")}
            required
            error={form.formState.errors.order_date?.message ? tRoot(form.formState.errors.order_date.message as never) : undefined}
          >
            {(props) => <Input {...props} {...form.register("order_date")} type="date" />}
          </FormField>

          <FormField
            name="expected_completion"
            label={t("expectedCompletionLabel")}
            error={
              form.formState.errors.expected_completion?.message
                ? tRoot(form.formState.errors.expected_completion.message as never)
                : undefined
            }
          >
            {(props) => <Input {...props} {...form.register("expected_completion")} type="date" />}
          </FormField>

          <FormField name="assigned_to" label={t("assignedWorkerLabel")}>
            {(props) => (
              <Select
                value={values.assigned_to || "none"}
                onValueChange={(v) => form.setValue("assigned_to", v === "none" ? "" : v, { shouldDirty: true })}
              >
                <SelectTrigger {...props}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("assignedWorkerNone")}</SelectItem>
                  {workers.map((worker) => (
                    <SelectItem key={worker.id} value={worker.id}>
                      {worker.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
        </div>
      ),
    },
    {
      id: "status",
      label: t("step3Label"),
      content: (
        <div className="flex flex-col gap-4">
          <FormField name="status" label={t("statusLabel")} required>
            {(props) => (
              <Select value={values.status} onValueChange={(v) => form.setValue("status", v as JobStatus, { shouldDirty: true })}>
                <SelectTrigger {...props}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JOB_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {tStatus(JOB_STATUS_KEYS[status])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>

          <FormField
            name="quoted_price"
            label={t("quotedPriceLabel")}
            hint={t("quotedPriceHint")}
            error={form.formState.errors.quoted_price?.message ? tRoot(form.formState.errors.quoted_price.message as never) : undefined}
          >
            {(props) => <Input {...props} {...form.register("quoted_price")} type="number" min={0} step="0.01" />}
          </FormField>
        </div>
      ),
    },
  ];

  return (
    <div onChange={() => onDirtyChange?.(form.formState.isDirty)}>
      <StepForm steps={steps} step={step} onStepChange={setStep} onSubmit={handleSubmit} submitLabel={t("saveButton")} />
      {pending && <p className="mt-2 text-sm text-muted-foreground">{t("saveButton")}…</p>}

      <Dialog open={addCustomerOpen} onOpenChange={setAddCustomerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("addCustomerLink")}</DialogTitle>
          </DialogHeader>
          <CustomerForm onSaved={handleCustomerAdded} onErrorCode={onErrorCode} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { JobForm };
