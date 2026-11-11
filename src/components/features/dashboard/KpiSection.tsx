import { getTranslations } from "next-intl/server";
import { AlertTriangle, Boxes, CheckCircle, ClipboardList, Clock, Loader } from "lucide-react";

import { StatCard } from "@/components/patterns/StatCard";
import { ErrorCardRetry } from "@/components/patterns/ErrorCardRetry";
import { getDashboardSummary } from "@/lib/queries/dashboard";

/**
 * The six KPI cards (Requirement 7.4-7.6): one of the Dashboard's three
 * `<Suspense>` children, so a failure here never blanks the greeting or
 * the other two sections (design §3.1, §18.3). Every number and sub-note
 * is read straight from `dashboard_summary()` — none is computed here,
 * none is hardcoded (Requirement 7.5).
 */
async function KpiSection() {
  const t = await getTranslations("Dashboard");

  let summary;
  try {
    summary = await getDashboardSummary();
  } catch (error) {
    console.error("dashboard_summary() failed", error);
    return <ErrorCardRetry title={t("sectionErrorTitle")} body={t("sectionErrorBody")} />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        label={t("kpiTotalJobOrders")}
        value={summary.jobs_total}
        subNote={t("kpiJobsThisMonth", { count: summary.jobs_this_month })}
        icon={ClipboardList}
      />
      <StatCard
        label={t("kpiPendingJobs")}
        value={summary.jobs_pending}
        subNote={t("kpiNeedsScheduling")}
        icon={Clock}
      />
      <StatCard
        label={t("kpiOngoingJobs")}
        value={summary.jobs_in_progress}
        subNote={t("kpiDueThisWeek", { count: summary.due_this_week })}
        icon={Loader}
      />
      <StatCard
        label={t("kpiCompletedJobs")}
        value={summary.jobs_completed}
        subNote={t("kpiCompletionRate", { rate: summary.completion_rate })}
        icon={CheckCircle}
        tone="success"
      />
      <StatCard
        label={t("kpiInventoryItems")}
        value={summary.materials_total}
        subNote={t("kpiAcrossCategories", { count: summary.category_count })}
        icon={Boxes}
      />
      <StatCard
        label={t("kpiLowStockMaterials")}
        value={summary.low_stock_count + summary.out_of_stock_count}
        subNote={summary.low_stock_count + summary.out_of_stock_count > 0 ? t("kpiActionRequired") : undefined}
        icon={AlertTriangle}
        tone={summary.low_stock_count + summary.out_of_stock_count > 0 ? "warning" : "success"}
      />
    </div>
  );
}

export { KpiSection };
