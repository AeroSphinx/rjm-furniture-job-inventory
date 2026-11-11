import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/patterns/PageHeader";
import { ErrorCardRetry } from "@/components/patterns/ErrorCardRetry";
import { ReportsPageClient } from "@/components/features/reports/ReportsPageClient";
import { requireRole } from "@/lib/auth";
import { getServerClient } from "@/lib/supabase/server";
import { getReportSummary } from "@/lib/queries/reports";
import { resolveReportRange, toIsoDate, formatRangeLabel } from "@/lib/dateRange";

type ReportsPageProps = {
  searchParams: Promise<{ range?: string }>;
};

/**
 * `/reports` (Requirement 14.1-14.14): owner and admin_staff only — a
 * worker's request is refused before any query runs (design §13.6's
 * `is_staff()` gate inside `report_summary()` itself, behind this
 * route's own `requireRole`, which is the second of the two layers
 * Requirement 3.10 asks for).
 */
export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  await requireRole(["owner", "admin_staff"]);
  const t = await getTranslations("Reports");
  const { range } = await searchParams;
  const { preset, from, to } = resolveReportRange(range);
  const fromIso = toIsoDate(from);
  const toIso = toIsoDate(to);
  const rangeLabel = formatRangeLabel(from, to);

  const supabase = await getServerClient();

  let summary;
  try {
    summary = await getReportSummary(supabase, fromIso, toIso);
  } catch (error) {
    console.error("report_summary() failed", error);
    return (
      <div>
        <PageHeader eyebrow={t("eyebrow")} title={t("title")} purpose={t("purpose")} />
        <ErrorCardRetry title={t("pageErrorTitle")} body={t("pageErrorBody")} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} purpose={t("purpose")} />
      <ReportsPageClient summary={summary} preset={preset} fromIso={fromIso} toIso={toIso} rangeLabel={rangeLabel} />
    </div>
  );
}

