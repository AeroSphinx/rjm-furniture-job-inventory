/**
 * `ActionResult<T>` is the shape every server action returns (design
 * §18.1): a client component never receives an English sentence or a raw
 * database message, only a code plus whatever values it needs, so a
 * caller can always ask next-intl for the text (Requirement 16.1 holds
 * for errors too, and Requirement 20.6's "plain words, no stack trace, no
 * SQL text" is structural rather than a convention to remember).
 */
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: ErrorCode; fieldErrors?: Record<string, string> };

/**
 * The subset of design §18.2's error table this phase's RPCs
 * (`create_job_order`, `update_job_order`, `update_job_status`) and the
 * plain `customers` writes can actually raise. Phase 4 (task 4.5) adds
 * the stock-movement codes from design §12.5/§18.2 to this same table —
 * nothing here needs to change for that, only grow.
 */
export type ErrorCode =
  | "NOT_PERMITTED"
  | "VALIDATION"
  | "CUSTOMER_NOT_FOUND"
  | "ASSIGNEE_NOT_FOUND"
  | "INVALID_STATUS"
  | "JOB_NOT_FOUND"
  | "JOB_NOT_ASSIGNED"
  | "JOB_COMPLETED"
  | "CODE_GENERATION_FAILED"
  | "CUSTOMER_NAME_TAKEN"
  | "RELATED_RECORD_MISSING"
  | "NETWORK"
  | "UNEXPECTED";

/**
 * Maps a Postgres/PostgREST error (an RPC's `raise exception` message, or
 * a plain-table write's own error) onto one of the codes above. The RPCs
 * in this schema raise a bare code as the exception message (design
 * §13.1-§13.2: `raise exception 'NOT_PERMITTED' using errcode = 'P0001'`),
 * so the message itself is already the code — no parsing of `detail` is
 * needed for this phase's forms, which show one error per failure rather
 * than per field from the server (client-side zod already catches the
 * field-level cases before the request is sent).
 */
export function mapSupabaseError(error: { message?: string; code?: string } | null | undefined): ErrorCode {
  const message = error?.message ?? "";

  const known: ErrorCode[] = [
    "NOT_PERMITTED",
    "CUSTOMER_NOT_FOUND",
    "ASSIGNEE_NOT_FOUND",
    "INVALID_STATUS",
    "JOB_NOT_FOUND",
    "JOB_NOT_ASSIGNED",
    "JOB_COMPLETED",
    "CODE_GENERATION_FAILED",
  ];
  for (const code of known) {
    if (message.includes(code)) return code;
  }

  if (error?.code === "23505") return "CUSTOMER_NAME_TAKEN";
  if (error?.code === "23503") return "RELATED_RECORD_MISSING";
  if (error?.code === "42501" || error?.code === "PGRST116") return "NOT_PERMITTED";

  return "UNEXPECTED";
}

/**
 * `NOT_PERMITTED` → `notPermitted`, matching this file's `ErrorCode`
 * values to the `Errors` namespace's camelCase keys in `messages/*.json`
 * one-to-one, so a caller never hand-writes the mapping twice.
 */
export function errorCodeToKey(code: ErrorCode): string {
  return code.toLowerCase().replace(/_([a-z])/g, (_, char: string) => char.toUpperCase());
}
