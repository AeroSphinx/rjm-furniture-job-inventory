import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/patterns/PageHeader";
import { SectionCard } from "@/components/patterns/SectionCard";
import { StatusBadge } from "@/components/patterns/StatusBadge";
import { JobDetailClient } from "@/components/features/jobs/JobDetailClient";
import { requireUser } from "@/lib/auth";
import { getServerClient } from "@/lib/supabase/server";
import { getJob, getJobQuotedPrice, listJobMaterials, listJobStatusHistory } from "@/lib/queries/jobs";
import { listAllCustomers } from "@/lib/queries/customers";
import { listAssignableProfiles } from "@/lib/queries/profiles";
import { formatDate } from "@/lib/format";
import { JOB_STATUS_KEYS, type JobStatus } from "@/schemas/job";

type JobDetailPageProps = {
  params: Promise<{ id: string }>;
};

/**
 * `/jobs/[id]` (Requirement 9.12, 3.4-3.7): job details, assigned worker,
 * status history and the materials issued to it — price and material
 * cost rendered only for staff. A worker reaches this page for any job
 * (Requirement 3.4's "read access to all job orders"), never only their
 * own.
 */
export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const profile = await requireUser();
  const { id } = await params;
  const t = await getTranslations("Jobs");
  const tDetail = await getTranslations("JobDetail");
  const tStatus = await getTranslations("Status");

  const supabase = await getServerClient();
  const job = await getJob(supabase, id);
  if (!job) notFound();

  const [history, materials, customers, workers, quotedPrice] = await Promise.all([
    listJobStatusHistory(supabase, id),
    listJobMaterials(supabase, id),
    listAllCustomers(supabase),
    listAssignableProfiles(supabase),
    profile.role === "worker" ? Promise.resolve(undefined) : getJobQuotedPrice(supabase, id),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow={tDetail("eyebrow")}
        title={`${job.job_code} — ${job.project_name}`}
        purpose={tDetail("purpose")}
        actions={
          <Link href="/jobs" className="flex items-center gap-1 text-sm font-medium text-orange-700 hover:underline">
            <ArrowLeft className="size-4" aria-hidden />
            {tDetail("backToList")}
          </Link>
        }
      />

      <div className="flex flex-col gap-6">
        <SectionCard title={tDetail("detailsCardTitle")}>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailItem label={tDetail("customerLabel")} value={job.customer_name} />
            <DetailItem label={tDetail("projectLabel")} value={job.project_name} />
            <DetailItem label={tDetail("orderDateLabel")} value={formatDate(job.order_date)} />
            <DetailItem
              label={tDetail("expectedCompletionLabel")}
              value={job.expected_completion ? formatDate(job.expected_completion) : t("noExpectedCompletion")}
            />
            <DetailItem label={tDetail("assignedWorkerLabel")} value={job.assigned_name ?? t("assignedWorkerNone")} />
            <div className="flex flex-col gap-1">
              <dt className="text-sm text-muted-foreground">{tDetail("statusLabel")}</dt>
              <dd>
                <StatusBadge kind="job" value={job.status} label={tStatus(JOB_STATUS_KEYS[job.status])} />
              </dd>
            </div>
            {job.description && (
              <div className="flex flex-col gap-1 sm:col-span-2">
                <dt className="text-sm text-muted-foreground">{tDetail("descriptionLabel")}</dt>
                <dd className="text-foreground">{job.description}</dd>
              </div>
            )}
            {profile.role !== "worker" && (
              <DetailItem
                label={tDetail("quotedPriceLabel")}
                value={quotedPrice !== undefined && quotedPrice !== null ? formatMoney(quotedPrice) : tDetail("noPriceSet")}
              />
            )}
          </dl>
        </SectionCard>

        <JobDetailClient
          job={job}
          role={profile.role}
          currentUserId={profile.id}
          customers={customers}
          workers={workers}
          quotedPrice={quotedPrice ?? undefined}
        />

        <SectionCard title={tDetail("statusHistoryCardTitle")}>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">{tDetail("statusHistoryEmpty")}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {history.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-4 border-b border-border pb-2 last:border-0 last:pb-0">
                  <span className="text-sm text-foreground">
                    {entry.from_status
                      ? tDetail("historyTransition", {
                          from: tStatus(JOB_STATUS_KEYS[entry.from_status as JobStatus] ?? "jobPending"),
                          to: tStatus(JOB_STATUS_KEYS[entry.to_status as JobStatus] ?? "jobPending"),
                        })
                      : tDetail("historyCreated", { to: tStatus(JOB_STATUS_KEYS[entry.to_status as JobStatus] ?? "jobPending") })}
                  </span>
                  <span className="text-sm text-muted-foreground">{formatDate(entry.changed_at, "medium")}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title={tDetail("materialsCardTitle")}>
          {materials.length === 0 ? (
            <p className="text-sm text-muted-foreground">{tDetail("materialsEmpty")}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {materials.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-4 border-b border-border pb-2 last:border-0 last:pb-0">
                  <span className="text-sm text-foreground">
                    {m.txn_code} · {m.material_name} · {m.quantity} {m.unit}
                  </span>
                  <span className="text-sm text-muted-foreground">{formatDate(m.created_at, "medium")}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 2 }).format(value);
}
