/**
 * Strips PostgREST's filter metacharacters and the two wildcards before a
 * user-typed search string is interpolated into an `.or(...)` filter
 * (design §3.2). Without this, a character typed into the search box
 * (seeded material and job names contain literal double quotes, e.g.
 * `3/4" Marine Plywood`) could change the shape of the filter rather than
 * just the value being searched for, and an unbalanced quote makes the
 * whole request come back `400 PGRST100`. Capped at 80 characters, same
 * as design §18.4's `q` limit.
 */
const FORBIDDEN = /["\\,().:*%]/g;

export function esc(q: string): string {
  return q.replace(FORBIDDEN, " ").trim().slice(0, 80);
}
