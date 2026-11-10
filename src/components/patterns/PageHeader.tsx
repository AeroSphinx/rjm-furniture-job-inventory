import type { ReactNode } from "react";

/**
 * Every screen begins with this: a small eyebrow label, a single `<h1>`,
 * and a one-line purpose statement (Requirement 6.9). At most one primary
 * action lives in `actions` (design §18.10 — one primary action per area).
 */
function PageHeader({
  eyebrow,
  title,
  purpose,
  actions,
  versionChip,
}: {
  eyebrow: string;
  title: string;
  purpose: string;
  actions?: ReactNode;
  versionChip?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{eyebrow}</p>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          {versionChip}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{purpose}</p>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export { PageHeader };
