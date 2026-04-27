# LMS Prototype Hardening — Implementation Plan

This plan delivers the 9 fixes in dependency order. Mock data, role-switcher, indigo/Inter aesthetic, and shadcn/ui patterns are preserved throughout.

---

## 0. Shared foundations (built first, reused everywhere)

### 0a. `src/lib/permissions.ts` (new)
Single source of truth for role permissions.
- `ROUTE_ACCESS: Record<string, UserRole[]>` mapping every route to allowed roles:
  - `/`, `/leads`, `/leads/:id`, `/follow-ups`, `/stb`, `/performance` → all roles
  - `/reports` → manager, cluster_head, data_admin
  - `/group-*` → manager, cluster_head
  - `/org-*`, `/staff-management`, `/system-config`, `/audit-trail` → cluster_head, data_admin
  - `/admin/*` → data_admin (allocation also cluster_head)
- `can(role, action)` helpers: `canExportPII`, `canExportTeamSummary`, `canReassign`, `canEditLead`, `canSendToBank`, `canBackdateBeyond24h`, `canViewLeadSource`, `canSeeNotification(role, notif)`.
- `STB_TERMINAL_STATUSES = ["submitted","approved","declined","disbursed"]` and `isLeadLocked(lead)` helper that returns the latest blocking STB submission.

### 0b. `src/components/RouteGuard.tsx` (new)
Wraps each `<Route element={...}>` in `App.tsx`. Reads `useRole()`, checks `ROUTE_ACCESS` for `location.pathname`, and either renders children or shows the **Access Restricted** screen (`AccessRestricted.tsx`) — polished card with shield icon, role label, requested path, "Switch role" hint, and "Back to dashboard" button. No XSS, no router redirect (so URL is preserved for context).

### 0c. `src/contexts/AuditContext.tsx` (new)
Holds an in-memory `AuditEntry[]` plus `logAudit({ actorId, actorName, actorRole, action, entityType, entityId, before?, after?, reason?, notes? })`. Seeded with a few mock historical entries from `mockData`. Exposes `useAudit()`. Persisted to `sessionStorage` so audit survives page navigation in the prototype but resets on tab close. Replaces the standalone audit array currently inside `AuditTrailPage`.

### 0d. `src/data/mockData.ts` additions
- Add `actorRole` to existing `callLogs`/`notes`/`stbSubmissions` seed entries where missing.
- Add a `notificationScope` field to each `Notification`: `{ scope: "agent"|"team"|"org"|"admin", agentId?, teamId? }`.
- Helper `getNotificationsForRole(role, agentId, teamId)`.

---

## 1. Permission fix — route + action guards

**Files:** `src/App.tsx`, new `RouteGuard.tsx`, new `AccessRestricted.tsx`, `permissions.ts` (0a).

- Wrap every `<Route>` in `App.tsx` with `<RouteGuard>{element}</RouteGuard>`.
- Direct-URL access to a forbidden route renders the AccessRestricted card; the sidebar still works so the user can switch role.
- Inline action guards (using `can()` helpers) added to: Reassign button, Send to Bank button, Export buttons, Edit profile pencil, and the priority override dialog. Disabled buttons get a tooltip explaining why.

## 2. STB flow lock

**Files:** `src/pages/LeadDetailPage.tsx`, `src/pages/STBPage.tsx`, `permissions.ts`.

- Compute `lockState = isLeadLocked(lead)` once per render. If locked:
  - Show a sticky **STB Locked** banner above the tabs: bank name, submitted date, current status pill, allowed next action ("Awaiting bank decision" / "Track status only" / "Disbursed — closed").
  - Disable: Edit profile, obligation add/remove, "Add Existing Loan" dialog trigger, Bank Selection add/remove, "Send to Bank" button (replaced with "Already Sent").
  - Status updates (submitted → approved/declined/disbursed) only available to `cluster_head` and `data_admin` via a "Update STB Status" small dialog; each update writes an audit entry.
- On `STBPage.tsx`, the row-level "Send to Bank" CTA hides when `isLeadLocked` is true.

## 3. Call / disposition fix

**Files:** `src/pages/LeadDetailPage.tsx`, `src/data/mockData.ts` (extend `dispositionGroups`).

- Replace existing `CONNECTED_ORDER` / `NOT_CONNECTED_ORDER` constants with the exact lists from the request:
  - **Connected** → Hot Follow-Up, Warm Follow-Up, Document Follow-Up, Interested, Not Interested, Already Has Loan, Callback Requested.
  - **Not Connected** → No Response/Ringing, Busy, Switched Off, Invalid Number.
- Add any missing disposition types to `DispositionType` union and to `dispositionGroups()` mock data.
- "Next action = Follow-Up" branch:
  - Date+time inputs become required (validation via inline error).
  - `min` attribute on the datetime input set to `now - 24h` for agents (uses `canBackdateBeyond24h`); managers/admins unrestricted.
  - On submit: append `CallLog` + `FollowUp` + audit entry with before/after disposition.

## 4. Immutable audit log

**Files:** `AuditContext.tsx` (0c), `LeadDetailPage.tsx`, `LeadAllocationPage.tsx`, `STBPage.tsx`, `LeadUploadPage.tsx`, `MISExportPage.tsx`, `AuditTrailPage.tsx`.

- Every state-mutating handler (log call, schedule follow-up, edit profile, add/remove obligation, add/remove bank, send to bank, update STB status, reassign, override priority, allocate batch, upload file, export MIS) calls `logAudit(...)` with structured before/after.
- `LeadDetailPage` Activity Timeline tab is rebuilt to merge: call logs, follow-ups, notes, STB submissions, AND `auditEntries.filter(e => e.entityId === lead.id)` — sorted desc, each row showing actor name + role pill + relative time + action + before→after diff (when present).
- `AuditTrailPage` switches from its local mock array to `useAudit()` so all newly-created entries appear there too.

## 5. Notification scoping

**Files:** `src/data/mockData.ts`, `src/components/NotificationsDrawer.tsx`.

- Tag every mock notification with a scope (see 0d).
- Drawer reads `useRole()` and filters via `getNotificationsForRole`.
- Each notification card gets a small **X (dismiss)** button (stops propagation) that removes it from local state.
- Click on a card respects `clickTarget`: leadId → `/leads/:id`; allocation → `/admin/allocation`; export → `/admin/mis`; staff → `/staff-management`.
- Empty state when filtered list is empty.

## 6. Lead Allocation wizard

**Files:** `src/pages/LeadAllocationPage.tsx`.

Replace the current single-screen Allocate dialog with a 4-step wizard inside the same Dialog (stepper at the top):

1. **Select batch** — radio list of unallocated batches with count, source, product, upload date.
2. **Allocation mode** — Round Robin / To Group / To Team / To Specific Agent (cards with descriptions).
3. **Capacity preview** — table of candidate agents/teams with current load (`leadsAssigned`), capacity ceiling (mock 50), available headroom, and the count this allocation would add. Warns if any assignee exceeds capacity.
4. **Confirm** — summary of "X leads → Y assignees", split count per assignee, optional reason textarea.

On confirm: update batch status, call `logAudit({ action: "allocate_batch", before: {status:"awaiting"}, after: {status:"allocated", splits}, reason })`, toast success.

## 7. Reports / export gating

**Files:** `permissions.ts`, `src/pages/ReportsPage.tsx`, `src/pages/GroupReportsPage.tsx`, `src/pages/OrgReportsPage.tsx`, `src/pages/admin/MISExportPage.tsx`.

- Hide the Export button entirely for Agent role.
- Manager: only "Export team summary (no PII)" visible; PII column toggle disabled with tooltip.
- Cluster Head & Data Admin: full MIS export available, but clicking **Export with PII** opens an `AlertDialog` warning ("This export contains PAN, Mobile, Email — confirm responsibility"). Only on confirm does the mock CSV download trigger AND `logAudit({ action: "export_pii", entityType: "report", after: { rowCount, columns } })`.

## 8. Follow-Ups redesign

**File:** `src/pages/FollowUpsPage.tsx` (replace).

- Compute four buckets: **Overdue**, **Today**, **Upcoming**, **Completed**.
- Replace single table with `<Tabs>` (counts in tab labels) + a responsive layout:
  - ≥1024px: `ConfigurableTable` per tab.
  - <1024px: card list (one card per follow-up).
- Each row/card shows: Lead name + mobile, Product badge, Priority pill, Scheduled time (relative + absolute on hover), Retry count badge, Days since allocation.
- Quick actions: **Call** (toast "Dialing…" + opens lead), **Reschedule** (mini popover with new datetime → audit), **Complete** (marks status `completed` → audit).
- Filters (priority/product) preserved at the top.

## 9. UI/UX polish

**Files:** `LeadDetailPage.tsx`, all dashboards (`AgentDashboard.tsx`, `ManagerDashboard.tsx`, `ClusterHeadDashboard.tsx`, `AdminDashboard.tsx`), `EmptyState.tsx`, `ConfigurableTable.tsx`, `index.css`.

- **Primary action prominence:** lead detail header CTA derived from stage (`new`→Log Call, `contacted`→Schedule Follow-Up, `interested`→Send to Bank, `bank_selected`→Send to Bank, `stb_*`→Track Status). Secondary actions move into a `DropdownMenu` ("More").
- **Badge palette:** centralize the SOFT_PILL map from LeadDetailPage into `src/lib/badges.ts` and reuse in tables/dashboards for stage / priority / disposition / STB status consistency.
- **Spacing & hierarchy:** dashboard stat tiles unified to a single `StatTile` variant with proper title/value/delta hierarchy; remove dense double-row tables; add section dividers and `space-y-6`.
- **States:** wire `EmptyState` into Leads, Follow-Ups (per tab), STB, Reports, Allocation when results are empty; add skeleton loaders (200ms `useEffect` simulation) for dashboards; error boundary wrapping main routes shows a friendly error card.
- **Responsive tables:** `ConfigurableTable` gets a `mobileCard` render path: at `<md` it renders each row as a card with primary/secondary fields. Verified at 375 / 768 / 1280.
- Lead detail right rail collapses below the main content under 1024px.

---

## Out of scope / explicitly NOT changing
- No backend, no Supabase wiring.
- No DSA marketplace.
- Mobile numbers remain unmasked; PAN remains masked.
- Role switcher stays in the sidebar.
- No new fonts, no color system change beyond consolidating existing pills.

## Verification checklist (after implementation)
1. Switch to Agent → visit `/admin/upload` directly → see Access Restricted.
2. Open a lead with `stage = stb_submitted` → confirm STB locked banner and disabled controls.
3. Log a call: choose Not Connected → only 4 dispositions visible.
4. Schedule follow-up dated 2 days ago as Agent → blocked; as Manager → allowed.
5. Allocate a batch → wizard completes → entry appears in `/audit-trail`.
6. As Agent → Reports page shows no Export button.
7. As Cluster Head → Export PII triggers confirmation dialog, then audit entry.
8. Resize to 375px → Follow-Ups renders cards, Leads table renders cards.
