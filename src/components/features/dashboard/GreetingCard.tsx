import Link from "next/link";
import { Plus } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { greetingName, greetingPeriod } from "@/lib/format";
import type { Role } from "@/components/layout/Sidebar";

const PERIOD_KEYS = {
  morning: "greetingMorning",
  afternoon: "greetingAfternoon",
  evening: "greetingEvening",
} as const;

/**
 * The Dashboard's greeting card (Requirement 7.2-7.3): no query of its
 * own, so it renders instantly while the three KPI/panel sections stream
 * in behind it. The two quick actions are **hidden**, not disabled, for
 * a worker — they link to the Job Orders / Inventory lists rather than
 * opening a dialog in place, so this card stays free of any write-side
 * dependency on those screens' own forms.
 */
function GreetingCard({
  fullName,
  role,
  t,
}: {
  fullName: string;
  role: Role;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  const period = greetingPeriod();
  const name = greetingName(fullName);

  return (
    <Card className="mb-6">
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xl font-semibold text-foreground">{t(PERIOD_KEYS[period], { name })}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("greetingSubline")}</p>
        </div>
        {role !== "worker" && (
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/jobs">
                <Plus className="size-4" aria-hidden />
                {t("addJobOrderButton")}
              </Link>
            </Button>
            <Button asChild>
              <Link href="/inventory">
                <Plus className="size-4" aria-hidden />
                {t("addInventoryItemButton")}
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { GreetingCard };
