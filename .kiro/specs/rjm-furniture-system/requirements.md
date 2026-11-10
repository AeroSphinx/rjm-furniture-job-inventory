# Requirements — RJM Furniture Job & Inventory Management System

Prototype v0.1 · College HCI research prototype · Written 10 November 2026

## How to read this document

This document says **what** the system must do, not how to build it. The design document decides the how.

Each requirement has three parts:

1. A **user story** in the form *As a &lt;role&gt;, I want &lt;capability&gt;, so that &lt;benefit&gt;*.
2. **Acceptance criteria** written in EARS style. "EARS" is a simple way of writing a testable sentence: `WHEN <trigger> THEN the system SHALL <response>` for things that happen, and `IF <condition> THEN the system SHALL <response>` for states and rules. Each one is numbered (for example 8.3) so tasks, tests and the design can point at it.
3. A **tier** — `[MUST]`, `[SHOULD]` or `[STRETCH]` — explained in the next section.

At the end there is a table mapping all 22 of the professor's evaluation indicators to the requirements that satisfy them, and a list of decisions (some now settled, some still open).

Roles are abbreviated throughout: **Owner** (`owner`, Shop Owner), **Admin** (`admin_staff`, Admin Staff), **Worker** (`worker`, Carpenter/Worker).

## Scope and time budget

**Hard deadline: the professor evaluates the prototype on or about Saturday 14 November 2026.** Today is Tuesday 10 November 2026, which leaves roughly four working days for all implementation, documentation and deployment.

Because of that deadline every requirement below carries a tier:

- **`[MUST]`** — the graded minimum. Without it an indicator in the professor's matrix cannot be scored at all.
- **`[SHOULD]`** — materially raises a score, but the prototype is still demonstrable without it.
- **`[STRETCH]`** — build only if time remains after everything else works.

Three rules follow from the deadline and apply to the whole plan:

- The accessibility fundamentals are never tiered down. Contrast, 44×44 px touch targets, full keyboard operation, the skip link, visible focus rings, ARIA labelling, proper table headers, and the colour + icon + text status pattern are all `[MUST]`, because indicators 1, 2, 3 and 14 are four of the twenty-two scores.
- The files in `docs/` are graded deliverables, not polish. Indicators 16, 17, 19, 20, 21 and 22 are scored from those documents, so they are `[MUST]` and are written as the work proceeds rather than all at the end.
- Work proceeds in vertical slices (one screen working end to end) so that if the clock runs out, the prototype stops at a working state instead of mid-feature.

Requirements currently expected to land as `[STRETCH]`, and therefore to be described honestly as "designed but not implemented" in the research paper if they do not get built: job tasks (Requirement 22.9), the job material-cost rollup display (14.8), and the deeper accessibility evidence beyond a basic pass (24.7).

**In scope:** customers, job orders, inventory items (materials), inventory transactions, low-stock alerts, reports, settings and accessibility preferences, role-based login, user management, in-app usability feedback.

**Out of scope:** payroll, accounting, online payments, e-commerce, multi-branch operation, supplier management, purchase orders, barcode scanning, offline/PWA use, mobile native apps, file/photo uploads, email or SMS notifications.

## Plain-word glossary

The system uses the words the shop already uses. Software jargon is avoided in the UI.

| Term in the UI | Meaning |
| --- | --- |
| Job Order | One customer project (for example a 6-seater dining set), with a code like `JO-2026-018` |
| Material | Something kept in the workshop and consumed by jobs (lumber, nails, glue), with a code like `MAT-001` |
| Stock In | Materials arriving (a delivery, a restock) |
| Stock Out | Materials leaving, normally issued to a job order |
| Adjustment | A correction to a stock figure after a physical count |
| Minimum Level | The reorder point for a material |
| Low Stock | Stock is at or below the minimum level but not zero |
| Out of Stock | Stock is zero |
| Transaction | One row in the permanent record of stock movement, with a code like `TXN-1058` |
| Observation | One piece of usability feedback recorded inside the app |

## Assumptions

These are inferred, not stated by the user. If any is wrong, the affected requirement changes.

- **A1.** Single shop, single currency (PHP), single timezone (Asia/Manila). All dates shown in the UI are Manila dates.
- **A2.** Fake data only. No real customer information enters the dev project, so there is no privacy/retention requirement beyond not leaking secrets.
- **A3.** Expected usage is a handful of concurrent users on a shop desktop and personal phones; no load or scale requirement beyond keeping pages responsive with the seeded data volume.
- **A4.** The professor grades through a deployed Vercel URL and/or a live walkthrough, using the three seeded demo accounts, without the student present. Demo mode is therefore ON for the graded deployment.
- **A5.** Materials are tracked as a single total per material. There is no per-location or per-batch stock.
- **A6.** A job order has one assigned worker at a time (the wireframe shows a single "Assigned Worker" column), though workers can read every job because jobs get reassigned and shared.
- **A7.** Browsers are current Chrome/Edge/Safari on desktop and Android/iOS. No IE11 or legacy support.
- **A8.** Prices and costs are plain decimal amounts entered by hand; there is no tax, discount or VAT calculation.

---

# Requirements

## Requirement 1 — Login screen and sign-in `[MUST]`

**User story.** As a staff member of RJM Furniture, I want to sign in with the username or email the owner gave me, so that I can reach my work without creating an account myself.

**Acceptance criteria.**

1.1 WHEN an unauthenticated visitor opens any address in the app THEN the system SHALL show the Login screen.
1.2 The Login screen SHALL use a split layout: a dark left panel containing an eyebrow label, the headline "One workshop. One organized system.", the subcopy "Manage customer jobs, project progress, and workshop materials in one beginner-friendly place.", three role chips reading "SHOP OWNER", "CARPENTER / WORKER" and "ADMIN STAFF", and a dashed card reading "Built around real workshop tasks — Clear steps · Familiar terms · Less paperwork"; and a light right-hand card containing the RJM logo, the titles "RJM Furniture" and "Carpentry Job & Inventory Management System", a divider labelled "AUTHORIZED ACCESS", the sign-in form, and the footer "RJM Furniture · Internal Business System · Prototype v0.1".
1.3 The sign-in form SHALL contain a required "Username or Email" field, a required "Password" field with a Show/Hide toggle, a "Remember me" checkbox, a "Forgot password?" link positioned opposite the checkbox, a full-width primary button "Login to System →", and the helper text "Need help? Contact the system administrator."
1.4 WHEN the user submits the form with an entry that contains no `@` THEN the system SHALL resolve that entry against stored usernames on the server to find the matching account email before attempting sign-in.
1.5 WHEN the user submits the form with an entry that contains an `@` THEN the system SHALL treat the entry as an email address.
1.6 IF sign-in fails for any reason — unknown username, unknown email, wrong password, or a disabled account — THEN the system SHALL display exactly one generic message, "Incorrect username/email or password" (and its Filipino equivalent), and SHALL NOT reveal whether the account exists.
1.7 WHEN sign-in succeeds THEN the system SHALL create a cookie-based session and redirect to the Dashboard.
1.8 WHEN the user activates the Show toggle THEN the system SHALL reveal the password text, change the toggle's accessible label to describe the new action, and keep keyboard focus on the toggle.
1.9 IF "Remember me" is ticked THEN the system SHALL keep the session across browser restarts; IF it is not ticked THEN the session SHALL expire when the browser session ends.
1.10 WHEN either required field is empty on submit THEN the system SHALL show inline validation beneath that field, move focus to the first field in error, and SHALL NOT call the authentication service.
1.11 WHILE a sign-in request is in flight the system SHALL disable the submit button and show a loading state on it, so a second submission cannot be sent.
1.12 WHEN five failed attempts occur from the same browser within five minutes THEN the system SHALL delay further attempts (simple client-side throttle with a visible countdown message) while still returning the same generic error text.
1.13 The username field SHALL have `autocomplete="username"`, the password field `autocomplete="current-password"`, and both SHALL be labelled by visible `<label>` elements.

## Requirement 2 — "Forgot password?" honest recovery dialog `[MUST]`

**User story.** As a worker who forgot my password, I want the app to tell me plainly how to get back in, so that I am not stuck waiting for an email that never arrives.

**Acceptance criteria.**

2.1 WHEN the user activates "Forgot password?" THEN the system SHALL open an accessible modal dialog on the same page, not navigate away and not open a mail client.
2.2 The dialog SHALL explain in the active language that passwords are reset by the shop owner, and SHALL name the concrete next step ("Contact the shop owner or system administrator to be given a new temporary password").
2.3 The dialog SHALL offer a "Back to login" action that closes it and returns keyboard focus to the "Username or Email" field.
2.4 WHEN the dialog opens THEN the system SHALL move focus into the dialog, trap focus inside it, label it with `aria-labelledby`, and close it on `Escape`.
2.5 The system SHALL NOT send password-reset emails and SHALL NOT depend on SMTP configuration in the Supabase project.
2.6 The documented recovery path SHALL be the Owner resetting the password on the Users page (Requirement 5.8).

## Requirement 3 — Roles and permissions enforced at the database `[MUST]`

**User story.** As the shop owner, I want each role to be limited to what that person actually needs, enforced by the database and not just hidden in the screen, so that the limits hold even if someone pokes at the app.

**Acceptance criteria.**

3.1 The system SHALL support exactly three roles: `owner`, `admin_staff` and `worker`, stored on the user's profile row.
3.2 IF the signed-in user is `owner` THEN the system SHALL allow full access: customers, job orders, materials, transactions, reports, settings, user management, and all price and cost figures.
3.3 IF the signed-in user is `admin_staff` THEN the system SHALL allow create, read and update on customers, job orders, materials and transactions, and read access to Reports, and SHALL deny access to user management.
3.4 IF the signed-in user is `worker` THEN the system SHALL allow read access to **all** job orders, update of the **status field only** on job orders assigned to that worker, creation of `stock_out` transactions referencing a job order assigned to that worker, and read-only access to materials.
3.5 IF the signed-in user is `worker` THEN the system SHALL deny: any delete, any edit of prices or costs, user management, the Reports page, and the Users page.
3.6 IF a `worker` attempts to update any job order field other than `status`, or the status of a job not assigned to them THEN the system SHALL reject the write at the database layer and the UI SHALL show a human-readable refusal explaining who can make that change.
3.7 IF a `worker` attempts to change a job order whose status is `completed` THEN the system SHALL reject the change and explain that completed jobs are closed for editing.
3.8 Every table SHALL have row level security enabled, explicit grants for the `authenticated` role, and explicit policies; a table with no grant or policy SHALL be treated as a defect because the Supabase project has "Automatically expose new tables" OFF and automatic RLS ON.
3.9 WHEN a user without permission navigates directly to a restricted address THEN the system SHALL respond with a "You do not have access to this page" screen that offers a link back to the Dashboard, and SHALL NOT render any restricted data in the page source.
3.10 The UI SHALL hide or disable controls a role cannot use, and this SHALL be documented as a second layer only — never the sole protection.
3.11 Every policy SHALL be explained in plain prose in the design document, in terms a student can defend verbally: who it lets do what, and why.

## Requirement 4 — Workers cannot see prices or costs, enforced in the data layer `[MUST]`

**User story.** As the shop owner, I want quoted prices and material costs invisible to workers in the data itself, so that money figures cannot leak through a page, an export or a network response.

**Acceptance criteria.**

4.1 The money values treated as restricted SHALL be the quoted price of a job order, the unit cost of a material and the historical unit cost recorded on a stock movement. *(Amended after the design review: the design places these in their own one-to-one tables — `job_pricing.quoted_price`, `material_costs.unit_cost` and `inventory_transaction_costs.unit_cost_at_time` — rather than as columns on `jobs`, `materials` and `inventory_transactions`, because Supabase puts every signed-in user in one Postgres role and per-role column privileges are therefore impossible. The restricted values and the rule below are unchanged. See design §7.1 and §8; this amendment needs the user's approval before Phase 2.)*
4.2 IF the signed-in user is `worker` THEN any query path available to that user SHALL NOT return the restricted columns, enforced in Postgres (not by filtering in the browser).
4.3 WHEN a `worker` views a job order or a material THEN the UI SHALL omit the price/cost fields entirely rather than showing an empty or masked value.
4.4 IF a `worker` requests a restricted column explicitly THEN the request SHALL fail or return no such column, and the UI SHALL show a generic "Some details are not available for your role" note rather than an error stack.
4.5 The design SHALL choose and justify exactly one data-layer enforcement mechanism, SHALL explain why it is the simpler and safer option for a student to maintain, and SHALL state the trade-off against **both** of the mechanisms originally offered — column-level `GRANT`/`REVOKE`, and role-filtered views that exclude the cost columns. *(Amended after the design review: the earlier wording required picking one of those two; the design picks a third — money in its own tables behind ordinary RLS policies — and argues the other two down in §8.2–§8.4.)*
4.6 Computed money values (for example a job's material cost) SHALL be produced only on paths that workers cannot reach.

## Requirement 5 — Users management page (Owner only) `[MUST]` for the list, `[SHOULD]` for edit/reset

**User story.** As the shop owner, I want to create and manage staff accounts myself, so that nobody can sign themselves up and every account has a known role.

**Acceptance criteria.**

5.1 The Users page SHALL be visible and reachable only for `owner`; it SHALL NOT appear in the sidebar for other roles.
5.2 The Users page SHALL list every profile with full name, username, role, and date created, using a data table with proper header cells and a caption.
5.3 The page SHALL offer an "+ Add User" action opening a form with full name (required), username (required, unique), role (required, one of the three), and temporary password (required).
5.4 WHEN the Owner submits a valid new user THEN the system SHALL create the account through a server-side route or action that uses the Supabase secret key, SHALL create the matching profile row with the chosen role, and SHALL confirm with a success toast naming the created user.
5.5 The system SHALL never expose the Supabase secret key to the browser, and SHALL never include it in any committed file or document.
5.6 IF the submitted username already exists THEN the system SHALL reject the form with an inline message on the username field, saying the username is taken and to choose another.
5.7 IF a non-`owner` calls the user-creation endpoint directly THEN the system SHALL refuse with an authorisation error and SHALL create nothing.
5.8 `[SHOULD]` The Owner SHALL be able to set a new temporary password for an existing user, and to change a user's role, through the same server-side admin route, with a confirmation dialog before the change.
5.9 `[SHOULD]` The Owner SHALL be able to deactivate a user; a deactivated user SHALL fail sign-in with the same generic message from 1.6.
5.10 IF the Owner attempts to change their own role or deactivate their own account THEN the system SHALL block the action and explain that the shop must keep at least one owner.
5.11 Temporary passwords SHALL be validated as at least 8 characters, and the form SHALL state that rule before submission.

## Requirement 6 — Application shell: sidebar, top bar, mobile navigation `[MUST]`

**User story.** As any user, I want the same frame around every screen with the navigation always in the same order, so that I never have to relearn where things are.

**Acceptance criteria.**

6.1 Every authenticated screen SHALL render a dark (Midnight Navy) left sidebar containing the logo, the wordmark "RJM Furniture" with the sub-line "Job & Inventory System", and the navigation list in this exact order: Dashboard, Job Orders, Inventory, Inventory Transactions, Low-Stock Alerts, Reports, Settings.
6.2 The "Low-Stock Alerts" item SHALL carry a count badge whose number is computed from current data (never hardcoded), and the badge SHALL also convey its meaning in text to assistive technology (for example "Low-Stock Alerts, 3 items need attention").
6.3 IF the signed-in user is `worker` THEN the sidebar SHALL omit Reports and Users; IF the user is `admin_staff` THEN it SHALL omit Users.
6.4 The sidebar SHALL show, near the bottom, a dashed "Usability Feedback" box containing the version label "Prototype v0.1", the line "Ready for testing", and an "+ Add observation" button, followed by a "Logout" action.
6.5 The top bar SHALL show "RJM FURNITURE" above "Carpentry Job & Inventory Management System" on the left, and on the right a user menu with avatar, the signed-in user's full name, their role label, and a chevron.
6.6 WHEN the user opens the user menu THEN it SHALL offer at least Settings and Logout, SHALL be keyboard operable with arrow keys, and SHALL close on `Escape` returning focus to the trigger.
6.7 WHEN the viewport is narrower than the tablet breakpoint THEN the sidebar SHALL collapse into a drawer opened by a labelled menu button, SHALL trap focus while open, SHALL close on `Escape` and on navigation, and SHALL return focus to the menu button.
6.8 The current page's navigation item SHALL be visually marked and SHALL carry `aria-current="page"`.
6.9 Every screen SHALL begin with a small eyebrow label, a page title as a single `<h1>`, and a one-line purpose statement (the exact lines are given per screen in Requirements 7–16).
6.10 The Dashboard SHALL show a "Prototype v0.1" chip at the top right; the version string in the sidebar box, the login footer, the chip and the changelog SHALL all come from one constant so they cannot drift apart.
6.11 WHEN the user activates Logout THEN the system SHALL end the session, clear auth cookies, and return to the Login screen.
6.12 Every page SHALL start with a "Skip to main content" link as the first focusable element, which moves focus to the main landmark.

## Requirement 7 — Dashboard `[MUST]`

**User story.** As the shop owner, I want one overview screen that shows active work, stock warnings and the two actions I take most often, so that I know what needs attention the moment I sign in.

**Acceptance criteria.**

7.1 The Dashboard SHALL use the title "Dashboard" and the purpose line "A quick shop overview that prioritizes active work, stock warnings, and common actions."
7.2 The Dashboard SHALL show a greeting card with a time-aware greeting that includes the user's first name or nickname (for example "Good morning, Mang Roger."), the line "Here is what is happening in your workshop today.", and the quick actions "+ Add Job Order" and "+ Add Inventory Item".
7.3 IF the signed-in user is `worker` THEN the quick actions the role cannot perform SHALL be hidden rather than shown disabled.
7.4 The Dashboard SHALL show six KPI cards, each with a label, a large number, a sub-note and an icon: Total Job Orders, Pending Jobs, Ongoing Jobs, Completed Jobs, Inventory Items, Low-Stock Materials.
7.5 Every number and every sub-note SHALL be computed from the database. The computed sub-notes SHALL be: "+N this month" (job orders with an order date in the current month), "Needs scheduling" (static label for pending), "N due this week" (in-progress jobs whose expected completion falls within the next 7 days), "N% completion rate" (completed ÷ total), "Across N categories" (distinct material categories), and "Action required" (shown only when the low-stock count is above zero). Any wireframe sub-note that cannot be derived from a query the page already runs SHALL be removed, not hardcoded.
7.6 The Dashboard summary figures SHALL be fetched in a single round trip (one database view or RPC) rather than six separate client queries.
7.7 The Dashboard SHALL show a "Recent Job Orders" card, subtitle "Latest customer projects", a "View all jobs →" link, and a table with the columns Job Order, Customer, Project, Due Date, Status and a per-row View link, listing the five most recent job orders.
7.8 The Dashboard SHALL show a "Job Status Overview" card stating the total number of job orders and one horizontal bar **per job status present in the data (up to four: Completed, In Progress, Pending, On Hold)**, each with both the job count and the percentage shown as text beside the bar. *(Amended after the third design review: the wireframe's three bars cannot represent the On Hold job its own Job Orders list shows, and the seeded data keeps that job, so the bars are computed from the status counts rather than fixed at three. See design §20 and §21.3.)*
7.9 The Dashboard SHALL show a "Low-Stock Alerts" card with subtitle "Materials needing attention", a "View alerts →" link, and a row per affected material giving the name, the remaining quantity with its unit, the minimum level, and a status chip.
7.10 The Dashboard SHALL show a "Recent Inventory Activity" card with subtitle "Latest stock movement", each row carrying a direction icon, the material name, a line in the form "Stock Out · 12 board ft · JO-2026-018" (an em dash where there is no related job order), and a right-aligned date.
7.11 WHILE Dashboard data is loading the system SHALL show skeleton placeholders matching the final layout, not a blank page or a layout jump.
7.12 IF a Dashboard section has no data THEN that section SHALL show an empty state with one sentence of explanation and, where the role permits, a button for the obvious next step.
7.13 IF loading the Dashboard summary fails THEN the system SHALL show an inline error card with a "Try again" button, keep the rest of the page usable, and log the failure server-side.

## Requirement 8 — Job Orders list `[MUST]`

**User story.** As admin staff, I want to search, filter and review every job order in one list, so that I can answer a customer's question without leafing through a notebook.

**Acceptance criteria.**

8.1 The screen SHALL use the title "Job Order Management" and the purpose line "Search, filter, review, and maintain customer job orders from one organized list."
8.2 The screen SHALL show a card headed "All Job Orders" with a sub-line giving the record count and freshness, in the form "42 records · Updated just now", where the count is computed.
8.3 The toolbar SHALL contain a search field with the placeholder "Search by ID, customer, or project...", a "Job Status: All" select, and a primary "+ Add New Job Order" button.
8.4 The table SHALL have these columns in order: Job Order ID, Customer Name, Project Name, Order Date, Expected Completion, Assigned Worker, Job Status, Actions.
8.5 WHEN the user types in the search field THEN the system SHALL filter by job code, customer name or project name, debounced, and SHALL announce the new result count to assistive technology.
8.6 WHEN the user picks a status in the filter THEN the system SHALL show only job orders with that status and SHALL keep the choice visible in the control.
8.7 IF a search or filter returns nothing THEN the system SHALL show an empty state naming what was searched for and offering a "Clear filters" action.
8.8 The list SHALL be paginated with a footer in the form "Showing 1–5 of 42 records" plus Previous, numbered pages and Next controls, each with an accessible label.
8.9 The Actions column SHALL offer View, Edit and Delete as icon buttons, each with a text label when the "descriptive button labels" preference is on and an `aria-label` at all times.
8.10 IF the signed-in user is `worker` THEN the Delete action SHALL be absent, the Edit action SHALL open the status-only update form, and the quoted price SHALL not appear anywhere on the screen.
8.11 Dates SHALL be formatted in the en-PH style shown in the wireframe (for example "May 20, 2025").
8.12 Sorting SHALL default to newest order date first.
8.13 Each status value SHALL render with colour, an icon and a text label together (Requirement 19).

## Requirement 9 — Job order create, edit and customers `[MUST]`

**User story.** As admin staff, I want to record a new customer job in a short guided form, so that nothing important is missed and the job gets a proper code.

**Acceptance criteria.**

9.1 The create form SHALL capture customer (choose existing or add new), project name, description, order date, expected completion, assigned worker, status and quoted price.
9.2 WHEN the form is submitted and valid THEN the system SHALL create the job order, assign the next job code in the format `JO-YYYY-NNN`, show a success toast naming the new code, and return to the list with the new row visible.
9.3 The job code SHALL be generated safely under concurrent inserts (no `max()+1` race) and its sequence SHALL restart at 001 each calendar year.
9.4 Validation SHALL be applied with the same schema on the client and on the server: project name required (2–120 characters), customer required, order date required and not more than one year in the future, expected completion optional but SHALL NOT be earlier than the order date, quoted price optional, numeric, zero or greater, maximum 9,999,999.99, status one of the four allowed values, assigned worker optional and SHALL reference an existing profile.
9.5 IF validation fails THEN the system SHALL show a message under each offending field explaining in plain words how to fix it, move focus to the first field in error, and SHALL NOT submit.
9.6 IF the user has unsaved changes and attempts to navigate away or close the dialog THEN the system SHALL warn that changes will be lost and offer Stay and Discard.
9.7 WHEN the form has more than six fields, or the "Simple mode" preference is on, THEN the system SHALL present it as numbered steps with a visible step indicator and Back/Next controls.
9.8 IF the signed-in user is `worker` THEN the only editable control SHALL be status, limited to jobs assigned to that worker, and the form SHALL state that restriction in plain words.
9.9 WHEN a job order's status is changed THEN the system SHALL record the change time and show a confirmation toast stating the old and new status.
9.10 The customer record SHALL hold name (required, 2–120 characters), phone (optional, validated as a Philippine mobile or landline pattern), address (optional, up to 300 characters) and notes (optional, up to 1,000 characters).
9.11 IF the user adds a customer whose name and phone match an existing customer THEN the system SHALL warn about the possible duplicate and offer to use the existing record instead.
9.12 The job order detail view SHALL show the job's details, its assigned worker, its status history where available, and the list of materials issued to it (its `stock_out` transactions).
9.13 IF a save fails because of a network or server error THEN the system SHALL keep the entered values on screen, show an error toast with a "Try again" action, and SHALL NOT silently lose the input.

## Requirement 10 — Inventory (materials) `[MUST]`

**User story.** As admin staff, I want material quantities and reorder needs easy to scan, so that I can see at a glance what is running out.

**Acceptance criteria.**

10.1 The screen SHALL use the title "Inventory Management" and the purpose line "Makes material quantities and reorder needs easy to scan and update."
10.2 The screen SHALL show a card headed "Material Inventory" with a computed sub-line in the form "64 items · 3 require attention".
10.3 The toolbar SHALL contain a search field with the placeholder "Search material ID or name...", a "Category: All" select, and a primary "+ Add Inventory Item" button.
10.4 IF one or more materials are at or below their minimum level THEN the screen SHALL show a warning banner reading "Stock attention needed — N materials are at or below their minimum level. Review alerts before assigning materials to jobs." with a "View alerts" link, where N is computed.
10.5 The table SHALL have these columns in order: Material ID, Material Name, Category, Current Stock, Unit, Minimum Level, Stock Status, Actions.
10.6 WHEN a material is created THEN the system SHALL assign the next code in the format `MAT-NNN`, generated safely under concurrent inserts.
10.7 Validation on the material form SHALL be: name required (2–120 characters) and unique within a category, category required (chosen from the shop's list), unit required (chosen from board ft, sheets, kg, liters, boxes, pairs, pieces), minimum level required, numeric, zero or greater, unit cost required for Owner and Admin (numeric, zero or greater) and never shown to workers, opening stock optional and zero or greater.
10.8 The system SHALL NOT allow the current stock figure to be edited directly on this form; stock SHALL change only through a transaction (Requirement 12), and the form SHALL say so in helper text.
10.9 IF the signed-in user is `worker` THEN the screen SHALL be read-only: no Add, Edit or Delete, and no Unit Cost column.
10.10 Stock status SHALL be derived, never stored: Out of Stock when current stock is 0, Low Stock when current stock is at or below the minimum level and above 0, otherwise In Stock.
10.11 The list SHALL be paginated and searchable on the same pattern as Requirement 8.
10.12 WHEN a material is deleted THEN the system SHALL soft delete it (Requirement 20) and SHALL keep its past transactions readable.
10.13 IF a material has stock above zero THEN deleting it SHALL require an extra confirmation stating the remaining quantity.

## Requirement 11 — Inventory Transactions screen `[MUST]`

**User story.** As admin staff, I want a traceable history of everything that entered and left the workshop, so that a stock figure can always be explained.

**Acceptance criteria.**

11.1 The screen SHALL use the title "Inventory Transactions" and the purpose line "Provides a traceable history of materials entering and leaving the workshop."
11.2 The screen SHALL show a card headed "Stock Movement History" with the subtitle "All material stock-in and stock-out records".
11.3 The toolbar SHALL contain a search field with the placeholder "Search ID, material, or job order...", a "Transaction Type: All" select, and the buttons "+ Record Stock In" and "Record Stock Out".
11.4 The screen SHALL show an information banner reading "Inventory traceability — Every confirmed transaction automatically updates the material's current stock."
11.5 The table SHALL have these columns in order: Transaction ID, Material Name, Transaction Type, Quantity, Date, Reason / Description, Related Job Order — the last showing a link to the job order or an em dash when there is none.
11.6 Quantity SHALL always be displayed with its unit (for example "12 board ft").
11.7 WHEN a transaction is created THEN the system SHALL assign the next code in the format `TXN-NNNN`, generated safely under concurrent inserts.
11.8 The ledger SHALL be append-only: the system SHALL NOT offer edit or delete on a transaction row.
11.9 IF a transaction was recorded in error THEN the only correction path SHALL be a new `adjustment` transaction whose reason is required, and the UI SHALL explain this where a user would look for Edit.
11.10 IF the signed-in user is `worker` THEN the screen SHALL show only "Record Stock Out", limited to job orders assigned to that worker, and SHALL NOT show any cost column.
11.11 The list SHALL be paginated and filterable on the same pattern as Requirement 8, and SHALL default to newest first.
11.12 Each transaction type SHALL render with colour, a direction icon and a text label together.

## Requirement 12 — Stock movement rules `[MUST]`

**User story.** As the shop owner, I want the stock figure and the record of movement to always agree, so that the system never tells me I have material I do not have.

**Acceptance criteria.**

12.1 WHEN a transaction is confirmed THEN the system SHALL insert the ledger row and update the material's current stock inside one database transaction, through a Postgres function exposed as an RPC.
12.2 IF the function fails at any point THEN the system SHALL roll back both the ledger row and the stock change, leaving no partial result, and the caller SHALL receive a named error code plus a human-readable message.
12.3 The system SHALL revoke the ability for application clients to update `materials.current_stock` directly, so the only path to changing stock is the function.
12.4 IF a `stock_out` would take a material's stock below zero THEN the function SHALL reject it and return an error naming the material, the requested quantity and the available quantity.
12.5 IF a material's current stock is 0 THEN the system SHALL NOT allow it to be issued to a job order, and the UI SHALL show the option disabled with a visible explanation ("Out of stock — add stock before issuing this material to a job").
12.6 Quantity validation SHALL be: required, numeric, greater than zero, at most 4 decimal places, and at most the available stock for a `stock_out`.
12.7 IF the transaction type is `stock_out` and a job order is selected THEN the job order SHALL exist, SHALL NOT be soft deleted, and (for workers) SHALL be assigned to the acting user.
12.8 WHEN a `stock_out` is recorded THEN the system SHALL store the material's current unit cost on the transaction row as `unit_cost_at_time`, so later cost figures do not change when prices change.
12.9 A job order's material cost SHALL be computed as the sum of quantity × `unit_cost_at_time` over that job's `stock_out` transactions.
12.10 WHEN a transaction succeeds THEN the UI SHALL show a success toast naming the material, the quantity and the new stock level, and the affected lists SHALL refresh without a full page reload.
12.11 IF two users record movements of the same material at the same moment THEN both transactions SHALL be recorded in order and the resulting stock figure SHALL equal the arithmetic sum of all movements (no lost update).
12.12 An `adjustment` transaction SHALL be allowed to raise or lower stock, SHALL require a reason, SHALL still refuse to take stock below zero, and SHALL be permitted for Owner and Admin only.
12.13 The reason/description field SHALL be required for `stock_in` and `adjustment`, optional for `stock_out`, and limited to 300 characters.

## Requirement 13 — Low-Stock Alerts `[MUST]`

**User story.** As the shop owner, I want shortages surfaced before they stop work, so that I can restock in time to keep jobs moving.

**Acceptance criteria.**

13.1 The screen SHALL use the title "Low-Stock Alerts" and the purpose line "Surfaces urgent material shortages before they delay carpentry work."
13.2 The screen SHALL show a prominent banner with a warning icon, the computed line "N materials need attention", the computed breakdown "N out of stock · N below minimum level", and a "View Inventory" button.
13.3 Every count on this screen, and the sidebar badge, SHALL be computed from the same query, so the banner total always equals the number of rows in the table. (The wireframe's banner said 3 while its table listed 4 rows; this deviation is deliberate and is recorded in `docs/design-rationale.md`.)
13.4 IF at least one material is out of stock THEN the screen SHALL show a notice in the form "Out of stock — &lt;material&gt; cannot be issued to a job until stock is added.", naming the actual materials.
13.5 The screen SHALL show the advisory notice "Low-stock warning — Review upcoming jobs before restocking to avoid project delays."
13.6 The screen SHALL show a card headed "Low-Stock Materials" with the subtitle "Sorted by urgency" plus a timestamp of the last refresh, and a table with the columns Material Name (with its code beneath), Category, Current Quantity, Minimum Stock Level, Stock Status, Last Updated and Action.
13.7 Rows SHALL be sorted with out-of-stock materials first, then by how far below the minimum level each material sits.
13.8 The Action cell SHALL offer a "Record stock in" link that opens the stock-in form with that material pre-selected; IF the user is a `worker` THEN the link SHALL be absent because workers cannot record stock in.
13.9 IF no material is at or below its minimum level THEN the screen SHALL show a positive empty state ("All materials are above their minimum level") instead of an empty table.
13.10 WHEN a stock-in transaction clears a shortage THEN the alert count and this list SHALL reflect the change on the next render without a manual refresh.

## Requirement 14 — Reports `[MUST]` on screen, `[SHOULD]` for CSV and print

**User story.** As the shop owner, I want a plain summary of jobs and materials for a date range, so that I can make practical decisions and show progress.

**Acceptance criteria.**

14.1 The screen SHALL use the title "Reports" and the purpose line "Summarizes job and inventory performance for practical owner decision-making."
14.2 The Reports page SHALL be reachable by `owner` and `admin_staff` only; `worker` requests SHALL be refused per 3.9.
14.3 The screen SHALL show a toolbar strip labelled "REPORT DATE RANGE" with a range selector and a "Print Report" button.
14.4 The screen SHALL show a "Job Order Summary" card carrying the selected range as its subtitle and four tiles: Total Job Orders, Completed Jobs, Pending Jobs and Ongoing Jobs, each with its count and the share of all jobs as a percentage.
14.5 The screen SHALL show an "Inventory Summary" card with the subtitle "Current workshop stock" and the label/value rows Total inventory items, Material categories, Low-stock materials, and Transactions in the selected range.
14.6 The screen SHALL show a "Most Frequently Used Materials" card with the subtitle "Based on stock-out transactions", ranking materials by total quantity issued in the range, with the quantity and unit shown.
14.7 The screen SHALL show a "Low-Stock Materials Report" card with the subtitle "Items at or below reorder level" and the columns Material, Current, Minimum, Status and Suggested Action.
14.8 `[STRETCH]` The Job Order Summary SHALL additionally show total material cost per completed job, visible to `owner` only.
14.9 All report figures SHALL be computed from the database for the selected range; none SHALL be hardcoded.
14.10 `[SHOULD]` WHEN the user activates "Export CSV" THEN the system SHALL download a UTF-8 CSV of the report tables with a header row and a filename containing the range, and SHALL escape commas, quotes and newlines in values.
14.11 `[SHOULD]` WHEN the user activates "Print Report" THEN a print stylesheet SHALL hide the sidebar, top bar and interactive controls, keep the brand header, and fit the cards to A4 portrait.
14.12 IF a report query returns no rows for the range THEN each affected card SHALL show an empty state naming the range rather than a zero-filled table.
14.13 The page footer SHALL read "RJM Furniture · Academic HCI Prototype" on the left and "Keyboard-friendly · High contrast · Descriptive labels" on the right.
14.14 IF a report query fails THEN the page SHALL show an inline error for that card only, with a "Try again" action, and SHALL log the failure server-side.

## Requirement 15 — Settings and the preference system `[MUST]`

**User story.** As a worker who finds small text hard to read, I want to change language, text size and display options and have them remembered, so that the app suits me every time I sign in.

**Acceptance criteria.**

15.1 The screen SHALL use the title "Settings" and the purpose line "Supports language, text size, display, and accessibility preferences for diverse users."
15.2 The screen SHALL present four cards in a 2×2 grid on desktop, stacking on mobile: Language Preferences ("Prepares the system for different staff needs"), Text Size Preferences ("Choose a comfortable reading size"), Display Preferences, and Accessibility Options ("Support keyboard and assistive technology users").
15.3 The Language card SHALL offer a "System Language" select with English and Filipino. The wireframe's note claiming Filipino is reserved for a future release SHALL be removed, because the system ships both languages; the deviation is recorded in `docs/design-rationale.md`.
15.4 The Text Size card SHALL offer three segmented options — "Aa Standard", "Aa Large", "Aa Extra Large" — each previewing its own size, with exactly one selected at a time and keyboard arrow-key navigation between them.
15.5 The Display card SHALL offer "High contrast mode — Increase separation between text and surfaces" and "Reduce motion — Limit non-essential interface movement".
15.6 The Accessibility card SHALL offer "Visible keyboard focus — Show a strong outline on focused controls" and "Descriptive button labels — Keep text labels beside interface symbols".
15.7 The screen SHALL additionally offer a "Simple mode" toggle (absent from the wireframe) described as "Fewer columns and filters, bigger buttons, and step-by-step forms"; the deviation is recorded in `docs/design-rationale.md`.
15.8 Preferences SHALL be stored per user in the database (on the user's profile), not only in the browser, so they follow the user to another device.
15.9 WHEN the user saves preferences THEN the system SHALL persist them, apply them immediately without a reload, and show a success toast.
15.10 WHEN a signed-in user loads any page THEN their saved preferences SHALL already be applied in the first rendered HTML, with no flash of the default appearance.
15.11 Every preference SHALL visibly change the interface: language switches all UI text; text size scales the whole type scale; high contrast raises contrast of text, borders and surfaces; reduce motion removes non-essential animation; visible keyboard focus strengthens focus outlines; descriptive labels shows text beside icon buttons; simple mode reduces table columns and filters, enlarges primary buttons and splits long forms into steps.
15.12 IF the operating system reports `prefers-reduced-motion: reduce` THEN the system SHALL behave as though reduce motion is on, even when the stored preference is off.
15.13 IF the signed-in user is `worker` and has never saved preferences THEN Simple mode SHALL default to ON; for `owner` and `admin_staff` it SHALL default to OFF. Any user may change it at any time.
15.14 The screen SHALL show a bottom bar with the line "Preferences apply to this device and user profile." and a "Save Preferences" button.
15.15 IF saving preferences fails THEN the system SHALL keep the user's chosen values on screen, show an error toast with "Try again", and SHALL NOT revert the controls silently.
15.16 IF a stored preference value is unknown or corrupt THEN the system SHALL fall back to that preference's default and SHALL NOT fail the page render.

## Requirement 16 — English and Filipino interface `[MUST]`

**User story.** As a carpenter more comfortable in Filipino, I want the whole app in Filipino using the words we actually say in the shop, so that I understand every screen without guessing.

**Acceptance criteria.**

16.1 The system SHALL ship complete English and Filipino message files covering labels, buttons, page titles, purpose lines, helper text, validation messages, empty states, confirmation dialogs and toasts. No user-visible string SHALL be hardcoded in a component.
16.2 The Filipino register SHALL be workshop Taglish: informal-polite second person, short sentences, no academic Tagalog. Example target: "Walang stock na natitira. Mag-record ka muna ng Stock In bago ito gamitin sa job order."
16.3 These domain terms SHALL remain in English in the Filipino interface because the shop already uses them: "Job Order", "Stock In", "Stock Out", "Inventory", "Low Stock", "Out of Stock", "In Stock", "Dashboard", "Reports", "Settings", and the unit names (board ft, sheets, kg, liters, boxes, pairs).
16.4 WHEN the user switches language THEN every visible string SHALL change on the next render, including validation errors already on screen, and the choice SHALL persist with the user's profile.
16.5 Dates SHALL be formatted for en-PH (for example "May 20, 2025") and money as Philippine pesos with the ₱ symbol and two decimals (for example "₱12,500.00") in both languages.
16.6 Quantities SHALL be shown with the shop's units (board ft, sheets, kg, liters, boxes, pairs, pieces).
16.7 All Filipino strings SHALL be treated as unverified drafts pending native-speaker review. The Filipino message file SHALL carry a header comment stating this.
16.8 The repository SHALL contain `docs/translation-review.md` with a row per string and the columns `key | English | Filipino draft | reviewed? | reviewer note`, kept alongside the message files.
16.9 The research paper's limitations section SHALL state that the Filipino strings were machine-drafted and are awaiting proofreading.
16.10 IF a message key is missing in the active language THEN the system SHALL fall back to the English string and SHALL log a development warning, never showing a raw key to the user.
16.11 The `<html lang>` attribute SHALL match the active language on every page.
16.12 Automated accessibility tests SHALL run against both languages (Requirement 24.4).

## Requirement 17 — Accessibility baseline `[MUST]`

**User story.** As a user who relies on a keyboard, a screen reader, or simply large readable text, I want every screen operable and legible, so that I can do my job without assistance.

**Acceptance criteria.**

17.1 All text SHALL meet WCAG 2.1 AA contrast: at least 4.5:1 for normal text and 3:1 for large text and user-interface components. Body text SHALL be at least 16 px.
17.2 Every interactive target SHALL be at least 44 × 44 px, including icon buttons and table row actions.
17.3 Every screen SHALL be fully operable by keyboard alone, in a logical tab order, with no keyboard trap outside a modal dialog.
17.4 Every focusable element SHALL show a visible focus ring that meets the 3:1 contrast threshold against its background.
17.5 Each page SHALL expose landmark structure (banner, navigation, main, contentinfo), exactly one `<h1>`, and headings in order with no skipped level.
17.6 Every dialog SHALL have an accessible name, move focus inside on open, trap focus while open, close on `Escape`, and return focus to the element that opened it.
17.7 Every data table SHALL use `<th>` with a correct `scope`, and a `<caption>` or an equivalent accessible description naming what the table contains.
17.8 Every icon-only control SHALL have an `aria-label`, and SHALL additionally show a visible text label when the "descriptive button labels" preference is on.
17.9 Every image SHALL have alt text; the logo SHALL use `alt="RJM Furniture logo"`; purely decorative graphics SHALL use empty alt text.
17.10 Status messages, toasts, result counts and validation summaries SHALL be announced to assistive technology through an appropriate live region.
17.11 Form controls SHALL be associated with visible labels; required fields SHALL be marked visually and programmatically; errors SHALL be linked to their field with `aria-describedby`.
17.12 The high-contrast preference SHALL raise contrast of text, borders and surfaces beyond the default theme, and SHALL be verified by the contrast-check script.
17.13 The layout SHALL remain usable at 200% browser zoom and at a 320 px viewport width without horizontal scrolling of the page body.
17.14 Automated axe-core checks SHALL report zero critical or serious violations on every page, in both languages.
17.15 No information SHALL be conveyed by colour alone (Requirement 19).

## Requirement 18 — Brand palette, design tokens and visual system `[MUST]`

**User story.** As the professor grading visual design, I want one consistent and calm visual system across every screen, so that the prototype reads as a single professional product.

**Acceptance criteria.**

18.1 The palette SHALL be exactly Dusk Blue `#9FB4E3`, Midnight Navy `#0D1A33` and Sunset Orange `#FF6A2B`, defined as CSS custom properties, mapped into the Tailwind theme and the shadcn/ui token names, with 50–900 tints and shades plus a neutral ramp derived from them.
18.2 Midnight Navy SHALL be used for the sidebar background, headings and body text.
18.3 Dusk Blue SHALL be used for soft backgrounds, table-header tints, borders and selected states, and SHALL NEVER be used as text on white (about 2.1:1).
18.4 Sunset Orange SHALL be used for primary buttons, key calls to action and alert accents, and SHALL NEVER be used as text or thin icons on white (about 2.9:1); text on orange fills SHALL be Midnight Navy.
18.5 A darker accessible orange SHALL be derived for orange text and links, reaching at least 4.5:1 on white, and its hex value plus measured ratio SHALL be stated in the design document.
18.6 The design document SHALL contain a contrast table listing every text/background and component/background pairing actually used, with its computed ratio and the AA threshold it must meet, computed with the WCAG relative-luminance formula rather than estimated.
18.7 The repository SHALL contain a repeatable contrast-checking script whose output is written to `docs/accessibility-report.md`.
18.8 There SHALL be exactly one type scale, one spacing scale, one radius scale, one elevation set, and one icon set (lucide-react). Mixing icon sets SHALL be treated as a defect.
18.9 Each shadcn/ui component used SHALL have its allowed variants defined once and reused; the same pattern SHALL appear identically on every screen (page header, toolbar, card, table, dialog, toast, empty state, form field).
18.10 Each content area SHALL have exactly one primary action; secondary actions SHALL use secondary or ghost styling.
18.11 The logo SHALL be rendered from `public/rjm-logo.jpg` at a fixed size inside a dark navy rounded container, so its black JPG edge reads as intentional against light surfaces; the design document SHALL note the clash and recommend exporting an SVG or transparent PNG later. A different logo SHALL NOT be invented.
18.12 Every screen SHALL be responsive: a mobile drawer for navigation, and tables that switch to stacked cards or a prioritised-column layout on small screens with no loss of information.

## Requirement 19 — Colour-blind-safe status communication `[MUST]`

**User story.** As a user with colour-vision deficiency, I want every status to carry an icon and a word, so that I never have to tell red from green to know what is happening.

**Acceptance criteria.**

19.1 Every status SHALL be shown as colour **and** icon **and** text label together; colour alone SHALL never carry meaning.
19.2 Stock statuses SHALL render as: In Stock — success colour, `check-circle` icon, label "In Stock"; Low Stock — warning colour, `alert-triangle` icon, label "Low Stock"; Out of Stock — danger colour, `x-octagon` icon, label "Out of Stock".
19.3 Job statuses SHALL render as: Pending — neutral colour, `clock` icon, label "Pending"; In Progress — info colour, `loader` icon, label "In Progress"; On Hold — warning colour, `pause-circle` icon, label "On Hold"; Completed — success colour, `check-circle` icon, label "Completed".
19.4 Transaction types SHALL render as: Stock In — success colour, `arrow-down-to-line` icon, label "Stock In"; Stock Out — danger-leaning colour, `arrow-up-from-line` icon, label "Stock Out"; Adjustment — neutral colour, `settings-2` icon, label "Adjustment".
19.5 Progress bars and charts SHALL label each segment with its value and its name in text, not only in a colour key.
19.6 Status colours SHALL meet the 3:1 component contrast threshold against their surface, and their text SHALL meet 4.5:1.
19.7 The status set SHALL be checked under a colour-blindness simulation and the result recorded in `docs/accessibility-report.md`.

## Requirement 20 — Error prevention, confirmation, soft delete and undo `[MUST]`

**User story.** As admin staff working quickly, I want the app to stop me from doing damage and let me undo mistakes, so that one wrong click does not lose a record.

**Acceptance criteria.**

20.1 WHEN the user requests a destructive action THEN the system SHALL show a confirmation dialog naming the exact record and the consequence, with the confirming button labelled with the action ("Delete job order") rather than "OK".
20.2 WHEN a delete is confirmed THEN the system SHALL soft delete by setting `deleted_at`, SHALL hide the record from normal lists, and SHALL show an "Undo" toast for at least 8 seconds.
20.3 WHEN the user activates Undo THEN the system SHALL clear `deleted_at`, restore the record to its list, and confirm with a toast.
20.4 IF a control is unavailable THEN the system SHALL render it disabled with a visible explanation next to or inside it (for example "Out of stock — add stock before issuing this material to a job"), never silently inert.
20.5 IF a form has unsaved changes THEN navigating away SHALL raise a warning offering Stay and Discard.
20.6 Every error message shown to a user SHALL say what happened and what to do next, in plain words, with no stack trace, SQL text or error code as the primary message.
20.7 WHEN a write fails because of a permission rule THEN the message SHALL explain who can perform the action instead of saying "forbidden".
20.8 WHEN a write fails because of a network problem THEN the system SHALL keep the user's input, say the save did not go through, and offer "Try again".
20.9 WHEN an unexpected error occurs THEN the system SHALL show a friendly error screen or card with a way back, log the technical detail server-side, and SHALL NOT show the raw message to the user.
20.10 Quantity inputs SHALL block values below zero and above the available stock at the point of entry, before submission, in addition to the server checks in Requirement 12.
20.11 WHEN a save succeeds THEN the system SHALL confirm explicitly with a toast naming what was saved; a silent success SHALL be treated as a defect.
20.12 Destructive actions SHALL never be the default focused button in a dialog.
20.13 `[SHOULD]` A first-run tips overlay SHALL be shown once per user, SHALL be dismissible, and SHALL record its dismissal in the user's preferences so it does not return.

## Requirement 21 — In-app usability feedback and the Feedback page `[MUST]` for capture, `[SHOULD]` for review/export

**User story.** As a student researcher, I want testers to record observations inside the app and to export them, so that I have real usability data for my paper.

**Acceptance criteria.**

21.1 The sidebar SHALL keep the dashed "Usability Feedback" box showing "Prototype v0.1", the line "Ready for testing", and an "+ Add observation" button, on every authenticated screen.
21.2 WHEN the user activates "+ Add observation" THEN the system SHALL open a small accessible dialog with the current page pre-filled, a rating from 1 to 5, and a free-text note.
21.3 The page field SHALL be editable in case the observation concerns a different screen, the rating SHALL be required, and the note SHALL be optional with a maximum of 1,000 characters.
21.4 WHEN the observation is submitted THEN the system SHALL store the acting user, the page, the rating, the note and the creation time, and SHALL confirm with a thank-you toast.
21.5 Any signed-in user SHALL be able to record an observation, and SHALL be able to read back only their own observations.
21.6 `[SHOULD]` A Feedback / Observations page SHALL be available to `owner` and `admin_staff`, listing every observation with the submitter, role, page, rating, note and date, sortable by date and rating and filterable by page.
21.7 `[SHOULD]` The Feedback page SHALL offer a CSV export of all observations suitable for analysis in the research paper.
21.8 IF there are no observations yet THEN the page SHALL show an empty state explaining how testers add them.
21.9 IF submitting an observation fails THEN the dialog SHALL stay open with the text preserved and offer "Try again".
21.10 The repository SHALL contain `CHANGELOG.md` at its root with one entry per phase, and the version label shown in the app SHALL match its latest entry.

## Requirement 22 — Data model, generated codes and record integrity `[MUST]`

**User story.** As the student who must defend this system, I want a simple, well-explained data model with reliable identifiers, so that the stored data is trustworthy and I can explain every table.

**Acceptance criteria.**

22.1 The schema SHALL contain these tables: `profiles`, `customers`, `jobs`, `materials`, `inventory_transactions`, `usability_feedback`, with the fields listed in the project brief, plus the following additions, each justified in design §7.1: `job_pricing`, `material_costs` and `inventory_transaction_costs` (the three money values, moved out of their parent tables so one RLS policy can hide them from workers), `job_code_counters` (the per-year job-number counter) and `job_status_history` (the status audit trail that Requirement 9.12 reads). Any further addition or change SHALL likewise be justified in the design document.
22.2 `profiles.id` SHALL equal the Supabase auth user id, `profiles.username` SHALL be unique, and `profiles.role` SHALL be constrained to `owner`, `admin_staff` or `worker`.
22.3 `profiles.preferences` SHALL be a JSON object holding language, text size, high contrast, reduce motion, simple mode and descriptive labels, validated on write against a schema, with documented defaults for missing keys.
22.4 `jobs.status` SHALL be constrained to `pending`, `in_progress`, `on_hold` or `completed`; `inventory_transactions.type` SHALL be constrained to `stock_in`, `stock_out` or `adjustment`.
22.5 Generated codes SHALL follow `JO-YYYY-NNN`, `MAT-NNN` and `TXN-NNNN`, SHALL be unique, and SHALL be produced by a concurrency-safe mechanism rather than reading the current maximum and adding one.
22.6 The `JO-YYYY-NNN` counter SHALL restart at 001 at the start of each calendar year, and the design document SHALL state exactly how the yearly reset is handled.
22.7 `inventory_transactions` SHALL be append-only: no update or delete grant for application users.
22.8 Soft-deletable tables SHALL carry `deleted_at`, and every read path for normal lists SHALL exclude soft-deleted rows.
22.9 `[STRETCH]` A `job_tasks` table (id, job_id, title, assigned_to, status, due_date) SHALL be designed and included in the migration set so the data model in the paper is complete, but no user interface SHALL be built for it unless all other work is finished.
22.10 Timestamps SHALL be stored as `timestamptz` in UTC and displayed in Asia/Manila time.
22.11 Foreign keys SHALL be declared for every relationship, with deletion behaviour stated, so orphan rows cannot occur.
22.12 TypeScript types SHALL be generated from the live schema rather than hand-written, and the generation command SHALL be documented.
22.13 Monetary values SHALL be stored as `numeric` with two decimal places and quantities as `numeric` with up to four, never as floating point.

## Requirement 23 — Seed data and demo accounts `[MUST]`

**User story.** As the professor grading unattended, I want three working logins and realistic data already in the system, so that I can evaluate each role immediately.

**Acceptance criteria.**

23.1 The project SHALL seed three accounts with known passwords: one `owner`, one `admin_staff` and one `worker`.
23.2 The demo credentials SHALL be listed in the README's demo-account table, together with a note that the `worker` account ships with Simple mode ON.
23.3 The Login screen SHALL offer a collapsible "Demo accounts" panel listing the three logins, shown only when the `NEXT_PUBLIC_DEMO_MODE` flag is on, collapsed by default and keyboard accessible.
23.4 IF `NEXT_PUBLIC_DEMO_MODE` is off THEN no demo credentials SHALL appear anywhere in the interface.
23.5 Seeding SHALL create the auth accounts through a script that uses the Supabase Admin API with the secret key (because auth users cannot be created safely by plain SQL), and SHALL create business data through SQL seed statements; the required order SHALL be documented (auth users and profiles first, then customers, materials, jobs, then transactions).
23.6 Seeded business data SHALL mirror the wireframe: customers Maria Santos (6-Seater Dining Set), Jose Reyes (Kitchen Cabinets), Ana Villanueva (Queen Bed Frame), Paolo Garcia (Office Shelving) and Liza Flores (Coffee Table); materials Mahogany Lumber, 3/4" Marine Plywood, 2" Common Nails, 1.5" Wood Screws, Wood Glue, 120-Grit Sandpaper, Clear Varnish and Cabinet Hinges.
23.7 Seed volume SHALL be large enough to exercise pagination and reports: about 42 job orders, about 64 materials and at least 38 transactions inside the reporting month, including at least one out-of-stock material and two low-stock materials.
23.8 Seeded stock figures SHALL be consistent with the seeded ledger, so that the sum of transactions explains each material's current stock.
23.9 Running the seed twice SHALL NOT create duplicates; it SHALL either reset the seeded rows or skip existing ones, and the chosen behaviour SHALL be documented.
23.10 All seeded data SHALL be clearly fictional; no real customer information SHALL be used.

## Requirement 24 — Testing and accessibility evidence `[MUST]` for the baseline, `[SHOULD]` for breadth

**User story.** As the student, I want evidence that the rules and the accessibility work actually hold, so that I can show the professor proof rather than claims.

**Acceptance criteria.**

24.1 TypeScript SHALL run in strict mode and the build SHALL fail on a type error.
24.2 ESLint SHALL run with `eslint-plugin-jsx-a11y` and the lint step SHALL fail on an accessibility rule violation.
24.3 `[SHOULD]` Unit tests (Vitest) SHALL cover the stock rules and cost arithmetic, including: stock cannot go below zero, out-of-stock refusal, correct stock after a sequence of movements, job material cost from `unit_cost_at_time`, stock status derivation at the boundary where current stock equals the minimum level, and code-format generation.
24.4 `[SHOULD]` End-to-end tests (Playwright with axe-core) SHALL visit every page in both languages and SHALL report zero critical or serious accessibility violations.
24.5 `[SHOULD]` End-to-end tests SHALL include one happy path per role: Owner creates a user; Admin creates a job order and records stock out; Worker updates the status of an assigned job and is refused on a job not assigned to them.
24.6 A manual keyboard-only walkthrough of every screen SHALL be performed and its result recorded in `docs/accessibility-report.md`.
24.7 `[STRETCH]` Lighthouse accessibility score SHALL be at least 95 on the main screens, and 200% zoom plus colour-blindness simulation checks SHALL be recorded with screenshots.
24.8 `docs/accessibility-report.md` SHALL contain the contrast-script output, the axe results, the keyboard walkthrough notes and any known issues with a plan.
24.9 No secret SHALL appear in the repository, and a check for the secret key patterns SHALL be part of the pre-deployment checklist.
24.10 RLS policies SHALL be verified by at least one negative test per role (a forbidden read or write that must fail).

## Requirement 25 — Documentation deliverables `[MUST]`

**User story.** As the professor, I want the thinking behind the design written down, so that I can grade rationale, personas, heuristics and research readiness directly.

**Acceptance criteria.**

25.1 The repository SHALL contain `docs/personas-and-scenarios.md` with the three personas (Shop Owner, Admin Staff, Carpenter/Worker) and three to five task scenarios, and each screen section in the design SHALL state which personas it serves.
25.2 The repository SHALL contain `docs/design-rationale.md` explaining layout, colour, icon and wording choices tied to user goals, every deviation from the wireframe with its reason (including the three known wireframe defects: the Low-Stock banner count mismatch, the Filipino-deferral note, and the missing Simple mode toggle), and a future-work section showing how later features such as suppliers and payments would slot in.
25.3 The repository SHALL contain `docs/heuristic-checklist.md` applying Nielsen's ten heuristics to each screen, with a short note per heuristic per screen.
25.4 The repository SHALL contain `docs/evaluation-traceability.md` with a row per indicator and the columns `indicator | what we implemented | screen/file | evidence`, covering all 22 indicators.
25.5 The repository SHALL contain `docs/accessibility-report.md` as described in 24.8.
25.6 The repository SHALL contain `docs/usability-test-plan.md` listing the tasks, success criteria, participants and metrics (task success, time on task, error count, SUS score).
25.7 The repository SHALL contain `docs/translation-review.md` as described in 16.8.
25.8 The documentation SHALL include Mermaid diagrams for at least the authentication flow, the stock-out flow, and the overall screen/navigation map.
25.9 The README SHALL cover project purpose, setup, environment variables, running migrations, seeding, the demo accounts, the test commands, and deployment.
25.10 Documentation SHALL be written in plain language a student can defend verbally, with brief explanations of key decisions rather than unexplained jargon.
25.11 Each phase SHALL end by appending its own section to `docs/design-rationale.md` and `docs/evaluation-traceability.md`, so documentation is not left to the final hours.

## Requirement 26 — Environment, secrets and deployment `[MUST]`

**User story.** As the student, I want the app to run locally and on Vercel with the keys kept out of the repository, so that I can deploy safely before the deadline.

**Acceptance criteria.**

26.1 The app SHALL read configuration from exactly these variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` (server-only) and `NEXT_PUBLIC_DEMO_MODE`. The legacy names `ANON_KEY` and `SERVICE_ROLE_KEY` SHALL NOT be used.
26.2 `.env.local` SHALL carry the project URL and publishable key with `SUPABASE_SECRET_KEY=` left blank for the user to paste in; `.env.example` SHALL be committed with placeholder values only; `.env*.local` SHALL be gitignored.
26.3 The secret key SHALL NEVER be written into any committed file, specification, document or log output.
26.4 IF a required variable is missing at startup THEN the system SHALL fail fast with a clear message naming the missing variable, rather than failing later with a confusing database error.
26.5 The secret key SHALL be used only in server-side code paths (route handlers, server actions, seed scripts) and SHALL NOT be imported into any client component.
26.6 All database changes SHALL exist as SQL files in `/supabase/migrations`, applied in order, with no change made only through the Supabase dashboard.
26.7 Every migration SHALL follow a fixed checklist: create the object, enable row level security on each new table, add explicit `GRANT` statements for `authenticated` (and `anon` only where genuinely needed), add explicit policies, and state in a comment who may do what. This is required because the project has "Automatically expose new tables" OFF and automatic RLS ON, so a table without grants and policies is invisible to the app.
26.8 The app SHALL be deployed to Vercel with the same variables configured in the Vercel project, and the deployed URL SHALL be recorded in the README.
26.9 The plan SHALL include a task reminding the user to rotate the Supabase secret key before any real (non-fake) use of the system.
26.10 The repository SHALL be initialised with git in Phase 1, with small commits on feature branches and a `.gitignore` covering `node_modules`, `.next`, `.env*.local` and test artefacts.

---

# Indicator mapping

All 22 indicators from the professor's evaluation matrix, each mapped to the requirements that make it demonstrable. None is unmapped. `docs/evaluation-traceability.md` (Requirement 25.4) carries the same mapping plus the evidence collected during the build.

| # | Indicator | Requirements |
| --- | --- | --- |
| 1 | Contrast & Readability | 17.1, 17.12, 17.13, 18.1–18.7, 15.4, 15.5, 15.11, 24.8 |
| 2 | Navigation & Interaction Accessibility | 6.6, 6.7, 6.8, 6.12, 17.2–17.6, 17.10, 17.14, 2.4, 15.6, 24.4, 24.6 |
| 3 | Inclusive Content & Alternatives | 17.7, 17.8, 17.9, 15.6, 15.11, 19.1, 18.9, 6.9, 7.1 |
| 4 | User Diversity | Glossary, 15.11, 15.13, 16.1–16.6, 17.1, 17.2, 9.7, 20.6, 25.1 |
| 5 | Flexibility & Customisation | 15.1–15.16, 22.3, 20.13 |
| 6 | Cultural/Language Sensitivity | 16.1–16.12, 15.3, 10.7, 11.6, 25.7 |
| 7 | Clarity of Purpose & Task Flow | 6.9, 7.1, 7.2, 8.1, 10.1, 11.1, 13.1, 14.1, 15.1, 7.12, 8.7, 13.9, 21.8 |
| 8 | Affordance & Feedback | 18.9, 18.10, 7.11, 9.5, 12.10, 15.9, 20.11, 1.11, 14.14 |
| 9 | Error Prevention & Recovery | 20.1–20.13, 12.4–12.7, 10.8, 10.13, 9.6, 9.11, 2.2, 2.3 |
| 10 | Learnability & Cognitive Load | 18.8, 18.9, 9.7, 15.7, 20.13, 11.9, 6.1, Glossary |
| 11 | Visual Hierarchy & Layout | 18.9, 18.10, 15.2, 7.4, 6.9, 17.5 |
| 12 | Consistency & Design System | 18.1, 18.8, 18.9, 6.1, 8.8, 10.11, 11.11, 22.12 |
| 13 | Aesthetic Appeal | 18.1–18.5, 18.8, 18.11, 1.2 |
| 14 | Accessibility of Visual Design | 19.1–19.7, 17.8, 17.12, 18.12, 24.7 |
| 15 | Goal Fit & Task Support | 7.1–7.10, 8.1, 9.1, 10.1, 11.1, 12.1, 13.1, 14.1, 15.1 |
| 16 | User Persona Alignment | 25.1, 3.2–3.5, 6.3, 7.3, 8.10, 10.9, 11.10, 14.2, 15.13 |
| 17 | Design Rationale & Documentation | 25.2, 25.8, 25.9, 25.10, 13.3, 15.3, 15.7, 18.11, 4.5 |
| 18 | Scalability & Future-Proofing | 18.8, 18.9, 22.1, 22.9, 25.2 (future-work section), 26.6, 26.7 |
| 19 | User-Centredness | 25.1, 25.8, 21.1–21.9, 25.6 |
| 20 | Heuristic Compliance | 25.3, 20.1–20.12, 8.5, 12.10, 6.8 |
| 21 | Cognitive Load Minimisation | 15.7, 9.7, 7.4, 8.3, 8.8, 10.2, 20.4, 18.10 |
| 22 | Feedback & Iteration Readiness | 6.4, 6.10, 21.1–21.10, 25.6, 23.3 |

# Open decisions

The first four were raised in the brief and have since been **DECIDED** as working defaults so the four-day plan does not stall. Each is cheap to reverse. The rest are listed below with a recommendation each, so the build can proceed on the recommendation unless the user says otherwise — except **O9** and **O12**, which the design review settled and which now carry a DECIDED heading and the reasoning, in place in the list.

## Decided

**D1. Filipino translation register and proofreading — DECIDED: workshop Taglish, all strings flagged as drafts.**
Prose, instructions, validation messages, empty states and toasts are translated naturally, but the domain terms the shop already says in English stay in English ("Job Order", "Stock In", "Stock Out", "Inventory", "Low Stock", "Out of Stock", "In Stock", "Dashboard", "Reports", "Settings", and the unit names). Reasoning: forcing formal Tagalog equivalents such as "Kahilingan sa Trabaho" would make the Filipino interface harder to use than the English one, working against indicators 4 and 6. No human proofreader has been identified, so every Filipino string is treated as an unverified machine draft: a header comment in the Filipino message file, a row per string in `docs/translation-review.md`, and a statement in the paper's limitations section. See Requirement 16.

**D2. Simple mode default — DECIDED: ON for `worker`, OFF for `owner` and `admin_staff`.**
The default follows the likeliest need and every user can still toggle it. The seeded worker demo account ships with Simple mode on, so the professor sees the feature working on first login without hunting for the toggle, and the README's demo table says so. See Requirement 15.13 and 23.2.

**D3. `job_tasks` scope — DECIDED: schema designed, no interface, deferred to `[STRETCH]`.**
The table is included in the migration set so the data model in the research paper is complete, but no UI is built unless everything else is finished. The design document's future-work section explains how it would be built, which also serves indicator 18. See Requirement 22.9.

**D4. "Forgot password?" behaviour — DECIDED: an honest dialog, no email.**
The dev project has no SMTP and Supabase reset emails are not wired up. The dialog explains that the shop owner resets passwords, names the next step, and offers "Back to login" which returns focus to the username field, which also demonstrates indicator 9. The documented recovery path is the Owner setting a new temporary password on the Users page, which is `[SHOULD]` rather than `[MUST]`. See Requirements 2 and 5.8.

**D5. Dashboard sub-notes — DECIDED: compute the cheap ones, delete the rest.**
"+N this month", "N due this week", "N% completion rate", "Across N categories" and the low-stock count all come from aggregates the Dashboard already needs, so they are computed. Any wireframe sub-note that cannot be derived from a query the page already runs is removed rather than hardcoded. To keep the query cost low, the whole summary comes back in one round trip from a single Postgres view or RPC instead of six separate client queries. See Requirements 7.5 and 7.6.

**D6. Version label — DECIDED: "Prototype v0.1" from a single constant.**
The sidebar feedback box, the login footer, the Dashboard chip and `CHANGELOG.md` all read from the same constant so they cannot drift apart. `CHANGELOG.md` sits at the repository root with one entry per phase. See Requirements 6.10 and 21.10.

## Still open

**O1. Does the graded deployment run with demo mode on?**
*Recommendation:* yes. `NEXT_PUBLIC_DEMO_MODE=true` on the Vercel deployment the professor visits, so the credentials panel is available, and the README states plainly that the deployment is a prototype holding fake data only. Turning the flag off is a one-line change if the user prefers the credentials to live only in the README.

**O2. Should a user be forced to change a temporary password at first sign-in?**
*Recommendation:* no, not for this prototype. Forcing a change would break unattended grading with the seeded demo accounts, and the data is fake. Note the omission in the paper's limitations as a step a production version would add.

**O3. What exactly is a valid username?**
*Recommendation:* lowercase letters, numbers, dot, underscore and hyphen; 3–30 characters; stored and compared in lowercase so "RMendoza" and "rmendoza" are the same account. This must be fixed before the Users page is built because the login resolution in Requirement 1.4 depends on it.

**O4. How does the login screen resolve a username to an email?**
*Recommendation:* a server action that uses the secret key to look up the profile, so no username list is ever reachable from the browser and `profiles` needs no `anon` grant. The alternative — a restricted database function callable by the `anon` role — is fewer moving parts but creates a surface that could be probed to confirm whether a username exists, which conflicts with Requirement 1.6.

**O5. Are material categories and units a fixed list or free text?**
*Recommendation:* a fixed list in code for this prototype (categories: Lumber, Plywood, Fasteners, Adhesives, Finishing, Hardware, Consumables; units: board ft, sheets, kg, liters, boxes, pairs, pieces). Free text invites typos that break the category count on the Dashboard and the filters. A lookup table is the right answer later and is noted in future work.

**O6. Is `materials.unit_cost` required?**
*Recommendation:* required, defaulting to 0, for Owner and Admin only. Job material cost in Requirement 12.9 is meaningless if costs are missing, and a required field with a default is the simplest rule to explain.

**O7. What happens when a customer with existing job orders is deleted?**
*Recommendation:* soft delete the customer, keep their job orders visible, and show the customer name with a "(removed)" marker on those jobs. Blocking the delete would frustrate the user; hiding the jobs would lose history.

**O8. What date ranges does the Reports selector offer?**
*Recommendation:* presets only for the deadline build — This month, Last month, Last 3 months, This year — because presets are faster to implement and to test than a custom range picker, and they match the wireframe's single select. A custom range is `[STRETCH]`.

**O9. Does the Filipino interface use a URL prefix (`/fil/...`) or stay on the same URLs? — DECIDED after the design review: no locale segment in the URL; language is a stored user preference.**
The recommendation here was locale-prefixed routes, for one reason: so the axe runs in Requirement 24.4 could visit both languages by address. The design settles it the other way (design §16.1) and the reasoning is accepted. Language sits in `profiles.preferences` beside text size and high contrast, and Settings is where a user changes it, so a URL prefix would be a second source of truth that can disagree with the saved value; prefixed routes also force every internal link, redirect and `revalidatePath` call through locale-aware helpers, which is real work and a real source of four-day bugs. The test argument disappears once Playwright sets the `locale` cookie on the browser context, which is two lines (design §22) and additionally asserts `html[lang]` to prove the run was really in Filipino. Cheap to reverse: adding a `[locale]` segment later is a routing change, not a data change.

**O10. Can workers see their own recorded observations, and can anyone edit one?**
*Recommendation:* workers read their own observations only (Requirement 21.5) and nobody edits or deletes an observation, because the entries are research data. Owner and Admin read all of them on the Feedback page.

**O11. How precise should quantities be?**
*Recommendation:* up to four decimal places stored, displayed with up to two unless the stored value needs more. Board feet and litres are measured in fractions, while nails by the kilogram rarely are, so one rule that tolerates fractions is simpler than per-unit precision.

**O12. Is there an audit trail of status changes beyond the latest value? — DECIDED after the design review: yes, build `job_status_history`.**
The recommendation here was to store only `updated_at` and defer the table, on the assumption that it would cost a migration, a policy and a new UI panel. Two of those three turned out to be cheaper than assumed: the writer is a ten-line `after update` trigger inside a migration that exists anyway (design §13.4), the policies are one `select` for everyone plus no insert grant at all, and the "new panel" is already drawn on the job order detail screen in design §20. It is also the only way to satisfy Requirement 9.12's status history. See design §7.1, where it is listed as a justified schema addition under Requirement 22.1. If the four days get tight, the table and trigger stay (they cost nothing at runtime) and only the detail panel is dropped.
