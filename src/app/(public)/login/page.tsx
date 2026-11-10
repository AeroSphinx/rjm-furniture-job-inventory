import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { isSignedIn } from "@/lib/auth";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { LoginForm } from "@/components/features/auth/LoginForm";

type LoginPageProps = {
  searchParams: Promise<{ reason?: string }>;
};

/**
 * The split login layout (Requirement 1.2). A signed-in visitor who
 * reopens `/login` is sent straight to the Dashboard — the mirror of the
 * proxy's own redirect (design §3.1) — rather than shown a sign-in form
 * for a session they already have.
 */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (await isSignedIn()) {
    redirect("/dashboard");
  }

  const { reason } = await searchParams;
  const t = await getTranslations("Auth");

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-center gap-8 bg-navy-900 p-10 text-white lg:flex">
        <div className="max-w-md">
          <p className="text-xs font-semibold tracking-wide text-dusk-300 uppercase">{t("eyebrow")}</p>
          <h1 className="mt-3 text-3xl font-semibold">{t("headline")}</h1>
          <p className="mt-3 text-dusk-100">{t("subcopy")}</p>

          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-full border border-dusk-600 px-3 py-1 text-xs font-medium text-dusk-100">
              {t("roleChipOwner")}
            </span>
            <span className="rounded-full border border-dusk-600 px-3 py-1 text-xs font-medium text-dusk-100">
              {t("roleChipWorker")}
            </span>
            <span className="rounded-full border border-dusk-600 px-3 py-1 text-xs font-medium text-dusk-100">
              {t("roleChipAdmin")}
            </span>
          </div>

          <div className="mt-6 rounded-md border border-dashed border-dusk-600 p-4 text-sm text-dusk-100">
            {t("dashedCardText")}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 shadow-sm">
          <div className="flex flex-col items-center gap-3 text-center">
            <BrandLogo size="md" priority />
            <div>
              <p className="text-lg font-semibold text-foreground">{t("logoTitle")}</p>
              <p className="text-sm text-muted-foreground">{t("logoSubtitle")}</p>
            </div>
          </div>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" aria-hidden />
            <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {t("authorizedAccessDivider")}
            </span>
            <span className="h-px flex-1 bg-border" aria-hidden />
          </div>

          <LoginForm deactivated={reason === "deactivated"} />

          <p className="mt-6 text-center text-xs text-muted-foreground">{t("footer")}</p>
        </div>
      </div>
    </div>
  );
}
