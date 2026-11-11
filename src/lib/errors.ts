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
  | {
      ok: false;
      code: ErrorCode;
      fieldErrors?: Record<string, string>;
      /** Parsed `error.details` JSON (design §12.5/§18.2) — `INSUFFICIENT_STOCK`'s `available`/`requested`/`unit`/`material` values, used to interpolate the toast. */
      detail?: Record<string, string | number>;
    };

/**
 * Design §18.2's error table, grown phase by phase rather than replaced:
 * Phase 3's job/customer codes, plus Phase 4's stock-movement codes from
 * design §12.5 (`record_stock_movement`) and `upsert_material`'s own
 * `INVALID_INPUT`/`MATERIAL_NAME_TAKEN`.
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
  | "UNEXPECTED"
  | "AUTH_REQUIRED"
  | "INVALID_TYPE"
  | "INVALID_QUANTITY"
  | "INVALID_DIRECTION"
  | "REASON_REQUIRED"
  | "MATERIAL_NOT_FOUND"
  | "JOB_REQUIRED"
  | "OUT_OF_STOCK"
  | "INSUFFICIENT_STOCK"
  | "MATERIAL_NAME_TAKEN"
  | "INVALID_INPUT";

type SupabaseErrorLike = { message?: string; code?: string; details?: string } | null | undefined;

/**
 * Maps a Postgres/PostgREST error (an RPC's `raise exception` message, or
 * a plain-table write's own error) onto one of the codes above. The RPCs
 * in this schema raise a bare code as the exception message (design
 * §13.1-§13.2: `raise exception 'NOT_PERMITTED' using errcode = 'P0001'`),
 * so the message itself is already the code — no parsing of `detail` is
 * needed to pick the code (client-side zod already catches the
 * field-level cases before the request is sent); `parseErrorDetail`
 * below is only for the two stock codes whose toast names real numbers.
 */
export function mapSupabaseError(error: SupabaseErrorLike): ErrorCode {
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
    "AUTH_REQUIRED",
    "INVALID_TYPE",
    "INVALID_QUANTITY",
    "INVALID_DIRECTION",
    "REASON_REQUIRED",
    "MATERIAL_NOT_FOUND",
    "JOB_REQUIRED",
    "OUT_OF_STOCK",
    "INSUFFICIENT_STOCK",
    "MATERIAL_NAME_TAKEN",
    "INVALID_INPUT",
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
 * `record_stock_movement`'s `OUT_OF_STOCK`/`INSUFFICIENT_STOCK` codes
 * (design §12.2 step 7) carry a JSON `detail` string with the real
 * numbers — `available`, `requested`, `unit`, `material` — so the toast
 * can say "Only 6 board ft of Mahogany Lumber are available" instead of
 * a generic refusal. Every other code in this file's table needs no
 * detail, so callers that do not need it can simply ignore this.
 */
export function parseErrorDetail(error: SupabaseErrorLike): Record<string, string | number> | undefined {
  const raw = error?.details;
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string | number>) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * `NOT_PERMITTED` → `notPermitted`, matching this file's `ErrorCode`
 * values to the `Errors` namespace's camelCase keys in `messages/*.json`
 * one-to-one, so a caller never hand-writes the mapping twice.
 */
export function errorCodeToKey(code: ErrorCode): string {
  return code.toLowerCase().replace(/_([a-z])/g, (_, char: string) => char.toUpperCase());
}
