/**
 * The single version constant read by the sidebar feedback box, the login
 * footer, the Dashboard chip and `CHANGELOG.md` (Requirement 6.10), so the
 * four cannot drift apart.
 */
export const APP_VERSION = "Prototype v0.1";

/**
 * One page size, everywhere (design §20). Used by every list query's
 * `.range()` call and by `DataTable`'s pagination footer.
 */
export const PAGE_SIZE = 5;
