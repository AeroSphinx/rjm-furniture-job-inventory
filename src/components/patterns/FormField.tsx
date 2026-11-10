import { useId } from "react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

/**
 * Label / hint / error wiring in one place (Requirement 17.11): a visible
 * `*` marker on required fields, and `aria-describedby` linking the
 * control to its hint and its error so assistive technology reads both.
 * `children` is a render function so this stays control-agnostic (input,
 * select, textarea, checkbox — whatever the field needs).
 */
function FormField({
  name,
  label,
  hint,
  error,
  required,
  children,
}: {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (props: { id: string; "aria-describedby"?: string; "aria-invalid"?: boolean }) => ReactNode;
}) {
  const id = useId();
  const fieldId = `${name}-${id}`;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={fieldId}>
        {label}
        {required && (
          <span className="ml-0.5 text-danger-text" aria-hidden="true">
            *
          </span>
        )}
        {required && <span className="sr-only"> (required)</span>}
      </Label>
      {children({ id: fieldId, "aria-describedby": describedBy, "aria-invalid": Boolean(error) })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={cn("text-xs font-medium text-danger-text")} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export { FormField };
