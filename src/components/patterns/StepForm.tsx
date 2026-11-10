"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type FormStep = {
  id: string;
  label: string;
  content: ReactNode;
};

/**
 * Used when a form has more than six fields, or when Simple mode is on
 * (Requirement 9.7, 20.13's sibling rule in design §6.2). A visible step
 * indicator plus Back/Next controls; the caller's `onSubmit` only fires
 * from the last step.
 */
function StepForm({
  steps,
  onSubmit,
  submitLabel = "Save",
}: {
  steps: FormStep[];
  onSubmit: () => void;
  submitLabel?: string;
}) {
  const [index, setIndex] = useState(0);
  const isLast = index === steps.length - 1;
  const current = steps[index];

  return (
    <div className="flex flex-col gap-6">
      <ol className="flex items-center gap-2" aria-label="Form steps">
        {steps.map((step, stepIndex) => (
          <li key={step.id} className="flex flex-1 items-center gap-2">
            <span
              aria-current={stepIndex === index ? "step" : undefined}
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium",
                stepIndex === index
                  ? "border-primary-border bg-primary text-primary-foreground"
                  : stepIndex < index
                    ? "border-success bg-success-surface text-success-text"
                    : "border-input bg-card text-muted-foreground",
              )}
            >
              {stepIndex + 1}
            </span>
            <span className={cn("text-sm", stepIndex === index ? "font-medium text-foreground" : "text-muted-foreground")}>
              {step.label}
            </span>
            {stepIndex < steps.length - 1 && <span className="h-px flex-1 bg-border" aria-hidden />}
          </li>
        ))}
      </ol>

      <div>{current.content}</div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
          Back
        </Button>
        {isLast ? (
          <Button type="button" onClick={onSubmit}>
            {submitLabel}
          </Button>
        ) : (
          <Button type="button" onClick={() => setIndex((i) => i + 1)}>
            Next
          </Button>
        )}
      </div>
    </div>
  );
}

export { StepForm };
