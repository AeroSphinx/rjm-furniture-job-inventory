import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/patterns/PageHeader";
import { CustomersPageClient } from "@/components/features/customers/CustomersPageClient";
import { requireRole } from "@/lib/auth";
import { getServerClient } from "@/lib/supabase/server";
import { listCustomers } from "@/lib/queries/customers";
import { PAGE_SIZE } from "@/lib/constants";

type CustomersPageProps = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

/**
 * `/customers` (design §20): staff only — reached from the sidebar's
 * indented sub-item or from the job form's "Add customer" link. A worker
 * who navigates here directly is redirected to `/no-access` by
 * `requireRole` before any customer data is read (Requirement 3.9).
 */
export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  await requireRole(["owner", "admin_staff"]);
  const t = await getTranslations("Customers");
  const { q = "", page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const supabase = await getServerClient();
  const { rows, totalCount } = await listCustomers(supabase, { q, page });
  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div>
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} purpose={t("purpose")} />
      <CustomersPageClient rows={rows} page={page} pageCount={pageCount} totalCount={totalCount} q={q} />
    </div>
  );
}
