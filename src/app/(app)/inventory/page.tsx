import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/patterns/PageHeader";
import { InventoryPageClient } from "@/components/features/materials/InventoryPageClient";
import { requireUser } from "@/lib/auth";
import { getServerClient } from "@/lib/supabase/server";
import { listMaterials, countMaterialsNeedingAttention, listMaterialCosts } from "@/lib/queries/materials";
import { PAGE_SIZE } from "@/lib/constants";

type InventoryPageProps = {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
};

/**
 * `/inventory` (Requirement 10.1-10.13): every role reaches this screen —
 * a worker sees it read-only, with no Add/Edit/Delete (design §20). Unit
 * cost is fetched only when the signed-in role is staff, so a worker's
 * request to this route never asks the database for it at all
 * (Requirement 10.9), the same pattern `/jobs` uses for `quoted_price`.
 */
export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  const profile = await requireUser();
  const t = await getTranslations("Materials");
  const { q = "", category = "", page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const supabase = await getServerClient();
  const [{ rows, totalCount }, attentionCount] = await Promise.all([
    listMaterials(supabase, { q, category, page }),
    countMaterialsNeedingAttention(supabase),
  ]);

  const costMap = profile.role === "worker" ? {} : await listMaterialCosts(supabase, rows.map((row) => row.id));
  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div>
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} purpose={t("purpose")} />
      <InventoryPageClient
        rows={rows}
        page={page}
        pageCount={pageCount}
        totalCount={totalCount}
        attentionCount={attentionCount}
        q={q}
        role={profile.role}
        costMap={costMap}
      />
    </div>
  );
}
