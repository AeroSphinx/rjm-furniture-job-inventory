/**
 * `npm run seed:reset` (design §21.4). Deletes the rows whose UUIDs fall in
 * the seeded ranges from `supabase/seed/010_business_data.sql`, then
 * re-runs `supabase db push --include-seed --yes` so the business data is
 * re-centred on the current month before grading — every seeded date is
 * expressed relative to `current_date` (§21.3), so re-seeding on the day of
 * evaluation is what makes the Dashboard sub-notes and the Reports default
 * range show real figures.
 *
 * Does not touch the three demo accounts or their `profiles` rows — those
 * are re-upserted (not deleted) by `npm run seed`, which must be run first
 * on a brand-new project but is a no-op to re-run here.
 *
 * `materials_block_stock_write` only fires on UPDATE, not DELETE, so these
 * deletes do not need the trigger's escape hatch (§12.3).
 */
import { execSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const DEV_PROJECT_REF = "twplmgailygbucbgjilc";

if (!SECRET_KEY) {
  console.error("SUPABASE_SECRET_KEY is empty. Paste it into .env.local before running `npm run seed:reset`.");
  process.exit(1);
}
if (!SUPABASE_URL || !SUPABASE_URL.includes(DEV_PROJECT_REF)) {
  console.error(`NEXT_PUBLIC_SUPABASE_URL does not point at the dev project (${DEV_PROJECT_REF}). Refusing to run.`);
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SECRET_KEY, { auth: { persistSession: false } });

// UUID prefixes used by supabase/seed/010_business_data.sql — customers,
// jobs, the opening ledger block and the movement ledger block,
// respectively. Deleting by prefix means a re-seed can never collide with
// a hand-created record, which uses `gen_random_uuid()` and will not land
// in these ranges.
const SEEDED_PREFIXES = {
  customers: "11111111-1111-4111-8111-",
  jobs: "22222222-2222-4222-8222-",
  inventory_transactions_opening: "33333333-3333-4333-8333-",
  inventory_transactions_moves: "44444444-4444-4444-8444-",
};

async function deleteByPrefix(table: string, column: string, prefix: string) {
  // `uuid` has no `like` operator over PostgREST (the column is typed, not
  // text), so the seeded range is expressed as a gte/lte bound instead —
  // every seeded id in a given block shares the same 24-character prefix
  // and only the last 12 hex digits vary.
  const { error, count } = await admin
    .from(table)
    .delete({ count: "exact" })
    .gte(column, `${prefix}000000000000`)
    .lte(column, `${prefix}ffffffffffff`);
  if (error) throw new Error(`delete ${table} failed: ${error.message}`);
  console.log(`  deleted ${count ?? 0} row(s) from ${table} (prefix ${prefix})`);
}

async function main() {
  console.log("Deleting previously seeded business data...");
  // Children before parents: transactions/costs before jobs/materials/customers,
  // job_pricing before jobs (cascades would handle most of this, but being
  // explicit keeps the order readable and safe to re-run).
  await deleteByPrefix("inventory_transactions", "id", SEEDED_PREFIXES.inventory_transactions_moves);
  await deleteByPrefix("inventory_transactions", "id", SEEDED_PREFIXES.inventory_transactions_opening);
  await deleteByPrefix("jobs", "id", SEEDED_PREFIXES.jobs);          // cascades job_pricing, job_status_history
  await deleteByPrefix("customers", "id", SEEDED_PREFIXES.customers);

  // Materials are matched by their seeded MAT-001..MAT-064 codes rather
  // than by UUID, and the seed file's own `on conflict (material_code) do
  // nothing` leaves an existing row (and its current_stock) untouched —
  // this reset re-centres dates, it does not undo manual stock movements
  // made against seeded materials after the original seed ran.

  // `db push --include-seed` only (re-)applies the seed file while it is
  // also applying a pending schema migration — once the 12 migrations are
  // already up to date it reports "Remote database is up to date" and
  // skips the seed entirely, which would silently leave a reset half-done.
  // `db query --file` runs the SQL file directly, every time, regardless
  // of migration state.
  console.log("Re-running supabase/seed/010_business_data.sql...");
  execSync("npx supabase db query --remote --file supabase/seed/010_business_data.sql --yes", {
    stdio: "inherit",
  });

  console.log("\nSeed reset complete. Business data is re-centred on the current month.");
}

main().catch((error) => {
  console.error("Seed reset failed:", error);
  process.exit(1);
});
