"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { BarChart3, Boxes, CheckCircle, ClipboardList, Clock, Download, Loader, Printer } from "lucide-react";

import { SectionCard } from "@/components/patterns/SectionCard";
import { StatCard } from "@/components/patterns/StatCard";
import { EmptyState } from "@/components/patterns/EmptyState";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { buildCsv, downloadCsv } from "@/lib/csv";
import { sharePercent, type ReportSummary } from "@/lib/queries/reports";
import { REPORT_RANGE_PRESETS, REPORT_RANGE_PRESET_KEYS, type ReportRangePreset } from "@/lib/dateRange";

/**
 * `/reports` (Requirement 14.1-14.14, `[MUST]` on screen). The range
 * select is the one piece of client interactivity on this screen — it
 * replaces the page's `?range=` param and lets the server component
 * re-run `report_summary()` for the new dates. Print and CSV export use
 * the data already on screen; neither triggers a second fetch.
 */
function ReportsPageClient({
  summary,
  preset,
  fromIso,
  toIso,
  rangeLabel,
}: {
  summary: ReportSummary;
  preset: ReportRangePreset;
  fromIso: string;
  toIso: string;
  rangeLabel: string;
}) {
  const t = useTranslations("Reports");
  const tStatus = useTranslations("Status");
  const router = useRouter();

  function handleRangeChange(next: string) {
    router.push(`/reports?range=${next}`);
  }

  function handleExportCsv() {
    const csv = buildCsv([
      {
        title: t("cardJobSummaryTitle"),
        header: [t("csvMetric"), t("csvCount"), t("csvPercent")],
        rows: [
          [t("tileTotalJobOrders"), summary.jobs_total, "100%"],
          [t("tileCompletedJobs"), summary.jobs_completed, `${sharePercent(summary.jobs_completed, summary.jobs_total)}%`],
          [t("tilePendingJobs"), summary.jobs_pending, `${sharePercent(summary.jobs_pending, summary.jobs_total)}%`],
          [t("tileOngoingJobs"), summary.jobs_in_progress, `${sharePercent(summary.jobs_in_progress, summary.jobs_total)}%`],
        ],
      },
      {
        title: t("cardInventorySummaryTitle"),
        header: [t("csvMetric"), t("csvValue")],
        rows: [
          [t("rowTotalItems"), summary.materials_total],
          [t("rowCategories"), summary.category_count],
          [t("rowLowStock"), summary.low_stock_count],
          [t("rowTxnInRange"), summary.txn_in_range],
        ],
      },
      {
        title: t("cardTopMaterialsTitle"),
        header: [t("csvMaterial"), t("csvQuantity"), t("csvUnit")],
        rows: summary.top_materials.map((m) => [m.material_name, m.total_quantity, m.unit]),
      },
      {
        title: t("cardLowStockReportTitle"),
        header: [t("colMaterial"), t("colCurrent"), t("colMinimum"), t("colStockStatus")],
        rows: summary.low_stock.map((m) => [
          `${m.material_name} (${m.material_code})`,
          `${m.current_stock} ${m.unit}`,
          `${m.minimum_level} ${m.unit}`,
          m.stock_status === "out_of_stock" ? tStatus("stockOutOfStock") : tStatus("stockLowStock"),
        ]),
      },
    ]);
    downloadCsv(`rjm-report_${fromIso}_to_${toIso}.csv`, csv);
  }

  return (
    <div>
      {/* Print-only brand line (Requirement 14.11): the top bar is hidden
          in print (design §17, globals.css), so the printed page still
          needs its own "who made this" header. */}
      <div className="mb-4 hidden items-baseline justify-between border-b border-border pb-2 print:flex">
        <span className="font-bold tracking-wide text-foreground">RJM FURNITURE</span>
        <span className="text-sm text-muted-foreground">{rangeLabel}</span>
      </div>

      <div className="mb-4 flex flex-col gap-3 rounded-md border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("rangeToolbarLabel")}</span>
          <Select value={preset} onValueChange={handleRangeChange}>
            <SelectTrigger aria-label={t("rangeToolbarLabel")} className="w-full sm:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REPORT_RANGE_PRESETS.map((p) => (
                <SelectItem key={p} value={p}>
                  {t(REPORT_RANGE_PRESET_KEYS[p])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={handleExportCsv}>
            <Download className="size-4" aria-hidden />
            {t("exportCsvButton")}
          </Button>
          <Button type="button" onClick={() => window.print()}>
            <Printer className="size-4" aria-hidden />
            {t("printReportButton")}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <SectionCard title={t("cardJobSummaryTitle")} subtitle={rangeLabel}>
          {summary.jobs_total === 0 ? (
            <EmptyState icon={ClipboardList} title={t("emptyRangeTitle")} body={t("emptyRangeBody", { range: rangeLabel })} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label={t("tileTotalJobOrders")}
                value={summary.jobs_total}
                subNote={t("tilePercentNote", { pct: 100 })}
                icon={ClipboardList}
              />
              <StatCard
                label={t("tileCompletedJobs")}
                value={summary.jobs_completed}
                subNote={t("tilePercentNote", { pct: sharePercent(summary.jobs_completed, summary.jobs_total) })}
                icon={CheckCircle}
                tone="success"
              />
              <StatCard
                label={t("tilePendingJobs")}
                value={summary.jobs_pending}
                subNote={t("tilePercentNote", { pct: sharePercent(summary.jobs_pending, summary.jobs_total) })}
                icon={Clock}
              />
              <StatCard
                label={t("tileOngoingJobs")}
                value={summary.jobs_in_progress}
                subNote={t("tilePercentNote", { pct: sharePercent(summary.jobs_in_progress, summary.jobs_total) })}
                icon={Loader}
              />
            </div>
          )}
        </SectionCard>

        <SectionCard title={t("cardInventorySummaryTitle")} subtitle={t("cardInventorySummarySubtitle")}>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              [t("rowTotalItems"), summary.materials_total],
              [t("rowCategories"), summary.category_count],
              [t("rowLowStock"), summary.low_stock_count],
              [t("rowTxnInRange"), summary.txn_in_range],
            ].map(([label, value]) => (
              <div key={label as string} className="flex items-center justify-between border-b border-border py-2 text-sm">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-medium text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </SectionCard>

        <SectionCard title={t("cardTopMaterialsTitle")} subtitle={t("cardTopMaterialsSubtitle")}>
          {summary.top_materials.length === 0 ? (
            <EmptyState icon={BarChart3} title={t("emptyRangeTitle")} body={t("emptyRangeBody", { range: rangeLabel })} />
          ) : (
            <ol className="flex flex-col gap-2">
              {summary.top_materials.map((m, index) => (
                <li key={m.material_name} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">
                    {index + 1}. {m.material_name}
                  </span>
                  <span className="font-medium text-muted-foreground">
                    {m.total_quantity} {m.unit}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </SectionCard>

        <SectionCard title={t("cardLowStockReportTitle")} subtitle={t("cardLowStockReportSubtitle")}>
          {summary.low_stock.length === 0 ? (
            <EmptyState icon={Boxes} title={t("emptyLowStockTitle")} body={t("emptyLowStockBody")} />
          ) : (
            <Table>
              <TableCaption className="sr-only">{t("cardLowStockReportTitle")}</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("colMaterial")}</TableHead>
                  <TableHead>{t("colCurrent")}</TableHead>
                  <TableHead>{t("colMinimum")}</TableHead>
                  <TableHead>{t("colStockStatus")}</TableHead>
                  <TableHead>{t("colSuggestedAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.low_stock.map((m) => (
                  <TableRow key={m.material_code}>
                    <TableHead scope="row" className="font-normal">
                      {m.material_name} ({m.material_code})
                    </TableHead>
                    <TableCell>
                      {m.current_stock} {m.unit}
                    </TableCell>
                    <TableCell>
                      {m.minimum_level} {m.unit}
                    </TableCell>
                    <TableCell>{m.stock_status === "out_of_stock" ? tStatus("stockOutOfStock") : tStatus("stockLowStock")}</TableCell>
                    <TableCell>{t("suggestedActionReview")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </SectionCard>

        <div className="flex flex-col gap-1 border-t border-border pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>{t("footerLeft")}</span>
          <span>{t("footerRight")}</span>
        </div>
      </div>
    </div>
  );
}

export { ReportsPageClient };
