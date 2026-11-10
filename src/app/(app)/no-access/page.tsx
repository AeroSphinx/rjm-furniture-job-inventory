import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/patterns/PageHeader";
import { Button } from "@/components/ui/button";

/**
 * The "You do not have access to this page" screen (Requirement 3.9,
 * design §14.3, §20). `requireRole([...])` redirects here whenever a
 * signed-in user's role is not one of the roles a route allows — this page
 * never queries or renders anything from the route that sent it here, so
 * no restricted data ever reaches the page source for a direct navigation
 * to a restricted address.
 */
export default async function NoAccessPage() {
  const t = await getTranslations("NoAccess");

  return (
    <div className="mx-auto max-w-xl py-8">
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} purpose={t("purpose")} />

      <div className="flex flex-col items-start gap-4 rounded-md border border-border bg-card p-6">
        <ShieldAlert className="size-8 text-muted-foreground" aria-hidden />
        <Button asChild>
          <Link href="/dashboard">{t("backToDashboard")}</Link>
        </Button>
      </div>
    </div>
  );
}
