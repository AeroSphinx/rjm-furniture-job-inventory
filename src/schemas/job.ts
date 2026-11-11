import { z } from "zod";

/** The four statuses `jobs.status` allows (design §7.2), in the order every select renders them. */
export const JOB_STATUSES = ["pending", "in_progress", "on_hold", "completed"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

/** Maps each status onto its `Status` namespace key (messages/*.json), so every screen looks the label up the same way. */
export const JOB_STATUS_KEYS: Record<JobStatus, "jobPending" | "jobInProgress" | "jobOnHold" | "jobCompleted"> = {
  pending: "jobPending",
  in_progress: "jobInProgress",
  on_hold: "jobOnHold",
  completed: "jobCompleted",
};

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * The staff create/edit form (Requirement 9.1, 9.4). Dates are plain
 * `yyyy-mm-dd` strings — what an `<input type="date">` produces — so the
 * schema works identically on the client (`zodResolver`) and on the
 * server action's `safeParse` without a `Date` object crossing the wire.
 * `quoted_price` and `assigned_to` are optional: an empty string from the
 * form means "not set," which the action turns into `null` for the RPC.
 */
export const JobSchema = z
  .object({
    customer_id: z.string().trim().min(1, { message: "Validation.customerRequired" }),
    project_name: z.string().trim().min(2, { message: "Validation.projectNameTooShort" }).max(120),
    description: z.string().trim().max(2000).optional().or(z.literal("")),
    order_date: z.string().trim().min(1, { message: "Validation.orderDateRequired" }),
    expected_completion: z.string().trim().optional().or(z.literal("")),
    assigned_to: z.string().trim().optional().or(z.literal("")),
    status: z.enum(JOB_STATUSES),
    quoted_price: z.string().trim().optional().or(z.literal("")),
  })
  .superRefine((values, ctx) => {
    const orderDate = new Date(values.order_date);
    if (Number.isNaN(orderDate.getTime())) {
      ctx.addIssue({ code: "custom", path: ["order_date"], message: "Validation.orderDateRequired" });
    } else if (orderDate.getTime() - Date.now() > ONE_YEAR_MS) {
      ctx.addIssue({ code: "custom", path: ["order_date"], message: "Validation.orderDateTooFar" });
    }

    if (values.expected_completion) {
      const expected = new Date(values.expected_completion);
      if (Number.isNaN(expected.getTime()) || expected.getTime() < orderDate.getTime()) {
        ctx.addIssue({ code: "custom", path: ["expected_completion"], message: "Validation.expectedBeforeOrder" });
      }
    }

    if (values.quoted_price) {
      const price = Number(values.quoted_price);
      if (Number.isNaN(price) || price < 0 || price > 9_999_999.99) {
        ctx.addIssue({ code: "custom", path: ["quoted_price"], message: "Validation.quotedPriceInvalid" });
      }
    }
  });

export type JobFormValues = z.infer<typeof JobSchema>;

/** The carpenter's one editable control (Requirement 9.8, design §13.2). */
export const JobStatusSchema = z.object({
  status: z.enum(JOB_STATUSES),
});

export type JobStatusFormValues = z.infer<typeof JobStatusSchema>;
