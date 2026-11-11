import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/patterns/PageHeader";
import { JobsPageClient } from "@/components/features/jobs/JobsPageClient";
import { requireUser } from "@/lib/auth";
import { getServerClient } from "@/lib/supabase/server";
import { listJobs, listJobQuotedPrices } from "@/lib/queries/jobs";
import { listAllCustomers } from "@/lib/queries/customers";
import { listAssignableProfiles } from "@/lib/queries/profiles";
import { PAGE_SIZE } from "@/lib/constants";

type JobsPageProps = {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
};

/**
 * `/jobs` (Requirement 8.1-8.13): every role reaches this screen — a
 * worker sees every job order read-only plus the status-only edit form
 * (design §20, "worker: no Add, no Delete, Edit opens the status-only
 * form"). The quoted price is fetched only when the signed-in role is
 * staff, so a worker's request to this route never asks the database for
 * it at all (Requirement 4.6).
 */
export default async function JobsPage({ searchParams }: JobsPageProps) {
  const profile = await requireUser();
  const t = await getTranslations("Jobs");
  const { q = "", status = "", page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const supabase = await getServerClient();
  const [{ rows, totalCount }, customers, workers] = await Promise.all([
    listJobs(supabase, { q, status, page }),
    listAllCustomers(supabase),
    listAssignableProfiles(supabase),
  ]);

  let rowsWithPrice = rows;
  if (profile.role !== "worker") {
    const priceMap = await listJobQuotedPrices(supabase, rows.map((row) => row.id));
    rowsWithPrice = rows.map((row) => (priceMap[row.id] !== undefined ? { ...row, quotedPrice: priceMap[row.id] } : row));
  }

  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div>
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} purpose={t("purpose")} />
      <JobsPageClient
        rows={rowsWithPrice}
        page={page}
        pageCount={pageCount}
        totalCount={totalCount}
        q={q}
        role={profile.role}
        currentUserId={profile.id}
        customers={customers}
        workers={workers}
      />
    </div>
  );
}
