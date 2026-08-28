# Production-Grade Polish: Language, Saved Filters, STLP History, Full QA

Four workstreams to make the LMS read and behave like a shipped NBFC/DSA lending platform.

## 1. Product language sweep (remove all "prototype" wording)

Replace internal/build wording with customer-facing product language everywhere it is visible:

- Sidebar footer: "v1.0 Prototype" becomes a version line only (e.g. "Version 1.0").
- Landing page: "Prototype • Mock data" chip and "Explore as demo user" CTA replaced with product wording ("Sign in to your workspace").
- Login page: "Prototype build — mock authentication…" footnote replaced with a security/compliance line; the credentials helper becomes "Sign-in help" with role-based access wording instead of "Demo accounts".
- Profile menu: "Reset demo data" becomes "Reset workspace data" with a professional confirmation copy.
- Credit bureau panel and lead detail: "Sandbox" badge and "Querying Experian Griffith sandbox…" become environment-neutral bureau wording ("Experian Griffith · Bureau enquiry", "Fetching credit report from Experian Griffith…"), keeping an "Integration: staging" indicator only inside System Config where an admin expects it.
- Sweep empty states, tooltips, toasts and notification copy for words like prototype, demo, mock, dummy, test, sample so all user-facing strings read as live operations language.

Internal identifiers, file names and code comments are unaffected.

## 2. Saved dashboard filters + quick date ranges

- New `DateRangeFilter` component with presets: Today, Yesterday, Last 7 days, Last 30 days, This month, Last month, Quarter to date, Custom range.
- New session/localStorage-backed `FiltersContext` storing named filter sets per module (dashboard, reports, MIS export, partner submissions) scoped by user + role.
- Each module toolbar gets: date range selector, Save current view (named), a saved-views dropdown to apply, and Reset.
- Applying a saved view restores date range, team/agent, product, stage and partner selections so a report or export can be reproduced exactly.
- MIS Export reuses the same saved views so an export matches the dashboard the user was reading.

## 3. STLP status history panel + audit download

- New `SubmissionHistoryPanel` component rendering the full `statusHistory` of a partner submission: previous status to new status, timestamp, actor name and role, note/reason, sanction/disbursal amounts when changed, and a badge for manual overrides vs partner-driven updates.
- Shown on Lead Detail (partner submission card) and as an expandable row/drawer in the partner submissions boards (Agent STLP, Group STLP, Org STLP).
- "Download audit trail" button on the panel exports that submission's history as CSV; role-gated to Manager, Cluster Head and Data Admin, and each download writes an audit entry.
- Empty state when a submission has no changes yet.

## 4. End-to-end functionality QA

Automated browser pass at 375px, 768px and 1280px covering:

- Leads: browsing, search, filters, pagination boundaries, empty result state, row navigation.
- Lead Detail: call logging validation, follow-up scheduling, consent, bureau pull, partner eligibility, submission and post-submission locks.
- Dashboards for all four roles: live KPIs, funnel, saved filters, date presets.
- MIS Export: every export type, preview, row counts, PII reason gate, CSV download.
- STLP status updates by Manager and Cluster Head, including history entries and audit logging.
- Follow-ups buckets (Overdue / Today / Upcoming) and notifications scoping.

Fix every issue found: console errors, overflow, misaligned toolbars, missing loading/empty/error states, unlabeled icon buttons.

## Technical notes

- No backend calls added; existing `LmsDataContext` + `lmsStore` persistence and the simulated bureau/partner services stay the source of truth.
- Filters persisted via the same localStorage-store pattern already used for LMS data, keyed by user id and module.
- CSV output reuses `src/lib/csv.ts`; permissions reuse `src/lib/permissions.ts`.
- Verification: `bunx tsgo --noEmit`, `bunx vite build`, plus Playwright runs per viewport.
