"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/patterns/FormField";
import { StockInSchema, buildStockOutSchema, type StockInFormValues, type StockOutFormValues } from "@/schemas/transaction";
import { recordStockIn, recordStockOut, type StockMovementResult } from "@/actions/transactions";
import type { MaterialOption } from "@/lib/queries/materials";
import type { JobOption } from "@/lib/queries/transactions";
import type { ErrorCode } from "@/lib/errors";

type OnErrorCode = (code: ErrorCode, detail?: Record<string, string | number>) => void;

/**
 * The RPC's return row (design §12.1) carries no quantity or type — only
 * the form that submitted knows those — so the success toast is built
 * here, where both are in scope, and handed up as a plain string
 * (Requirement 12.10: name the material, the quantity and the new stock
 * level).
 */
type OnSaved = (result: StockMovementResult, toastMessage: string) => void;

type SharedProps = {
  materials: MaterialOption[];
  onSaved: OnSaved;
  onDirtyChange?: (dirty: boolean) => void;
  onErrorCode?: OnErrorCode;
};

type StockInProps = SharedProps & {
  /** Pre-selects a material when the form opens from the Low-Stock Alerts screen's "Record stock in" link (Requirement 13.8). */
  defaultMaterialId?: string;
};

/**
 * "Record Stock In" (Requirement 11.3, 12.6, 12.12-12.13). Type-aware
 * between a plain `stock_in` and the `adjustment` correction path
 * (Requirement 11.9 — a wrong transaction can only be fixed by a new
 * one, never an edit). Calls `record_stock_movement` directly (design
 * §12); never re-implements the row lock or the quantity guard the RPC
 * owns.
 */
function StockInForm({ materials, defaultMaterialId, onSaved, onDirtyChange, onErrorCode }: StockInProps) {
  const t = useTranslations("Transactions");
  const tRoot = useTranslations();
  const [pending, setPending] = useState(false);

  const form = useForm<StockInFormValues>({
    resolver: zodResolver(StockInSchema),
    defaultValues: { material_id: defaultMaterialId ?? "", type: "stock_in", direction: undefined, quantity: "", reason: "" },
  });
  const values = form.watch();
  const selectedUnit = materials.find((m) => m.id === values.material_id)?.unit;

  async function onSubmit(data: StockInFormValues) {
    setPending(true);
    const result = await recordStockIn(data);
    setPending(false);

    if (result.ok) {
      onDirtyChange?.(false);
      const message =
        data.type === "adjustment"
          ? t("adjustmentSuccessToast", { material: result.data.material_name, newStock: result.data.new_stock, unit: result.data.unit })
          : t("stockInSuccessToast", {
              material: result.data.material_name,
              quantity: data.quantity,
              unit: result.data.unit,
              newStock: result.data.new_stock,
            });
      onSaved(result.data, message);
    } else if (result.code !== "VALIDATION") {
      onErrorCode?.(result.code, result.detail);
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      onChange={() => onDirtyChange?.(form.formState.isDirty)}
      className="flex flex-col gap-4"
    >
      <FormField name="type" label={t("typeLabel")} hint={t("typeHint")}>
        {(props) => (
          <Select
            value={values.type}
            onValueChange={(v) => form.setValue("type", v as StockInFormValues["type"], { shouldDirty: true })}
          >
            <SelectTrigger {...props}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="stock_in">{t("typeStockIn")}</SelectItem>
              <SelectItem value="adjustment">{t("typeAdjustment")}</SelectItem>
            </SelectContent>
          </Select>
        )}
      </FormField>

      <FormField
        name="material_id"
        label={t("materialLabel")}
        required
        error={form.formState.errors.material_id?.message ? tRoot(form.formState.errors.material_id.message as never) : undefined}
      >
        {(props) => (
          <Select value={values.material_id} onValueChange={(v) => form.setValue("material_id", v, { shouldDirty: true })}>
            <SelectTrigger {...props}>
              <SelectValue placeholder={t("materialPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {materials.map((material) => (
                <SelectItem key={material.id} value={material.id}>
                  {material.material_code} — {material.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </FormField>

      {values.type === "adjustment" && (
        <FormField
          name="direction"
          label={t("directionLabel")}
          required
          error={form.formState.errors.direction?.message ? tRoot(form.formState.errors.direction.message as never) : undefined}
        >
          {(props) => (
            <Select
              value={values.direction ?? ""}
              onValueChange={(v) => form.setValue("direction", v as "1" | "-1", { shouldDirty: true })}
            >
              <SelectTrigger {...props}>
                <SelectValue placeholder={t("directionPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">{t("directionUp")}</SelectItem>
                <SelectItem value="-1">{t("directionDown")}</SelectItem>
              </SelectContent>
            </Select>
          )}
        </FormField>
      )}

      <FormField
        name="quantity"
        label={t("quantityLabel")}
        hint={selectedUnit ? t("quantityUnitHint", { unit: selectedUnit }) : undefined}
        required
        error={form.formState.errors.quantity?.message ? tRoot(form.formState.errors.quantity.message as never) : undefined}
      >
        {(props) => <Input {...props} {...form.register("quantity")} type="number" min={0} step="0.0001" />}
      </FormField>

      <FormField
        name="reason"
        label={t("reasonLabel")}
        hint={t("reasonHintRequired")}
        required
        error={form.formState.errors.reason?.message ? tRoot(form.formState.errors.reason.message as never) : undefined}
      >
        {(props) => <Textarea {...props} {...form.register("reason")} rows={2} />}
      </FormField>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending}>
          {t("saveButtonStockIn")}
        </Button>
      </div>
    </form>
  );
}

/**
 * "Record Stock Out" (Requirement 11.3, 12.6-12.7, 12.13, 20.10). The
 * material select renders an out-of-stock material disabled with a
 * visible explanation (Requirement 12.5); the quantity field is checked
 * against the selected material's available stock before submit
 * (Requirement 20.10) — a basic UX guard, not a re-implementation of the
 * RPC's own authoritative check, which still runs and still wins.
 */
function StockOutForm({
  materials,
  jobs,
  jobRequired,
  onSaved,
  onDirtyChange,
  onErrorCode,
}: SharedProps & { jobs: JobOption[]; jobRequired: boolean }) {
  const t = useTranslations("Transactions");
  const tRoot = useTranslations();
  const [pending, setPending] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);

  const schema = useMemo(() => buildStockOutSchema(jobRequired), [jobRequired]);
  const form = useForm<StockOutFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { material_id: "", quantity: "", job_id: "", reason: "" },
  });
  const values = form.watch();
  const selectedMaterial = materials.find((m) => m.id === values.material_id);

  async function onSubmit(data: StockOutFormValues) {
    setStockError(null);
    const material = materials.find((m) => m.id === data.material_id);
    if (material && Number(data.quantity) > material.current_stock) {
      setStockError(t("quantityExceedsStock", { available: material.current_stock, unit: material.unit }));
      return;
    }

    setPending(true);
    const result = await recordStockOut(data, jobRequired);
    setPending(false);

    if (result.ok) {
      onDirtyChange?.(false);
      const message = t("stockOutSuccessToast", {
        material: result.data.material_name,
        quantity: data.quantity,
        unit: result.data.unit,
        newStock: result.data.new_stock,
      });
      onSaved(result.data, message);
    } else if (result.code !== "VALIDATION") {
      onErrorCode?.(result.code, result.detail);
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      onChange={() => {
        onDirtyChange?.(form.formState.isDirty);
        setStockError(null);
      }}
      className="flex flex-col gap-4"
    >
      <FormField
        name="material_id"
        label={t("materialLabel")}
        hint={t("outOfStockHint")}
        required
        error={form.formState.errors.material_id?.message ? tRoot(form.formState.errors.material_id.message as never) : undefined}
      >
        {(props) => (
          <Select value={values.material_id} onValueChange={(v) => form.setValue("material_id", v, { shouldDirty: true })}>
            <SelectTrigger {...props}>
              <SelectValue placeholder={t("materialPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {materials.map((material) => (
                <SelectItem key={material.id} value={material.id} disabled={material.current_stock === 0}>
                  {material.material_code} — {material.name}
                  {material.current_stock === 0 ? ` (${t("outOfStockBadge")})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </FormField>

      <FormField
        name="quantity"
        label={t("quantityLabel")}
        hint={selectedMaterial ? t("quantityAvailableHint", { available: selectedMaterial.current_stock, unit: selectedMaterial.unit }) : undefined}
        required
        error={
          stockError ??
          (form.formState.errors.quantity?.message ? tRoot(form.formState.errors.quantity.message as never) : undefined)
        }
      >
        {(props) => <Input {...props} {...form.register("quantity")} type="number" min={0} step="0.0001" />}
      </FormField>

      <FormField
        name="job_id"
        label={t("jobLabel")}
        required={jobRequired}
        error={form.formState.errors.job_id?.message ? tRoot(form.formState.errors.job_id.message as never) : undefined}
      >
        {(props) => (
          <Select
            value={values.job_id || "none"}
            onValueChange={(v) => form.setValue("job_id", v === "none" ? "" : v, { shouldDirty: true })}
          >
            <SelectTrigger {...props}>
              <SelectValue placeholder={t("jobPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {!jobRequired && <SelectItem value="none">{t("jobNone")}</SelectItem>}
              {jobs.map((job) => (
                <SelectItem key={job.id} value={job.id}>
                  {job.job_code} — {job.project_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </FormField>

      <FormField name="reason" label={t("reasonLabel")} hint={t("reasonHintOptional")}>
        {(props) => <Textarea {...props} {...form.register("reason")} rows={2} />}
      </FormField>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending}>
          {t("saveButtonStockOut")}
        </Button>
      </div>
    </form>
  );
}

type StockMovementFormProps = {
  mode: "stock_in" | "stock_out";
  materials: MaterialOption[];
  jobs?: JobOption[];
  jobRequired?: boolean;
  defaultMaterialId?: string;
  onSaved: OnSaved;
  onDirtyChange?: (dirty: boolean) => void;
  onErrorCode?: OnErrorCode;
};

/**
 * The dialog body behind both "+ Record Stock In" (staff) and "Record
 * Stock Out" (every role) — one component, switched by `mode`, rather
 * than two unrelated forms, since both call the same RPC and share the
 * material picker (design §20, Requirement 4.4).
 */
function StockMovementForm({ mode, materials, jobs = [], jobRequired = false, defaultMaterialId, onSaved, onDirtyChange, onErrorCode }: StockMovementFormProps) {
  if (mode === "stock_in") {
    return (
      <StockInForm
        materials={materials}
        defaultMaterialId={defaultMaterialId}
        onSaved={onSaved}
        onDirtyChange={onDirtyChange}
        onErrorCode={onErrorCode}
      />
    );
  }
  return (
    <StockOutForm
      materials={materials}
      jobs={jobs}
      jobRequired={jobRequired}
      onSaved={onSaved}
      onDirtyChange={onDirtyChange}
      onErrorCode={onErrorCode}
    />
  );
}

export { StockMovementForm };
