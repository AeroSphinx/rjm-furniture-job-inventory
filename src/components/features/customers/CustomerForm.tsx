"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/patterns/FormField";
import { CustomerSchema, type CustomerFormValues } from "@/schemas/customer";
import { createCustomer, updateCustomer, checkDuplicateCustomer } from "@/actions/customers";
import type { CustomerRow } from "@/lib/queries/customers";
import type { ErrorCode } from "@/lib/errors";

const EMPTY_VALUES: CustomerFormValues = { name: "", phone: "", address: "", notes: "" };

/**
 * Create/edit dialog body for `/customers` (Requirement 9.10) and for the
 * job form's inline "+ Add a new customer" flow (Requirement 9.1). On
 * create, checks for a possible duplicate (Requirement 9.11) before
 * saving and offers to use the existing record instead of a blocking
 * error. Non-field failures (for example `NOT_PERMITTED`) are handed back
 * to the caller via `onErrorCode`, which owns the toast — this form only
 * renders field-level and duplicate-warning states.
 */
function CustomerForm({
  customer,
  onSaved,
  onDirtyChange,
  onErrorCode,
}: {
  customer?: CustomerRow;
  onSaved: (row: CustomerRow) => void;
  onDirtyChange?: (dirty: boolean) => void;
  onErrorCode?: (code: ErrorCode) => void;
}) {
  const t = useTranslations("Customers");
  // Root-scoped (no namespace): zod's own validation messages are already
  // full dotted keys like "Validation.nameTooShort" (design §3.3 — "error
  // messages are i18n keys, not sentences"), so they translate directly
  // through the root translator rather than a per-field lookup table.
  const tRoot = useTranslations();
  const [pending, setPending] = useState(false);
  const [duplicate, setDuplicate] = useState<CustomerRow | null>(null);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(CustomerSchema),
    defaultValues: customer
      ? { name: customer.name, phone: customer.phone ?? "", address: customer.address ?? "", notes: customer.notes ?? "" }
      : EMPTY_VALUES,
  });

  async function onSubmit(values: CustomerFormValues, skipDuplicateCheck = false) {
    setDuplicate(null);

    if (!customer && !skipDuplicateCheck && values.phone) {
      const existing = await checkDuplicateCustomer(values.name, values.phone);
      if (existing) {
        setDuplicate(existing);
        return;
      }
    }

    setPending(true);
    const result = customer ? await updateCustomer(customer.id, values) : await createCustomer(values);
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
      onSubmit={form.handleSubmit((values) => onSubmit(values))}
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
        name="phone"
        label={t("phoneLabel")}
        hint={t("phoneHint")}
        error={form.formState.errors.phone?.message ? tRoot(form.formState.errors.phone.message as never) : undefined}
      >
        {(props) => <Input {...props} {...form.register("phone")} type="tel" />}
      </FormField>

      <FormField name="address" label={t("addressLabel")}>
        {(props) => <Textarea {...props} {...form.register("address")} rows={2} />}
      </FormField>

      <FormField name="notes" label={t("notesLabel")}>
        {(props) => <Textarea {...props} {...form.register("notes")} rows={2} />}
      </FormField>

      {duplicate && (
        <div role="alert" className="flex flex-col gap-3 rounded-md border border-warning bg-warning-surface p-3">
          <p className="text-sm text-warning-text">{t("duplicateWarning", { name: duplicate.name })}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => {
                onDirtyChange?.(false);
                onSaved(duplicate);
              }}
            >
              {t("useDuplicateButton")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="default"
              onClick={() => {
                setDuplicate(null);
                form.handleSubmit((values) => onSubmit(values, true))();
              }}
            >
              {t("addAnywayButton")}
            </Button>
          </div>
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

export { CustomerForm };
