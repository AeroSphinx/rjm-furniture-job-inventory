import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { SectionCard } from "@/components/patterns/SectionCard";
import { Progress } from "@/components/ui/progress";
import { ErrorCardRetry } from "@/components/patterns/ErrorCardRetry";
import { RecentJobsTable } from "@/components/features/dashboard/RecentJobsTable";
import { getDashboardSummary } from "@/lib/queries/dashboard";
import { JOB_STATUS_KEYS, JOB_STATUSES, type JobStatus } from "@/schemas/job";

/**
 * Two of the wireframe's panels, read from the one `dashboard_summary()`
 * call this Suspense boundary shares with the other two sections
 * (Requirement 7.6-7.8, design §3.1). Grouped together because both are
 * job-centric and both come from the same `recent_jobs`/`jobs_*` keys —
 * splitting them into two more `<Suspense>` children would cost nothing
 * in correctness but would be a fourth and fifth streaming section where
 * the design calls for three. The recent-jobs table itself is
 * `RecentJobsTable`, a client component — see that file for why.
 */
async function JobsOverviewSection() {
  const t = await getTranslations("Dashboard");
  const tStatus = await getTranslations("Status");

  let summary;
  try {
    summary = await getDashboardSummary();
  } catch (error) {
    console.error("dashboard_summary() failed", error);
    return <ErrorCardRetry title={t("sectionErrorTitle")} body={t("sectionErrorBody")} />;
  }

  const statusCounts: Record<JobStatus, number> = {
    pending: summary.jobs_pending,
    in_progress: summary.jobs_in_progress,
    on_hold: summary.jobs_on_hold,
    completed: summary.jobs_completed,
  };
  const presentStatuses = JOB_STATUSES.filter((status) => statusCounts[status] > 0);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <SectionCard
        title={t("recentJobsCardTitle")}
        subtitle={t("recentJobsCardSubtitle")}
        action={
          <Link href="/jobs" className="text-sm font-medium text-orange-700 underline-offset-4 hover:underline">
            {t("viewAllJobsLink")}
          </Link>
        }
      >
        <RecentJobsTable rows={summary.recent_jobs} />
      </SectionCard>

      <SectionCard title={t("jobStatusCardTitle")} subtitle={t("jobStatusCardSubtitle", { count: summary.jobs_total })}>
        <div className="flex flex-col gap-4">
          {presentStatuses.length === 0 && <p className="text-sm text-muted-foreground">{t("recentJobsEmptyBody")}</p>}
          {presentStatuses.map((status) => {
            const count = statusCounts[status];
            const pct = summary.jobs_total === 0 ? 0 : Math.round((count / summary.jobs_total) * 100);
            const label = tStatus(JOB_STATUS_KEYS[status]);
            const barText = t("jobStatusBarText", { label, count, pct });
            return (
              <div key={status} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{label}</span>
                  <span className="text-muted-foreground">{t("jobStatusCountPct", { count, pct })}</span>
                </div>
                <Progress value={pct} aria-label={barText} />
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}

export { JobsOverviewSection };
