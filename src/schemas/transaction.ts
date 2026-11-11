import { z } from "zod";

/** The three types `inventory_transactions.type` allows (design §12.1). */
export const TRANSACTION_TYPES = ["stock_in", "stock_out", "adjustment"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

/** Maps each type onto its `Status` namespace key, same pattern as `JOB_STATUS_KEYS` in `schemas/job.ts`. */
export const TXN_TYPE_KEYS: Record<TransactionType, "txnStockIn" | "txnStockOut" | "txnAdjustment"> = {
  stock_in: "txnStockIn",
  stock_out: "txnStockOut",
  adjustment: "txnAdjustment",
};

const QUANTITY_RE = /^\d+(\.\d{1,4})?$/;

/** Requirement 12.6: required, numeric, greater than zero, at most 4 decimal places. */
function isValidQuantity(value: string): boolean {
  return QUANTITY_RE.test(value.trim()) && Number(value) > 0;
}

/**
 * "Record Stock In" (Requirement 11.3, 12.6, 12.12-12.13, design §12.2).
 * This form is type-aware rather than two separate ones: `type` switches
 * between a plain `stock_in` and the `adjustment` correction path
 * Requirement 11.9 asks for ("the only correction path for a transaction
 * recorded in error"), since a stray ledger row can only be fixed by a
 * second transaction, never an edit. `direction` only applies when
 * `type` is `adjustment` (design §12.2 step 4).
 */
export const StockInSchema = z
  .object({
    material_id: z.string().trim().min(1, { message: "Validation.materialRequired" }),
    type: z.enum(["stock_in", "adjustment"]),
    direction: z.enum(["1", "-1"]).optional(),
    quantity: z
      .string()
      .trim()
      .min(1, { message: "Validation.quantityRequired" })
      .refine(isValidQuantity, { message: "Validation.quantityInvalid" }),
    reason: z.string().trim().min(1, { message: "Validation.reasonRequired" }).max(300),
  })
  .superRefine((values, ctx) => {
    if (values.type === "adjustment" && !values.direction) {
      ctx.addIssue({ code: "custom", path: ["direction"], message: "Validation.directionRequired" });
    }
  });

export type StockInFormValues = z.infer<typeof StockInSchema>;

/**
 * "Record Stock Out" (Requirement 11.3, 12.6-12.7, 12.13). Whether
 * `job_id` is required depends on the signed-in role — a worker must
 * name the job (design §12.2 step 6), staff need not — and that depends
 * on who is signed in, not on anything this file can know on its own, so
 * the component builds the schema with this factory rather than a fixed
 * export. `job_id`'s shape (optional on the base object, enforced by
 * `superRefine` instead of a conditional field type) keeps every call's
 * inferred type identical, which is what lets `StockOutFormValues` below
 * stay a single fixed type for `useForm`.
 */
export function buildStockOutSchema(jobRequired: boolean) {
  return z
    .object({
      material_id: z.string().trim().min(1, { message: "Validation.materialRequired" }),
      quantity: z
        .string()
        .trim()
        .min(1, { message: "Validation.quantityRequired" })
        .refine(isValidQuantity, { message: "Validation.quantityInvalid" }),
      job_id: z.string().trim().optional().or(z.literal("")),
      reason: z.string().trim().max(300).optional().or(z.literal("")),
    })
    .superRefine((values, ctx) => {
      if (jobRequired && !values.job_id) {
        ctx.addIssue({ code: "custom", path: ["job_id"], message: "Validation.jobRequired" });
      }
    });
}

export type StockOutFormValues = {
  material_id: string;
  quantity: string;
  job_id?: string;
  reason?: string;
};
