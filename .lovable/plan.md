

# Plan: Update Manager Flow Per PRD

## Summary
The Manager currently has a basic dashboard with 5 KPIs, a conversion funnel, approval rate chart, and bank pipeline table. The PRD defines the Manager as a triple-scope role (own production + TL supervision + group operations) with group lead management, cross-team reassignment, disposition overrides, TL notes/flags, TL target setting, group-level reporting, and agent ranking. This plan brings the Manager portal in line with the PRD.

## What Needs to Change

**Current state:** 4 nav items (Dashboard, All Leads, STB Pipeline, Reports). No group-specific views, no TL management, no cross-team reassignment, no disposition overrides, no TL notes/flags, no group performance views.

**What gets built:**

1. **Navigation** -- Expand from 4 items to 12: Dashboard, My Leads, My Follow-Ups, My STB, Group Leads, Group Follow-Ups, Group STB, Group Management, Lead Report, Performance, plus quick-nav on dashboard.

2. **Dashboard revamp** -- Three sections: Own Production (agent-style KPIs), Group Health (missed FUs, TL activity status with login/zero-activity flags, group STB/approved/disbursed), Business Performance Strip (conversion funnel: allocated > contacted > STB > approved > disbursed with rates).

3. **Group Leads page** (`/group-leads`) -- All leads across all TLs/agents. Columns: Customer Name, Assigned TL, Assigned Agent, Product, Source, Last Disposition, Last Activity, Days Since Allocation, Stage, Follow-Up Scheduled. Filters: TL (cascading to Agent), date range, stage, disposition, product, source, follow-up status, aging, search. Bulk select + reassign.

4. **Group Follow-Ups page** (`/group-follow-ups`) -- All follow-ups across group with TL and Agent columns. Filters: TL, agent, priority, date, product, overdue status.

5. **Group STB page** (`/group-stb`) -- All STB-stage leads across group with TL, Agent, Bank, days since submission. Inline status updates for non-API partners.

6. **Group Management page** (`/group-management`) -- TL overview table (login status, team size, leads assigned, worked today, FU compliance, STB, disbursed, last activity). Click TL row to expand agent-level breakdown. Group activity monitoring panel per TL. TL profile card with notes (immutable) and flags (On Leave, Performance Watch, Disposition Quality Issue, Management Quality Issue, Training Required). Set Targets modal for TLs (team-level targets). Also set targets directly for individual agents.

7. **Cross-team lead reassignment** -- From Group Leads or Lead Detail: select target TL then agent from group-scoped dropdown. Supports cross-team moves (TL A's agent to TL B's agent). STB-locked leads cannot be reassigned. Bulk reassignment supported.

8. **Disposition Override** -- On Lead Detail, when a TL-level "Not Eligible" or "Closed/Lost" disposition exists, show Override button. Override logs reason, resets lead to previous stage, notifies TL and agent. Manager-level dispositions cannot be self-overridden.

9. **Manager disposition tagging** -- When Manager logs call or disposition on group lead, tagged as "Manager" in history timeline with visual badge.

10. **Group Lead Count Report** (`/group-reports`) -- Date range, TL, agent, product, disposition filters. Table with TL Name, Agent, disposition category/sub-type, count. Summary rows at TL and group level. CSV export.

11. **Group Performance page** (enhance `/performance`) -- Own performance (agent view), TL performance history (per TL, 12 months, team-level metrics), agent performance across entire group, group summary table (all TLs side by side), agent ranking across group. CSV export.

12. **Manager Notifications** -- Extend mock notifications: TL not logged in, team missed FU threshold, 5-NC escalation with TL attribution, override confirmation, STB status on group lead, daily summary.

## Implementation Steps

### Step 1: Add routes and navigation
- Update `managerNav` in AppSidebar with 12 items organized in sections
- Add new routes in App.tsx: `/group-leads`, `/group-follow-ups`, `/group-stb`, `/group-management`, `/group-reports`

### Step 2: Revamp Manager Dashboard
- Three-section layout: Own Production, Group Health (TL activity list), Business Performance Strip (funnel with rates)
- Quick-nav buttons (9 items per PRD)

### Step 3: Build Group Leads page
- Reuse patterns from TeamLeadsPage but add TL column and cross-team reassignment
- TL filter cascades to agent filter
- Bulk select + reassign with TL > Agent dropdown

### Step 4: Build Group Follow-Ups and Group STB pages
- Similar to Team variants but with TL column added
- Group-scoped filters

### Step 5: Build Group Management page
- TL overview table with expandable agent rows
- TL profile card with notes and flags
- Set Targets modal for TLs (team-level targets)
- Agent-level target setting (bypass TL)

### Step 6: Add disposition override to Lead Detail
- Show Override button when role=manager and lead has TL-level Not Eligible or Closed/Lost
- Override modal with optional reason
- Log override in history, reset stage, toast notification

### Step 7: Build Group Reports page
- Group-level lead count report with TL/agent breakdown
- Summary rows, CSV export

### Step 8: Enhance Performance page for Manager
- Add TL selector for TL-level team performance
- Agent ranking across group
- Group summary table

### Step 9: Update mock data and notifications
- Add manager-specific notification types
- Extend mock data with group/TL relationships

## Technical Notes
- All client-side mock data, no backend
- ~5 new page files, ~4 modified files
- Reuse existing table/card/chart components and patterns from TL pages
- Manager inherits agent + TL functionality on own leads via existing pages

