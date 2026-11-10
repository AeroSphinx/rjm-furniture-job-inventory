import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * The inline "Try again" card used by every failed data section
 * (Requirement 7.13, 14.14, 20.9). Never shows a stack trace, SQL text or
 * raw error code as the primary message — the technical detail is logged
 * server-side, not rendered here.
 */
function ErrorCard({
  title,
  body,
  onRetry,
  retryLabel = "Try again",
}: {
  title: string;
  body: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-md border border-danger bg-danger-surface p-4"
    >
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 size-5 shrink-0 text-danger-text" aria-hidden />
        <div>
          <p className="font-medium text-danger-text">{title}</p>
          <p className="mt-1 text-sm text-danger-text">{body}</p>
        </div>
      </div>
      {onRetry && (
        <Button type="button" variant="outline" size="default" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

export { ErrorCard };
