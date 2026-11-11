"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField } from "@/components/patterns/FormField";
import { MaterialSchema, MATERIAL_CATEGORIES, MATERIAL_UNITS, type MaterialFormValues } from "@/schemas/material";
import { upsertMaterialAction, type UpsertMaterialResult } from "@/actions/materials";
import type { ErrorCode } from "@/lib/errors";

const EMPTY_VALUES: MaterialFormValues = {
  name: "",
  category: MATERIAL_CATEGORIES[0],
  unit: MATERIAL_UNITS[0],
  minimum_level: "",
  unit_cost: "0",
  opening_stock: "",
};

type MaterialFormProps = {
  mode: "create" | "edit";
  materialId?: string;
  initial?: Partial<MaterialFormValues>;
  currentStock?: number;
  onSaved: (result: UpsertMaterialResult) => void;
  onDirtyChange?: (dirty: boolean) => void;
  onErrorCode?: (code: ErrorCode) => void;
};

/**
 * The material create/edit form (Requirement 10.6-10.8, design §13.3).
 * Six fields at most, so it stays a plain form like `CustomerForm`
 * rather than `StepForm` (Requirement 9.7's "more than six fields"
 * threshold does not apply here). Calls `upsert_material()` — never
 * re-implements the code generation or the required-unit-cost check
 * that RPC already owns. Opening stock is honoured on create only
 * (design §13.3), so it is hidden on edit in favour of a read-only
 * current-stock line with the Requirement 10.8 helper text.
 */
function MaterialForm({ mode, materialId, initial, currentStock, onSaved, onDirtyChange, onErrorCode }: MaterialFormProps) {
  const t = useTranslations("Materials");
  // Root-scoped: zod's issue messages are already full dotted keys, same reasoning as `CustomerForm`.
  const tRoot = useTranslations();
  const [pending, setPending] = useState(false);

  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(MaterialSchema),
    defaultValues: { ...EMPTY_VALUES, ...initial },
  });
  const values = form.watch();

  async function onSubmit(data: MaterialFormValues) {
    setPending(true);
    const result = await upsertMaterialAction(data, materialId);
    setPending(false);

    if (result.ok) {
      onDirtyChange?.(false);
      onSaved(result.data);
    } else if (result.code !== "VALIDATION") {
      onErrorCode?.(result.code);
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      onChange={() => onDirtyChange?.(form.formState.isDirty)}
      className="flex flex-col gap-4"
    >
      <FormField
        name="name"
        label={t("nameLabel")}
        required
        error={form.formState.errors.name?.message ? tRoot(form.formState.errors.name.message as never) : undefined}
      >
        {(props) => <Input {...props} {...form.register("name")} />}
      </FormField>

      <FormField
        name="category"
        label={t("categoryLabel")}
        required
        error={form.formState.errors.category?.message ? tRoot(form.formState.errors.category.message as never) : undefined}
      >
        {(props) => (
          <Select value={values.category} onValueChange={(v) => form.setValue("category", v as MaterialFormValues["category"], { shouldDirty: true })}>
            <SelectTrigger {...props}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MATERIAL_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </FormField>

      <FormField
        name="unit"
        label={t("unitLabel")}
        required
        error={form.formState.errors.unit?.message ? tRoot(form.formState.errors.unit.message as never) : undefined}
      >
        {(props) => (
          <Select value={values.unit} onValueChange={(v) => form.setValue("unit", v as MaterialFormValues["unit"], { shouldDirty: true })}>
            <SelectTrigger {...props}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MATERIAL_UNITS.map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {unit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </FormField>

      <FormField
        name="minimum_level"
        label={t("minimumLevelLabel")}
        hint={t("minimumLevelHint")}
        required
        error={
          form.formState.errors.minimum_level?.message
            ? tRoot(form.formState.errors.minimum_level.message as never)
            : undefined
        }
      >
        {(props) => <Input {...props} {...form.register("minimum_level")} type="number" min={0} step="0.0001" />}
      </FormField>

      <FormField
        name="unit_cost"
        label={t("unitCostLabel")}
        hint={t("unitCostHint")}
        required
        error={form.formState.errors.unit_cost?.message ? tRoot(form.formState.errors.unit_cost.message as never) : undefined}
      >
        {(props) => <Input {...props} {...form.register("unit_cost")} type="number" min={0} step="0.01" />}
      </FormField>

      {mode === "create" ? (
        <FormField
          name="opening_stock"
          label={t("openingStockLabel")}
          hint={t("openingStockHint")}
          error={
            form.formState.errors.opening_stock?.message
              ? tRoot(form.formState.errors.opening_stock.message as never)
              : undefined
          }
        >
          {(props) => <Input {...props} {...form.register("opening_stock")} type="number" min={0} step="0.0001" />}
        </FormField>
      ) : (
        <div className="flex flex-col gap-1 rounded-md border border-border bg-muted p-3">
          <p className="text-sm font-medium text-foreground">
            {t("currentStockLabel", { stock: currentStock ?? 0, unit: values.unit })}
          </p>
          <p className="text-xs text-muted-foreground">{t("currentStockHint")}</p>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending}>
          {t("saveButton")}
        </Button>
      </div>
    </form>
  );
}

export { MaterialForm };
