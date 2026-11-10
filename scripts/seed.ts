/**
 * `npm run seed` (design §21.2). Creates or updates the three demo accounts
 * through the Admin API — accounts cannot be created safely by plain SQL,
 * because GoTrue owns `auth.users` and hashes passwords with its own
 * settings — and upserts each one's `profiles` row. Business data (§21.3)
 * is a separate SQL seed file, run afterwards, because it needs these rows
 * to exist first.
 *
 * Safe to re-run: existing accounts get their password reset to the known
 * value and their profile re-upserted, rather than being duplicated
 * (Requirement 23.9).
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const DEV_PROJECT_REF = "twplmgailygbucbgjilc";

if (!SECRET_KEY) {
  console.error(
    "SUPABASE_SECRET_KEY is empty. Paste it into .env.local before running `npm run seed`.",
  );
  process.exit(1);
}
if (!SUPABASE_URL || !SUPABASE_URL.includes(DEV_PROJECT_REF)) {
  console.error(
    `NEXT_PUBLIC_SUPABASE_URL does not point at the dev project (${DEV_PROJECT_REF}). ` +
      "Refusing to run — this script must never touch a project it wasn't written for.",
  );
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SECRET_KEY, { auth: { persistSession: false } });

type DemoAccount = {
  role: "owner" | "admin_staff" | "worker";
  username: string;
  fullName: string;
  email: string;
  password: string;
  preferences: Record<string, unknown>;
};

// Table from design §21.2. Passwords are demo-only, fake data for an
// unattended grading run — not secrets, and never reused anywhere real.
const ACCOUNTS: DemoAccount[] = [
  {
    role: "owner",
    username: "owner",
    fullName: "Mang Roger Mendoza",
    email: "owner@rjm.local",
    password: "RjmOwner#2026",
    preferences: { simple_mode: false, visible_focus: true, show_labels: true },
  },
  {
    role: "admin_staff",
    username: "admin",
    fullName: "Aileen Cruz",
    email: "admin@rjm.local",
    password: "RjmAdmin#2026",
    preferences: { simple_mode: false, visible_focus: true, show_labels: true },
  },
  {
    role: "worker",
    username: "worker",
    fullName: "Dario Ramos",
    email: "worker@rjm.local",
    password: "RjmWorker#2026",
    // Simple mode starts ON for the worker demo account (settled decision D2).
    preferences: { simple_mode: true, visible_focus: true, show_labels: true },
  },
];

async function findUserByEmail(email: string) {
  // listUsers() is paginated; the demo set is three accounts, so one page
  // comfortably covers it without a search API call.
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw error;
  return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

async function seedAccount(account: DemoAccount) {
  const existing = await findUserByEmail(account.email);
  let userId: string;

  if (existing) {
    const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
      password: account.password,
      user_metadata: { full_name: account.fullName, username: account.username, role: account.role },
    });
    if (error) throw error;
    userId = data.user.id;
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,
      user_metadata: { full_name: account.fullName, username: account.username, role: account.role },
    });
    if (error) throw error;
    userId = data.user.id;
  }

  // `profiles_guard_self_edit` would normally refuse a write to role/username
  // /email from a caller with no `auth.uid()` — this succeeds because the
  // trigger exempts `service_role` (design §13.4), which is what makes
  // re-running this script safe.
  const { error: upsertError } = await admin.from("profiles").upsert(
    {
      id: userId,
      full_name: account.fullName,
      username: account.username,
      email: account.email,
      role: account.role,
      preferences: account.preferences,
      deactivated_at: null,
    },
    { onConflict: "id" },
  );
  if (upsertError) throw upsertError;

  return { ...account, userId };
}

async function main() {
  const results = [];
  for (const account of ACCOUNTS) {
    results.push(await seedAccount(account));
  }

  console.log("\nDemo accounts ready:\n");
  console.log("| Role         | Username | Password        |");
  console.log("| ------------ | -------- | ---------------- |");
  for (const r of results) {
    console.log(`| ${r.role.padEnd(12)} | ${r.username.padEnd(8)} | ${r.password.padEnd(16)} |`);
  }
  console.log(
    "\nPaste this table into the README's demo-accounts section. " +
      "These are fake-data demo credentials, not secrets.\n",
  );
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
