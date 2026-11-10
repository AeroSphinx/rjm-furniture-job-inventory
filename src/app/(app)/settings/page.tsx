import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/patterns/PageHeader";
import { PreferenceForm } from "@/components/features/settings/PreferenceForm";
import { loadPreferences } from "@/lib/prefs";
import { requireUser } from "@/lib/auth";

/**
 * `/settings` (design §20, Requirement 15.1-15.16): identical for every
 * role. No `loading.tsx` — this route renders from the profile the layout
 * already loaded and has no query of its own beyond that (design §3.1).
 */
export default async function SettingsPage() {
  await requireUser(); // every signed-in role may reach this page
  const t = await getTranslations("Settings");
  const prefs = await loadPreferences();

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} purpose={t("purpose")} />
      <PreferenceForm initial={prefs} />
    </div>
  );
}
