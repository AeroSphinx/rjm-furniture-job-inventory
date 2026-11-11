import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/patterns/PageHeader";
import { TransactionsPageClient } from "@/components/features/transactions/TransactionsPageClient";
import { requireUser } from "@/lib/auth";
import { getServerClient } from "@/lib/supabase/server";
import { listTransactions, listJobOptionsForStockOut } from "@/lib/queries/transactions";
import { listMaterialOptions } from "@/lib/queries/materials";
import { PAGE_SIZE } from "@/lib/constants";

type TransactionsPageProps = {
  searchParams: Promise<{ q?: string; type?: string; page?: string }>;
};

/**
 * `/transactions` (Requirement 11.1-11.12): every role reaches this
 * screen — a worker sees only "Record Stock Out", limited to jobs
 * assigned to them (design §20). No cost column for any role —
 * `v_transactions_list` carries none.
 */
export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  const profile = await requireUser();
  const t = await getTranslations("Transactions");
  const { q = "", type = "", page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const supabase = await getServerClient();
  const [{ rows, totalCount }, materials, jobs] = await Promise.all([
    listTransactions(supabase, { q, type, page }),
    listMaterialOptions(supabase),
    listJobOptionsForStockOut(supabase, { workerId: profile.role === "worker" ? profile.id : undefined }),
  ]);
  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div>
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} purpose={t("purpose")} />
      <TransactionsPageClient
        rows={rows}
        page={page}
        pageCount={pageCount}
        totalCount={totalCount}
        q={q}
        role={profile.role}
        materials={materials}
        jobs={jobs}
      />
    </div>
  );
}
