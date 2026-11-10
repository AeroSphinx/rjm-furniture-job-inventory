import { requireUser } from "@/lib/auth";
import { getServerClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/AppShell";
import { signOutAction } from "@/actions/auth";

/**
 * The auth gate every `(app)` route sits behind (design §3.1): loads the
 * signed-in profile, computes the sidebar's Low-Stock badge count from the
 * same `v_material_status` source the Alerts screen and the Dashboard use
 * (Requirement 13.3, design §20 — "no count anywhere in the app is
 * hardcoded"), and renders `AppShell` around the page.
 *
 * The "+ Add observation" dialog is built in Phase 6 (task 6.1); until
 * then the sidebar's feedback box renders with no handler, which is the
 * same deliberately-deferred state `FeedbackBox` already documents.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireUser();

  const supabase = await getServerClient();
  const { count } = await supabase
    .from("v_material_status")
    .select("id", { count: "exact", head: true })
    .in("stock_status", ["out_of_stock", "low_stock"]);

  return (
    <AppShell
      profile={{ fullName: profile.fullName, role: profile.role }}
      alertCount={count ?? 0}
      onLogout={signOutAction}
    >
      {children}
    </AppShell>
  );
}
