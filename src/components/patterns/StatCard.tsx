import type { ComponentType } from "react";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

/** The six Dashboard KPIs and the Reports tiles share this one card shape. */
function StatCard({
  label,
  value,
  subNote,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  subNote?: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  return (
    <Card className="gap-2 py-4">
      <div className="flex items-start justify-between px-4">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-md",
            tone === "neutral" && "bg-dusk-100 text-navy-700",
            tone === "success" && "bg-success-surface text-success-text",
            tone === "warning" && "bg-warning-surface text-warning-text",
            tone === "danger" && "bg-danger-surface text-danger-text",
          )}
        >
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <div className="px-4">
        <p className="text-2xl font-semibold text-foreground">{value}</p>
        {subNote && <p className="mt-1 text-xs text-muted-foreground">{subNote}</p>}
      </div>
    </Card>
  );
}

export { StatCard };
