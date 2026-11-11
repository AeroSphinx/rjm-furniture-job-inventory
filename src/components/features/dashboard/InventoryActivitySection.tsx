import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowDownToLine, ArrowUpFromLine, CheckCircle2, PackageSearch, Settings2 } from "lucide-react";

import { SectionCard } from "@/components/patterns/SectionCard";
import { EmptyState } from "@/components/patterns/EmptyState";
import { ErrorCardRetry } from "@/components/patterns/ErrorCardRetry";
import { formatDate } from "@/lib/format";
import { getServerClient } from "@/lib/supabase/server";
import { getDashboardSummary } from "@/lib/queries/dashboard";
import { listLowStockAlerts } from "@/lib/queries/materials";

const DIRECTION_ICON = {
  stock_in: ArrowDownToLine,
  stock_out: ArrowUpFromLine,
  adjustment: Settings2,
} as const;

/**
 * The Low-Stock Alerts preview and the Recent Inventory Activity feed
 * (Requirement 7.9-7.10) — the Dashboard's third `<Suspense>` child.
 *
 * **Deliberate second query, recorded here rather than left silent.**
 * `dashboard_summary()` only returns `low_stock_count`/
 * `out_of_stock_count` (design §13.6's payload contract), not the actual
 * material rows Requirement 7.9 needs ("a row per affected material").
 * Extending the already-live RPC for a three-row dashboard preview would
 * mean a fourteenth migration touching an already-applied function;
 * reusing the already-built, already-granted `listLowStockAlerts()`
 * (same query the Alerts screen and §20 both read) is simpler and no
 * less safe (brief ADDENDUM 2). This is the one place this phase departs
 * from "every Dashboard figure in one round trip" — see
 * `docs/design-rationale.md`'s Phase 5 section.
 */
async function InventoryActivitySection() {
  const t = await getTranslations("Dashboard");
  const tStatus = await getTranslations("Status");

  let lowStock;
  let recentTransactions;
  try {
    const supabase = await getServerClient();
    const [summary, alerts] = await Promise.all([getDashboardSummary(), listLowStockAlerts(supabase)]);
    lowStock = alerts.slice(0, 3);
    recentTransactions = summary.recent_transactions;
  } catch (error) {
    console.error("dashboard inventory section failed", error);
    return <ErrorCardRetry title={t("sectionErrorTitle")} body={t("sectionErrorBody")} />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <SectionCard
        title={t("lowStockCardTitle")}
        subtitle={t("lowStockCardSubtitle")}
        action={
          <Link href="/alerts" className="text-sm font-medium text-orange-700 underline-offset-4 hover:underline">
            {t("viewAlertsLink")}
          </Link>
        }
      >
        {lowStock.length === 0 ? (
          <EmptyState icon={CheckCircle2} title={t("lowStockEmptyTitle")} body={t("lowStockEmptyBody")} />
        ) : (
          <ul className="flex flex-col gap-3">
            {lowStock.map((material) => (
              <li key={material.id} className="flex items-center justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium text-foreground">{material.name}</p>
                  <p className="text-muted-foreground">
                    {t("lowStockRowLine", { stock: material.current_stock, unit: material.unit, min: material.minimum_level })}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-medium text-warning-text">
                  {material.stock_status === "out_of_stock" ? tStatus("stockOutOfStock") : tStatus("stockLowStock")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title={t("recentActivityCardTitle")} subtitle={t("recentActivityCardSubtitle")}>
        {recentTransactions.length === 0 ? (
          <EmptyState icon={PackageSearch} title={t("recentActivityEmptyTitle")} body={t("recentActivityEmptyBody")} />
        ) : (
          <ul className="flex flex-col gap-3">
            {recentTransactions.map((txn) => {
              const Icon = DIRECTION_ICON[txn.type];
              const typeLabel = tStatus(txn.type === "stock_in" ? "txnStockIn" : txn.type === "stock_out" ? "txnStockOut" : "txnAdjustment");
              return (
                <li key={txn.id} className="flex items-start justify-between gap-3 text-sm">
                  <div className="flex items-start gap-2">
                    <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <div>
                      <p className="font-medium text-foreground">{txn.material_name}</p>
                      <p className="text-muted-foreground">
                        {t("recentActivityLine", { type: typeLabel, quantity: txn.quantity, unit: txn.unit, job: txn.job_code ?? "—" })}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-muted-foreground">{formatDate(txn.created_at)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

export { InventoryActivitySection };
