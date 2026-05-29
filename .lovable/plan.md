
# Phase-1 PRD Alignment — Gap Diff Plan

Frontend-only update to bring the prototype in line with Master + Agent + Manager + Cluster Head + Data Admin PRDs v1.

Approach: gap-diff (only changes), mock data updated to match the new logic, global label rename (STB → Send to Lending Partner / SLP), Team layer hidden everywhere, missing screens added as functional stubs.

---

## 1. Terminology & Labels (global rename)

- "STB", "Send to Bank", "Submit to Bank", "Bank Submission" → **Send to Lending Partner** (abbr **SLP**) in all UI copy, button text, badges, column headers, page titles, sidebar items, notifications.
- Internal code may keep `stb*` symbols (`stbSubmissions`, `stb_submitted`, `STBWizardDialog`); only user-facing strings change. New code uses `slp` naming.
- "BRE Done" / "Bank Selected" already aligned — keep "Bank Selected".
- Remove the word "Team" from Manager and Cluster Head screens (titles, columns, filters, notifications, dashboards). Keep the underlying `teamId` field but treat it as derived from manager grouping; never display it.

## 2. Role hierarchy & Team layer removal

- Confirmed roles: **Agent → Manager → Cluster Head → Data Admin** (no TL, no Team).
- Mock data:
  - Drop the `teams` array's user-facing usage; keep IDs only as a manager grouping helper. Stop exporting `getLeadsForTeam` / `getAgentsForTeam` from public API; replace internal callers with manager-based helpers `getAgentsForManager(managerId)` / `getLeadsForManager(managerId)`.
  - Rewrite `agents` records: remove `teamName` from displays; agents map to a `managerId` only. Keep `teamId` field on the type but mark it deprecated in a comment.
  - `Notification.scope = "team"` → rename to `"group"` and re-key any `teamId` fields to `managerId`.
  - Remove "Alpha Squad / Beta Force" labels from any visible chip.
- Remove team filter from Org/Group leads, follow-ups, SLP, reports.

## 3. Sidebar / Navigation

Update `src/components/AppSidebar.tsx` per PRD navigation lists:

- **Agent**: Dashboard, My Leads, My Follow-Ups, My Send to Lending Partner, Performance, Notifications.
- **Manager**: Dashboard, My Leads, My Follow-Ups, My Send to Lending Partner, Group Leads, Group Follow-Ups, Group Send to Lending Partner, Group Management, Lead Report, Performance, MIS & Reports, Notifications.
- **Cluster Head**: Dashboard, Org Leads, Org Follow-Ups, Org Send to Lending Partner, Staff Management, System Config, Lead Allocation, Lead Report, Audit Trail, MIS & Reports, Notifications.
- **Data Admin**: Dashboard, Lead Upload, Lead Allocation, Lead Pools, Lending Partners, MIS Export, System Config, Staff Management, Audit Trail, Notifications.

Add a dedicated `/notifications` page (lightweight wrapper around the existing drawer content). Replace "My STB" with "My Send to Lending Partner", "Org STB" → "Org Send to Lending Partner", "Group STB" → "Group Send to Lending Partner".

## 4. Lead Lifecycle

Extend the `LeadStage` union and stage labels to the PRD set:
`new | assigned | contacted | interested | bank_selected | ready_for_slp | sent_to_lp | approved | declined | disbursed | closed_lost | rejected | invalid | profile_correction | compliance_hold | expired`.

- Provide a `LEGACY_STAGE_MAP` helper to translate old `stb_submitted` → `sent_to_lp`.
- Update lifecycle transition guards (helper `canTransition(role, from, to)`) per Master §6.4.
- Backward-movement override: only Manager (group) and Cluster Head (org) can revert; mandatory reason captured via existing reason-prompt dialog; entry written through `useAudit().log`.

## 5. SLP (Send to Lending Partner) Logic

In `STBWizardDialog`, `LeadDetailPage`, `partnerEligibility.ts`:

- **Readiness checks** (block CTA until passing): mobile, PAN, income, obligation, FOIR, credit score, product, partner active+supports product, lead not in closed status, no duplicate active SLP. Show each as a tick-list with the failing reason.
- Remove all consent checks (already done — verify).
- **Partner eligibility formula** strictly: `active AND supportsProduct AND credit≥min AND foir≤max AND income≥min`. Drop any code that compares PIN code, employment type, loan amount, company.
- **One active SLP per lead** rule: when initiating, block if any submission status ∈ {sent_to_lp, documents_pending, under_review, approved}; allow re-submission to a new partner only after declined/cancelled/expired.
- **SLP statuses** expanded: `sent_to_lp | documents_pending | under_review | approved | declined | disbursed | cancelled | expired`. Update `STBSubmission["status"]` union and the SLP status-update modal (Manager/Cluster Head only, with required-fields per §10.13).
- **SLP→Lead status mapping** (§10.17) implemented in a single helper used by every status update.
- **Post-SLP lock** (§10.18): lock PAN, products, income, obligation, FOIR, credit score, partner, FOIR-affecting loans on the Agent edit form. Manager/Cluster Head can override with mandatory reason.

## 6. FOIR

- FOIR is calculated, never editable. In `CreateLeadWizard`, `LeadDetailPage`, and any SLP forms, replace any FOIR input with a derived display: `(obligation/income)*100` to 2 decimals; show "—" if income missing/zero.
- Update `Lead.foir` to a getter or recompute on render; remove existing edit affordance.
- Mock data: recompute FOIR for every seed lead.

## 7. Permissions (action-level)

Update `src/lib/permissions.ts`:

- `editLead`: Agent only on **own** leads and only allowed fields (alt mobile, city, PAN pre-SLP, company, income, obligation, employment, notes, original product). Add `canEditField(role, fieldKey, lead)` helper.
- `sendToLendingPartner`: Agent + Manager (own/group); Cluster Head only as override; Data Admin no.
- `updateSlpStatus`: Manager (group) + Cluster Head (org); Agent no; Data Admin no.
- `reassign`: Manager (group), Cluster Head (org), Data Admin (admin correction); Agent no.
- `exportPII`: Data Admin yes; Cluster Head limited/masked; Manager masked PAN; Agent no.
- `uploadLeads`: Data Admin only.
- `allocateLeads`: Data Admin and Cluster Head.
- `configureSystem`: Data Admin and Cluster Head.
- `viewAuditTrail`: Data Admin (full), Cluster Head (scope), Manager (group activity only, separate "Activity Log" view), Agent no.

Wire these guards into every relevant button/menu and the route map (`RouteGuard`).

## 8. Dispositions & Manual Call Log

Trim `DispositionType` to PRD-aligned set (keep legacy types in a `LegacyDisposition` alias for old call logs). Update `ManualCallLogDialog`:

- **Outcome** dropdown limited to: Connected, Not Connected, Invalid, Compliance.
- Disposition disabled until outcome chosen; disposition list filtered by outcome (per §8.4–§8.6).
- Required: date+time (no future), duration when Connected, follow-up datetime when next-action requires it, closure reason when Close Lead.
- Auto-update lead stage from disposition mapping (table in §8.4–§8.6).
- Increment `retryCount` only on Not-Connected save; don't increment on Call-Later-with-time, Connected, or simple reschedule.
- Audit event `CALL_LOG_CREATED` with prev/new status.

## 9. Follow-Ups

- Follow-up `status` calculated dynamically: `Upcoming | Today | Overdue | Completed | Escalated | Cancelled` (replace existing `pending|completed|missed`). Provide a `computeFollowUpStatus(fu, now, maxRetries)` util used everywhere.
- Add types `Call | Document | SLP | Profile Correction | Manager Escalation`.
- Manager/Cluster Head actions (nudge, reschedule, escalate, reassign, close) on group/org pages.
- Auto-escalate when `retry_count ≥ max_retries` (config).

## 10. Dashboards (formula correctness)

Rewrite KPI computations in:

- `AgentDashboard`, `ManagerDashboard`, `ClusterHeadDashboard`, `AdminDashboard` per Master §20.
- **Contacted** = leads with ≥1 Connected call (not "stage != new").
- **Worked Today** = leads with ≥1 meaningful action today (per §7.2 list).
- **Daily Call Target** = `callsToday / configured_target`; pull `configured_target` from config.
- **Funnel rates**: `Contact / SLP / Approval / Disbursal / Overall` exactly per §20.3, fixed denominators, NaN-guarded → "0%" or "No due follow-ups" for FU compliance.
- Manager dashboard adds: Zero Activity Agents, Missed Follow-Ups, Expiring Leads, F/U Compliance.
- Cluster Head dashboard adds: Manager comparison (already present — keep), Inactive Agents, Stale SLPs, Org Disbursed Amount.

## 11. Allocation & Reassignment

Update `LeadAllocationPage` + `admin/AllocationPage`:

- Remove "Assign to Team" mode. Modes: **Round Robin**, **Assign to Manager Group**, **Assign to Single Agent**.
- Capacity logic: `effective_capacity = manager_override ?? global_default`; block when `available_capacity ≤ 0`; show partial allocation with batch status `Partially Allocated`.
- Reassignment dialog: required reason; validations per §13.3; warning state (allow with confirmation) for SLP-active / approved / overdue leads; block when new owner inactive / same / no capacity / disbursed.
- Staff deactivation flow in Staff Management blocks deactivation if active leads exist; force a reassign-target picker first.

## 12. Duplicate Detection

In `CreateLeadWizard` and Lead Upload validation:
- Exact-match duplicate on **mobile OR PAN**.
- On Agent create: block + show existing-lead summary card (id, masked PAN, mobile, owner, status, last activity).
- On Upload: mark as duplicate row in validation step; require Data Admin override with reason.

## 13. Lead Upload, Pools, Partners (Data Admin)

Audit existing `admin/LeadUploadPage`, `admin/LeadPoolsPage`, `admin/PartnersPage`:

- Required upload fields: name, mobile, product, lead source. Recommended fields list shown.
- Validation table per §16.5; rejected reasons surfaced inline.
- Lead Pool statuses: `Unallocated | Partially Allocated | Allocated | Validation Failed | Archived`.
- Partner config form: name, integration type, products[], min credit, max FOIR, min income, status. Phase-1 integration types: `Manual | Portal | Email | API Planned | API Active`. Inactive partners hidden from Agent operational selection.

## 14. System Config

Update `SystemConfigPage` + `admin/ConfigPage`:

- Settings list (per §19.1): default capacity, max retries, retry interval, stale threshold, expiry days, priority weights+thresholds, lead sources, notification toggles.
- Capture before/after, actor, reason on every change. Mandatory reason for high-impact settings.
- Manager Agent Capacity Override + Agent Targets editors live under Group Management (already partially present — surface and audit).

## 15. Notifications

Rebuild notification matrix in `mockData.ts` and `NotificationsDrawer`:

- Drop `team` scope → use `group` (managerId-keyed).
- Notification types per §24.2 matrix; add `slp_approved`, `slp_declined`, `slp_disbursed`, `retry_exceeded`, `staff_deactivated`, `partner_changed`, `config_changed` in the Notification type union.
- Add a dedicated `/notifications` page route (one per role with sidebar entry); reuse drawer cells for the body.

## 16. Audit Trail

- `AuditTrailPage`: add filters for Action Type, Actor Role, Target Type, Date.
- Ensure every state-mutating handler currently in the codebase calls `useAudit().log` with `before/after/reason/source_screen` populated. Add a small `withAudit` helper.
- Manager-only "Activity Log" view (group-scoped, no governance/admin actions).

## 17. PII

- Mobile **always full** (calling).
- PAN **masked** by default (`ABCDE****F`) for Agent/Manager/Cluster Head; Data Admin sees full. Provide `maskPan(pan, role)` util used everywhere PAN is rendered.
- Export PII: only Data Admin; Manager exports mask PAN; Agent has no export buttons.

## 18. Missing screens (add as frontend stubs)

- `/notifications` (per role).
- `/admin/mis` — already exists; verify it covers MIS Export per §25.
- Manager `/reports` MIS — page exists; ensure "MIS & Reports" entry routes here.
- Cluster Head Lead Allocation entry routes to `/lead-allocation` (alias of admin allocation with cluster scope filter).
- Group Management: Agent Capacity Override & Targets sub-tabs.

## 19. Mock data updates

- Recompute FOIR per lead.
- Map every existing lead's stage through `LEGACY_STAGE_MAP` (e.g. `stb_submitted` → `sent_to_lp`).
- Drop visible Team labels; add `managerId` joins.
- Re-seed at least 3 leads in each new stage (`profile_correction`, `compliance_hold`, `expired`, `rejected`).
- Re-seed SLP submissions covering each new SLP status.
- Update notifications to new types/scope.

## 20. Out of scope (explicit)

- No backend / Supabase changes.
- No actual SMS, dialer, or partner-API integration.
- No fuzzy duplicate logic.
- No Team functionality re-introduction.
- No DSA marketplace.
- Historical mock data oddities outside the changed paths left as-is.

---

## Technical sequencing (build order)

1. Types + permissions + helpers (`types/lms.ts`, `lib/permissions.ts`, new `lib/leadLifecycle.ts`, `lib/slp.ts`, `lib/foir.ts`, `lib/maskPan.ts`, `lib/followUpStatus.ts` extend).
2. Mock data rewrite (`data/mockData.ts`) — drop Team display, re-seed stages, recompute FOIR, new notifications.
3. Sidebar + routes + new `/notifications` page.
4. Global label sweep (STB → SLP, hide Team).
5. Manual Call Dialog + Follow-Up logic.
6. SLP wizard + Lead Detail (readiness, lock-after-SLP, status-update modal).
7. Allocation + Reassignment + Staff deactivation flow.
8. Dashboards recompute (per role).
9. Config, Audit, Notifications drawers/pages.
10. PII masking pass.
11. Memory updates (`mem://features/lead-lifecycle`, `stb-workflow` → `slp-workflow`, `manager-portal-rules`, `role-based-access`, `audit-compliance`, index Core).

Estimated touch count: ~35–45 files. Scope is large but mechanical; built role-by-role internally even though the deliverable is one cohesive update.
