

# Plan: Update Cluster Head Flow Per PRD

## Summary
The Cluster Head currently has a minimal dashboard (4 KPI cards, source quality chart, trend chart, agent ranking, partner disbursal) and only 3 nav items (Dashboard, All Leads, Reports). The PRD defines the Cluster Head as the highest supervisory role with full org-wide visibility, staff profile management, system configuration, lead allocation, disposition overrides, audit trail, and org-wide reporting. This plan brings the Cluster Head portal in line with the PRD.

## What Gets Built

1. **Navigation** -- Expand from 3 items to ~14: Dashboard, Org Leads, Org Follow-Ups, Org STB, Staff Management, System Config, Lead Allocation, Lead Count Report, Performance, Audit Trail.

2. **Dashboard revamp** -- Four sections per PRD:
   - Organisation Pipeline Health Strip (funnel: Allocated → Contacted → STB → Approved → Disbursed with rates and total INR)
   - Manager Group Comparison Panel (table: all managers side-by-side with group size, contact rate, STB, disbursed, sortable)
   - System Alerts Panel (color-coded: managers not logged in, DND violations, unallocated pools, stale STBs, zero-activity agents, override spikes, expiry warnings)
   - Quick Navigation (9 buttons)

3. **Org Leads page** -- All leads across entire org. Columns: Customer Name, Manager, TL, Agent, Product, Source, Last Disposition, Last Activity, Days Since Allocation, Stage, Follow-Up. Filters: Manager → TL → Agent (cascading), date, stage, disposition, product, source, follow-up status, aging, search. Bulk select + org-wide reassign (Manager → TL → Agent dropdowns).

4. **Org Follow-Ups page** -- All follow-ups with Manager, TL, Agent columns. Same cascading filters.

5. **Org STB page** -- All STB leads with Manager, TL, Agent, Bank, days since submission. Inline status updates.

6. **Staff Management page** -- Create/edit/deactivate/reactivate Agents, TLs, and Managers. Agent form: name, email, phone, assigned Manager → TL (cascading), location, process assignment, allocation type, status. TL form adds team size limit. Manager form adds group name, TL capacity. Password reset button (mock). Deactivation warnings (unworked leads, open FUs, active STBs).

7. **System Configuration page** -- Configurable settings panels: Lead Sources (add/rename/deactivate), Disposition sub-types (add/rename/deactivate per category), Allocation Rules (schedule, leads/agent/day, mode, active agent definition, product matching), Retry Logic (NC sub-type retry intervals, max consecutive NC), Lead Aging/Expiry (inactivity alert, expiry threshold per product, warning window), Bureau freshness (report window, consent cooldown, max attempts), STB config (consent expiry, cooldown, max attempts), Notification config (toggle real-time vs summary per type). All changes mock-logged.

8. **Lead Allocation page** -- View unallocated lead pools (source, date, count, product). Allocate via: Assign to Group (Manager), Assign to Team (TL), Assign to Agent, or Auto Round Robin. Mock allocation with toast confirmation.

9. **Disposition Override** -- On Lead Detail when role=cluster_head, show Override button for TL-level AND Manager-level dispositions. CH dispositions cannot be self-overridden. Override logs reason, resets stage, notifies all parties. CH dispositions are absolute locks (Not Eligible / Closed Lost cannot be reopened by anyone below).

10. **CH disposition tagging** -- Call logs and dispositions by CH tagged with "Cluster Head" badge in timeline. CH Hot Follow-Up shows priority flag.

11. **Audit Trail page** -- Immutable log table with: timestamp, actor (name + role), action type, target, before/after state, reason. Filters: date range, actor/role, action type, target lead, target profile, configuration. No export button (per PRD restriction). Mock data covering dispositions, overrides, reassignments, profile changes, config changes, login events.

12. **Org Lead Count Report** -- Same as Manager report but with Manager filter at top. Table: Manager, TL, Agent, disposition category/sub-type, count. Summary rows at Manager, TL, and org level. CSV export.

13. **Org Performance page** -- Manager-level summary table (all managers side-by-side, current month, 12-month history). Cross-group comparison chart (bar/line, any metric, any time window). TL performance history (any TL, org-wide). Agent performance history (any agent, org-wide). Org-wide agent ranking (sort by any metric). CSV export.

14. **CH Notifications** -- Extend mock notifications: manager not logged in, DND risk, override spike, unallocated pool, stale STB pool, config change confirmation, staff deactivation confirmation, daily summary.

## Implementation Steps

### Step 1: Update navigation and routes
- Expand `clusterHeadNav` to ~14 items with sections
- Add routes: `/org-leads`, `/org-follow-ups`, `/org-stb`, `/staff-management`, `/system-config`, `/lead-allocation`, `/org-reports`, `/audit-trail`

### Step 2: Revamp CH Dashboard
- Pipeline health strip, manager comparison table, system alerts panel, quick-nav

### Step 3: Build Org Leads, Follow-Ups, STB pages
- Reuse Group page patterns, add Manager column and cascading Manager → TL → Agent filters
- Org-wide reassignment with 3-level dropdown

### Step 4: Build Staff Management page
- Tabbed view: Agents | TLs | Managers
- Create/Edit modals with cascading dropdowns
- Deactivate with warning dialog
- Password reset button (mock)

### Step 5: Build System Configuration page
- Accordion/tabbed panels for each config area
- Inline editable fields with save buttons
- Mock audit logging on changes

### Step 6: Build Lead Allocation page
- Unallocated pool list with allocation mode selection
- Manager → TL → Agent cascading for targeted allocation

### Step 7: Build Audit Trail page
- Filterable immutable log table with mock data
- No export (per PRD)

### Step 8: Build Org Reports and Performance pages
- Org-level lead count report with Manager filter
- Cross-group comparison charts, org-wide agent ranking

### Step 9: Update Lead Detail for CH
- Override for TL-level AND Manager-level dispositions
- CH disposition tagging and absolute lock behavior

### Step 10: Update notifications
- Add CH-specific notification types to mock data

## Technical Notes
- All client-side mock data, no backend
- ~8 new page files, ~4 modified files
- Reuse existing table/card/chart components from Manager/TL pages
- CH does not carry personal leads -- no "My Leads" section (purely supervisory per PRD)

