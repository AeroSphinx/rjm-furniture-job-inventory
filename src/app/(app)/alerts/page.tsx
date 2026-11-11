import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AlertTriangle } from "lucide-react";

import { PageHeader } from "@/components/patterns/PageHeader";
import { SectionCard } from "@/components/patterns/SectionCard";
import { Button } from "@/components/ui/button";
import { AlertsTable } from "@/components/features/alerts/AlertsTable";
import { requireUser } from "@/lib/auth";
import { getServerClient } from "@/lib/supabase/server";
import { listLowStockAlerts } from "@/lib/queries/materials";

/**
 * `/alerts` (Requirement 13.1-13.10, design §20). Reads the same
 * `v_material_status` source as the sidebar badge (`(app)/layout.tsx`)
 * and the Inventory banner (`listMaterials`'s `countMaterialsNeedingAttention`),
 * so the banner total here, the sidebar count and the table's row count
 * can never disagree (Requirement 13.3). No pagination — the wireframe
 * and the requirement both describe one table of every material needing
 * attention, not a paged list. The table itself is `AlertsTable`, a
 * client component — see that file for why this page can't build
 * `DataTable`'s columns directly.
 */
export default async function AlertsPage() {
  const profile = await requireUser();
  const t = await getTranslations("Alerts");

  const supabase = await getServerClient();
  const rows = await listLowStockAlerts(supabase);

  const outOfStock = rows.filter((row) => row.stock_status === "out_of_stock");
  const lowStock = rows.filter((row) => row.stock_status === "low_stock");
  const canRecordStockIn = profile.role !== "worker";

  return (
    <div>
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} purpose={t("purpose")} />

      {rows.length > 0 && (
        <div role="alert" className="mb-4 flex flex-col gap-3 rounded-md border border-warning bg-warning-surface p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning-text" aria-hidden />
            <div>
              <p className="font-semibold text-warning-text">{t("bannerTitle", { count: rows.length })}</p>
              <p className="text-sm text-warning-text">
                {t("bannerBreakdown", { outOfStock: outOfStock.length, lowStock: lowStock.length })}
              </p>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href="/inventory">{t("viewInventoryButton")}</Link>
          </Button>
        </div>
      )}

      {rows.length > 0 && (
        <div className="mb-4 flex flex-col gap-3">
          {outOfStock.length > 0 && (
            <div role="status" className="rounded-md border border-danger bg-danger-surface p-3 text-sm text-danger-text">
              {t("outOfStockNotice", { materials: outOfStock.map((m) => m.name).join(", ") })}
            </div>
          )}
          <div role="status" className="rounded-md border border-info bg-info-surface p-3 text-sm text-info-text">
            {t("lowStockAdvisory")}
          </div>
        </div>
      )}

      <SectionCard title={t("cardTitle")} subtitle={t("cardSubtitle")}>
        <AlertsTable rows={rows} canRecordStockIn={canRecordStockIn} />
      </SectionCard>
    </div>
  );
}
