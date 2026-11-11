"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ClipboardList } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/patterns/DataTable";
import { EmptyState } from "@/components/patterns/EmptyState";
import { StatusBadge } from "@/components/patterns/StatusBadge";
import { formatDate } from "@/lib/format";
import { JOB_STATUS_KEYS } from "@/schemas/job";
import type { DashboardSummary } from "@/lib/queries/dashboard";

type RecentJob = DashboardSummary["recent_jobs"][number];

/**
 * `DataTable`'s `columns` prop carries render functions (`cell`), and a
 * Server Component cannot pass a function to a Client Component (the
 * prop has to be serialisable to cross that boundary) — `DataTable` is
 * `"use client"`, so whatever builds its `columns` array has to be a
 * client component too. This is that component: `JobsOverviewSection`
 * (a server component, so it can share one `dashboard_summary()` call
 * with its Suspense siblings) hands it plain row data only.
 */
function RecentJobsTable({ rows }: { rows: RecentJob[] }) {
  const t = useTranslations("Dashboard");
  const tStatus = useTranslations("Status");
  const tCommon = useTranslations("Common");

  const columns: DataTableColumn<RecentJob>[] = [
    { key: "job_code", header: t("colJobOrder"), priority: "primary", scopeRow: true, cell: (row) => row.job_code },
    { key: "customer_name", header: t("colCustomer"), priority: "primary", cell: (row) => row.customer_name },
    { key: "project_name", header: t("colProject"), priority: "secondary", cell: (row) => row.project_name },
    {
      key: "expected_completion",
      header: t("colDueDate"),
      priority: "detail",
      cell: (row) => (row.expected_completion ? formatDate(row.expected_completion) : "—"),
    },
    {
      key: "status",
      header: t("colStatus"),
      priority: "primary",
      cell: (row) => <StatusBadge kind="job" value={row.status} label={tStatus(JOB_STATUS_KEYS[row.status])} />,
    },
    {
      key: "view",
      header: tCommon("view"),
      cell: (row) => (
        <Link href={`/jobs/${row.id}`} className="font-medium text-orange-700 underline-offset-4 hover:underline">
          {tCommon("view")}
        </Link>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      caption={t("recentJobsCardTitle")}
      emptyState={<EmptyState icon={ClipboardList} title={t("recentJobsEmptyTitle")} body={t("recentJobsEmptyBody")} />}
    />
  );
}

export { RecentJobsTable };
