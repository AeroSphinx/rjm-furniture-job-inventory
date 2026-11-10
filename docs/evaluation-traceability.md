# Evaluation traceability

This file maps the professor's 22-indicator evaluation matrix to concrete,
demonstrable work in this repository (Requirement 25.4). It is a living
document: each phase appends the rows its own tasks earned, and task 6.9
compiles everything into one final table covering all 22 indicators.

| Indicator | What we implemented | Screen / file | Evidence |
| --- | --- | --- | --- |
| 1. Contrast & Readability | Dusk/Navy/Orange token ramps plus a status-colour set, all checked against the WCAG relative-luminance formula; 16px base body text in the `@theme inline` type scale | `src/app/globals.css`, `src/lib/design-tokens.ts`, `scripts/check-contrast.ts` | `docs/accessibility-report.md`'s contrast table (52 rows, all passing or recorded as a rejected pairing with the adopted replacement next to it) |
| 2. Navigation & Interaction Accessibility | 44×44px minimum buttons, a skip-to-content link, visible focus rings, focus trap + `aria-labelledby` + `Escape`-to-close on the Forgot-password dialog, fail-closed auth gate | `src/components/ui/button.tsx`, `src/components/layout/SkipLink.tsx`, `src/components/features/auth/ForgotPasswordDialog.tsx`, `src/proxy.ts`, `src/lib/auth.ts` | `npx tsc --noEmit` clean; dialog closes on `Escape` and returns focus to the identifier field via `onCloseAutoFocus` |
| 3. Inclusive Content & Alternatives | `alt="RJM Furniture logo"` on the brand mark; every form field labelled by a visible `<label>` via `FormField`; the username/password fields carry `autocomplete` | `src/components/layout/BrandLogo.tsx`, `src/components/patterns/FormField.tsx`, `src/components/features/auth/LoginForm.tsx` | Requirement 1.13 satisfied in `LoginForm.tsx` |
| 4. User Diversity | Plain workshop wording in the login copy and helper text ("Need help? Contact the system administrator.") instead of software jargon; the UI language is a stored preference, not assumed | `messages/en.json` (`Auth` namespace), `src/app/(public)/login/page.tsx` | Login screen copy matches Requirement 1.2/1.3 verbatim |
| 6. Cultural/Language Sensitivity | `next-intl` wired to a `locale` cookie (no `[locale]` route segment); a complete English message file and a flagged Filipino draft for every Phase 1 string | `src/i18n/request.ts`, `messages/en.json`, `messages/fil.json` | `fil.json`'s `_README` header marks every string as an unreviewed draft, per Requirement 16.7 |
| 7. Clarity of Purpose & Task Flow | Every screen opens with an eyebrow label, an `<h1>`, and a one-line purpose statement; the no-access screen names the problem and the one next step | `src/components/patterns/PageHeader.tsx`, `src/app/(app)/no-access/page.tsx` | `/no-access` renders "You do not have access to this page." with a single "Back to Dashboard" action |
| 9. Error Prevention & Recovery | One generic login error for every failure case; a five-attempts-per-five-minutes throttle with a visible countdown; an honest "Forgot password?" dialog naming the real recovery path instead of a dead email flow | `src/actions/auth.ts`, `src/components/features/auth/ForgotPasswordDialog.tsx` | Requirement 1.6, 1.12, 2.2, 2.6 |
| 11. Visual Hierarchy & Layout | One primary action per area (`PageHeader`'s `actions` slot); the login screen's split layout groups the brand story on the left from the sign-in task on the right | `src/components/patterns/PageHeader.tsx`, `src/app/(public)/login/page.tsx` | Visual inspection of `/login` and `/no-access` |
| 12. Consistency & Design System | One icon set (lucide-react), one token set, shadcn primitives edited only for shared a11y defaults, reused across the login and no-access screens | `src/components/ui/*`, `src/components/patterns/*` | `PageHeader` and `Button` are the same components on both built screens — no screen defines its own markup |
| 13. Aesthetic Appeal | The three-colour "dusk" palette applied consistently to the login split layout and the brand tile, instead of the wireframe's black/white/grey | `src/app/globals.css`, `src/app/(public)/login/page.tsx` | Visual inspection of `/login` |
| 16. User Persona Alignment | The login screen's three role chips (Shop Owner, Carpenter/Worker, Admin Staff) name all three personas up front; the no-access screen is shared by all three | `src/app/(public)/login/page.tsx`, `src/app/(app)/no-access/page.tsx` | Requirement 1.2's three role chips; design §20 screen table, "No access" row ("all three") |
| 18. Scalability & Future-Proofing | A reusable component inventory (`PageHeader`, `Button`, `Dialog`, `FormField`) and a token system that any later screen reuses rather than redefining | `src/components/patterns/`, `src/components/ui/`, `src/lib/design-tokens.ts` | `/no-access`, built in this phase, needed zero new primitives — it composes existing patterns |

## Phase 2 onward

_Appended as each later phase closes out (tasks 2.18, 3.6, 4.6, 5.8, 6.9,
6.17)._
