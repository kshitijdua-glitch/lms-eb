# Live Metrics, Partner Status Control & Module Upgrade

## The core problem found

Only the Lead Detail page reads from the live demo store (`LmsDataContext`). Every other screen — dashboards, Performance, Reports, MIS, Follow-Ups, Team/Org Partner Submissions, Group Leads/Management — imports the static `leads` array from `src/data/mockData.ts`. So during a client demo, a call logged, follow-up scheduled, bureau pull, or partner submission made on a lead does **not** appear anywhere else. Performance also runs entirely off a hardcoded `performanceData` array.

Also confirmed: on Team Partner Submissions (`GroupSTBPage`) the status dropdown only fires a toast — nothing is saved, nothing is audited, and it is hidden for API-integrated partners. Org Partner Submissions has the same pattern.

## What will be built

### 1. One live data source everywhere
Switch all list, dashboard, and reporting screens to `useLmsData()` so every screen reflects the same live state. Static mock data stays as the seed only.

### 2. Manager & Cluster Head partner status updates
- Add an explicit "Update Status" action on Team and Org Partner Submissions rows, plus on the Lead Detail submission cards.
- Allowed statuses follow a valid progression: Submitted → Under Review → Approved / Declined → Disbursed (Approved only). Backwards jumps are blocked.
- Update dialog captures: new status, sanction/disbursed amount (when relevant), disbursement date (for Disbursed), partner reference and remarks.
- Manual override permitted even for API-integrated partners, but tagged "Manual override" in the status history so it is distinguishable from webhook events.
- Every change persists to the store, appends to the submission `statusHistory`, recomputes the lead stage, writes an audit entry with actor + role + before/after, and raises a scoped notification.
- Permissions: Manager (own team submissions only), Cluster Head and Data Admin (all). Agents get a read-only status timeline.

### 3. Performance module
- Derive all KPIs from live leads instead of the hardcoded array: allocated, contacted, contact rate, calls logged, follow-up compliance, submissions, approvals, disbursals, disbursed amount.
- Role-aware scope: Agent sees self; Manager sees team plus per-agent comparison; Cluster Head sees all teams.
- Period selector (this month / last month / last 6 months), trend chart with metric selector, month-over-month delta chips with up/down colouring, and a funnel view (Allocated → Contacted → Bureau pulled → Submitted → Approved → Disbursed).
- Sortable, paginated monthly/agent breakdown table with mobile cards.

### 4. MIS module
- Export row counts and a live preview of the first rows for each export type, so it stops feeling like a stub.
- Filters actually applied to the data: date range, manager/team, agent, product, stage, partner.
- Add Partner Performance and Bureau Pull Summary export types.
- Real CSV file download generated client-side, with PII masking honoured for non-privileged roles, plus the existing PII reason modal and audit entry.
- Recent export history list (who, what, when, reason).

### 5. Dashboards
- All four role dashboards recomputed from live data: Agent (today's queue, overdue follow-ups, submissions in flight), Manager (team SLA breaches, agent leaderboard, pipeline), Cluster Head (org funnel, partner mix, approval/decline rates, compliance), Data Admin (batches, allocation coverage, unallocated pool, partner/product config health).
- Consistent KPI card component with delta, icon, and click-through to the filtered list.
- Empty, loading, and error states; responsive at 375px / 768px / 1280px.

### 6. Functionality QA pass
- Verify each role's routes end-to-end in the browser: role persistence, guards, lead lifecycle (upload → allocation → call → follow-up → bureau → eligibility → submission → decision → disbursement → reports/audit).
- Fix issues found: stale filter states, dead buttons, unlabeled icon buttons, inconsistent partner terminology, follow-up bucket correctness, and any horizontal overflow at 375px.

## Technical notes

- Extend `LmsDataContext` with `updateSubmission(leadId, submissionId, patch, meta)` that appends status history, recomputes lead stage, and logs audit; the webhook poller reuses it.
- Add `can.updateSubmissionStatus(role, lead)` and a `nextAllowedStatuses(status)` helper in `src/lib/permissions.ts`; the webhook simulator must skip submissions with a manual terminal override.
- New shared components: `KpiCard`, `FunnelChart`, `SubmissionStatusDialog`, `MetricsScopeToggle`.
- New `src/lib/metrics.ts` deriving all performance/MIS/dashboard aggregates from `Lead[]` with role scoping, so every module shows identical numbers.
- CSV generation via a small `src/lib/csv.ts` (Blob + object URL), no new dependencies.
- Existing indigo/Inter aesthetic, shadcn/ui, recharts, mock-only data, no backend calls.
